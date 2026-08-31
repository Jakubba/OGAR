import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'

export interface Playlist {
  id: string
  name: string
}

export const useMusicPlaylistsStore = defineStore('musicPlaylists', () => {
  const playlists = ref<Playlist[]>([])
  const loading = ref(false)
  const error = ref('')
  let unsubscribe: Unsubscribe | null = null

  function watch() {
    unsubscribe?.()
    playlists.value = []
    error.value = ''
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    const q = query(
      collection(db, 'users', authStore.user.uid, 'musicPlaylists'),
      orderBy('createdAt', 'asc'),
    )
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        playlists.value = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Playlist, 'id'>) }))
        loading.value = false
      },
      (err) => {
        loading.value = false
        error.value = err.message
        console.error('[musicPlaylists] błąd nasłuchu Firestore:', err)
      },
    )
  }

  function stopWatching() {
    unsubscribe?.()
    unsubscribe = null
  }

  async function createPlaylist(name: string) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    const ref = await addDoc(collection(db, 'users', authStore.user.uid, 'musicPlaylists'), {
      name,
      createdAt: serverTimestamp(),
    })
    return ref.id
  }

  async function renamePlaylist(id: string, name: string) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    await updateDoc(doc(db, 'users', authStore.user.uid, 'musicPlaylists', id), { name })
  }

  async function deletePlaylist(id: string) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    await deleteDoc(doc(db, 'users', authStore.user.uid, 'musicPlaylists', id))
  }

  return { playlists, loading, error, watch, stopWatching, createPlaylist, renamePlaylist, deletePlaylist }
})
