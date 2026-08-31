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

export type MovieStatus = 'obejrzany' | 'do obejrzenia'

export interface Movie {
  id: string
  tmdbId?: number
  mediaType?: 'movie' | 'tv'
  title: string
  platform: string
  category: string
  status: MovieStatus
  rating?: number
  photoUrl?: string
  favorite?: boolean
  rejected?: boolean
}

export const useMoviesStore = defineStore('movies', () => {
  const movies = ref<Movie[]>([])
  const loading = ref(false)
  const error = ref('')
  let unsubscribe: Unsubscribe | null = null

  // Tytuły odrzucone w losowaniu (z API, jeszcze niedodane do listy) — nie mają się już pojawiać
  const rejectedExternalKeys = ref<Set<string>>(new Set())
  let rejectionsLoaded = false

  function watch() {
    unsubscribe?.()
    movies.value = []
    error.value = ''
    rejectedExternalKeys.value = new Set()
    rejectionsLoaded = false
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    const q = query(
      collection(db, 'users', authStore.user.uid, 'movies'),
      orderBy('createdAt', 'desc'),
    )
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        movies.value = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Movie, 'id'>) }))
        loading.value = false
      },
      (err) => {
        loading.value = false
        error.value = err.message
        console.error('[movies] błąd nasłuchu Firestore:', err)
      },
    )
  }

  function stopWatching() {
    unsubscribe?.()
    unsubscribe = null
  }

  async function addMovie(data: Omit<Movie, 'id'>) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    const ref = await addDoc(collection(db, 'users', authStore.user.uid, 'movies'), {
      ...data,
      createdAt: serverTimestamp(),
    })
    return ref.id
  }

  async function updateMovie(id: string, patch: Partial<Omit<Movie, 'id'>>) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    await updateDoc(doc(db, 'users', authStore.user.uid, 'movies', id), patch)
  }

  async function deleteMovie(id: string) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    await deleteDoc(doc(db, 'users', authStore.user.uid, 'movies', id))
  }

  async function loadRejectedExternal() {
    const authStore = useAuthStore()
    if (!authStore.user || rejectionsLoaded) return
    rejectionsLoaded = true
    const snap = await getDocs(collection(db, 'users', authStore.user.uid, 'movieDiscoveryRejections'))
    rejectedExternalKeys.value = new Set(snap.docs.map((d) => (d.data() as { key: string }).key))
  }

  async function rejectExternalTitle(tmdbId: number, mediaType: 'movie' | 'tv') {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    const key = `${mediaType}:${tmdbId}`
    rejectedExternalKeys.value.add(key)
    await addDoc(collection(db, 'users', authStore.user.uid, 'movieDiscoveryRejections'), { key })
  }

  return {
    movies,
    loading,
    error,
    watch,
    stopWatching,
    addMovie,
    updateMovie,
    deleteMovie,
    rejectedExternalKeys,
    loadRejectedExternal,
    rejectExternalTitle,
  }
})
