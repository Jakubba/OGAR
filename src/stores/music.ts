import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'

export type TrackStatus = 'odsłuchane' | 'do odsłuchania'

export interface Track {
  id: string
  playlistId: string
  itunesId?: number
  title: string
  artist: string
  album: string
  genre: string
  platform: string
  status: TrackStatus
  rating?: number
  photoUrl?: string
  previewUrl?: string
  favorite?: boolean
  rejected?: boolean
}

export const useMusicStore = defineStore('music', () => {
  const tracks = ref<Track[]>([])
  const loading = ref(false)
  const error = ref('')
  let unsubscribe: Unsubscribe | null = null

  // Utwory odrzucone w losowaniu (z API, jeszcze niedodane do listy) — nie mają się już pojawiać
  const rejectedExternalIds = ref<Set<number>>(new Set())
  let rejectionsLoaded = false

  function watch() {
    unsubscribe?.()
    tracks.value = []
    error.value = ''
    rejectedExternalIds.value = new Set()
    rejectionsLoaded = false
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    const q = query(
      collection(db, 'users', authStore.user.uid, 'music'),
      orderBy('createdAt', 'desc'),
    )
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        tracks.value = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Track, 'id'>) }))
        loading.value = false
      },
      (err) => {
        loading.value = false
        error.value = err.message
        console.error('[music] błąd nasłuchu Firestore:', err)
      },
    )
  }

  function stopWatching() {
    unsubscribe?.()
    unsubscribe = null
  }

  async function addTrack(data: Omit<Track, 'id'>) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    const ref = await addDoc(collection(db, 'users', authStore.user.uid, 'music'), {
      ...data,
      createdAt: serverTimestamp(),
    })
    return ref.id
  }

  async function updateTrack(id: string, patch: Partial<Omit<Track, 'id'>>) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    await updateDoc(doc(db, 'users', authStore.user.uid, 'music', id), patch)
  }

  async function deleteTrack(id: string) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    await deleteDoc(doc(db, 'users', authStore.user.uid, 'music', id))
  }

  async function deleteTracksInPlaylist(playlistId: string) {
    const toDelete = tracks.value.filter((t) => t.playlistId === playlistId)
    await Promise.all(toDelete.map((t) => deleteTrack(t.id)))
  }

  async function loadRejectedExternal() {
    const authStore = useAuthStore()
    if (!authStore.user || rejectionsLoaded) return
    rejectionsLoaded = true
    const snap = await getDocs(collection(db, 'users', authStore.user.uid, 'musicDiscoveryRejections'))
    rejectedExternalIds.value = new Set(snap.docs.map((d) => (d.data() as { itunesId: number }).itunesId))
  }

  async function rejectExternalTrack(itunesId: number) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    rejectedExternalIds.value.add(itunesId)
    await addDoc(collection(db, 'users', authStore.user.uid, 'musicDiscoveryRejections'), { itunesId })
  }

  return {
    tracks,
    loading,
    error,
    watch,
    stopWatching,
    addTrack,
    updateTrack,
    deleteTrack,
    deleteTracksInPlaylist,
    rejectedExternalIds,
    loadRejectedExternal,
    rejectExternalTrack,
  }
})
