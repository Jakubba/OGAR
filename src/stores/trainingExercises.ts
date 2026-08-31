import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth'
import { EXERCISE_CATALOG, type Exercise } from '@/data/exercises'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'

export type ExerciseSource = 'catalog' | 'custom'
export type CatalogExercise = Exercise & { source: ExerciseSource }

export const useTrainingExercisesStore = defineStore('trainingExercises', () => {
  const custom = ref<CatalogExercise[]>([])
  const loading = ref(false)
  const error = ref('')
  let unsubscribe: Unsubscribe | null = null

  const catalog = computed<CatalogExercise[]>(() => EXERCISE_CATALOG.map((e) => ({ ...e, source: 'catalog' as const })))
  const all = computed<CatalogExercise[]>(() => [...catalog.value, ...custom.value])

  function watch() {
    unsubscribe?.()
    custom.value = []
    error.value = ''
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    const q = query(
      collection(db, 'users', authStore.user.uid, 'trainingExercises'),
      orderBy('createdAt', 'desc'),
    )
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        custom.value = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<Exercise, 'id'>),
          id: d.id,
          source: 'custom' as const,
        }))
        loading.value = false
      },
      (err) => {
        loading.value = false
        error.value = err.message
        console.error('[trainingExercises] błąd nasłuchu Firestore:', err)
      },
    )
  }

  function stopWatching() {
    unsubscribe?.()
    unsubscribe = null
  }

  async function addCustomExercise(data: Omit<Exercise, 'id'>) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    await addDoc(collection(db, 'users', authStore.user.uid, 'trainingExercises'), {
      ...data,
      createdAt: serverTimestamp(),
    })
  }

  async function deleteCustomExercise(exerciseId: string) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    await deleteDoc(doc(db, 'users', authStore.user.uid, 'trainingExercises', exerciseId))
  }

  return {
    custom,
    catalog,
    all,
    loading,
    error,
    watch,
    stopWatching,
    addCustomExercise,
    deleteCustomExercise,
  }
})
