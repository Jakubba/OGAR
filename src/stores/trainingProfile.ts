import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth'
import { toDateKey } from '@/lib/training'
import { doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore'

export interface WeightEntry {
  id: string
  date: string
  weightKg: number
}

export interface TrainingProfile {
  goalWeightKg: number | null
  weightLog: WeightEntry[]
}

export const useTrainingProfileStore = defineStore('trainingProfile', () => {
  const profile = ref<TrainingProfile>({ goalWeightKg: null, weightLog: [] })
  const loading = ref(false)
  const error = ref('')
  let unsubscribe: Unsubscribe | null = null

  function profileDocRef() {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    return doc(db, 'users', authStore.user.uid, 'trainingProfile', 'main')
  }

  function watch() {
    unsubscribe?.()
    profile.value = { goalWeightKg: null, weightLog: [] }
    error.value = ''
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    unsubscribe = onSnapshot(
      profileDocRef(),
      (snapshot) => {
        const data = snapshot.data() as Partial<TrainingProfile> | undefined
        profile.value = {
          goalWeightKg: data?.goalWeightKg ?? null,
          weightLog: data?.weightLog ?? [],
        }
        loading.value = false
      },
      (err) => {
        loading.value = false
        error.value = err.message
        console.error('[trainingProfile] błąd nasłuchu Firestore:', err)
      },
    )
  }

  function stopWatching() {
    unsubscribe?.()
    unsubscribe = null
  }

  async function setGoalWeight(goalWeightKg: number | null) {
    await setDoc(profileDocRef(), { goalWeightKg }, { merge: true })
  }

  async function addWeightEntry(weightKg: number, date: string = toDateKey(new Date())) {
    const weightLog = [...profile.value.weightLog, { id: crypto.randomUUID(), date, weightKg }]
    await setDoc(profileDocRef(), { weightLog }, { merge: true })
  }

  async function removeWeightEntry(entryId: string) {
    const weightLog = profile.value.weightLog.filter((e) => e.id !== entryId)
    await setDoc(profileDocRef(), { weightLog }, { merge: true })
  }

  return {
    profile,
    loading,
    error,
    watch,
    stopWatching,
    setGoalWeight,
    addWeightEntry,
    removeWeightEntry,
  }
})
