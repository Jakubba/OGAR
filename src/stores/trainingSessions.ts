import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth'
import { useTrainingProfileStore } from '@/stores/trainingProfile'
import { buildDeltaVsPrevious, computeRegularityPct, computeStreak, estimateKcal, type SessionDelta } from '@/lib/training'
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'

const DEFAULT_WEIGHT_KG = 75

export interface SessionExerciseLog {
  planExerciseId: string
  name: string
  met: number
  isTimed: boolean
  setsCompleted: number
  setsPlanned: number
  repsLogged: number[]
  weightKg?: number
  activeSeconds: number
}

export interface TrainingSession {
  id: string
  planId: string | null
  planName: string
  date: string
  startedAt: Timestamp
  finishedAt: Timestamp
  durationSeconds: number
  exercises: SessionExerciseLog[]
  totalPlannedSets: number
  completedSets: number
  totalReps: number
  volumeKg: number
  estimatedKcal: number
  percentComplete: number
  deltaVsPrevious: SessionDelta | null
}

export type SessionDraft = Omit<
  TrainingSession,
  'id' | 'volumeKg' | 'estimatedKcal' | 'deltaVsPrevious' | 'startedAt' | 'finishedAt'
> & { startedAt: Date; finishedAt: Date }

export const useTrainingSessionsStore = defineStore('trainingSessions', () => {
  const sessions = ref<TrainingSession[]>([])
  const loading = ref(false)
  const error = ref('')
  let unsubscribe: Unsubscribe | null = null

  function watch() {
    unsubscribe?.()
    sessions.value = []
    error.value = ''
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    const q = query(
      collection(db, 'users', authStore.user.uid, 'trainingSessions'),
      orderBy('date', 'desc'),
    )
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        sessions.value = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TrainingSession, 'id'>) }))
        loading.value = false
      },
      (err) => {
        loading.value = false
        error.value = err.message
        console.error('[trainingSessions] błąd nasłuchu Firestore:', err)
      },
    )
  }

  function stopWatching() {
    unsubscribe?.()
    unsubscribe = null
  }

  function latestSessionForPlan(planId: string | null) {
    if (!planId) return null
    return sessions.value.find((s) => s.planId === planId) ?? null
  }

  async function saveSession(draft: SessionDraft) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')

    const profileStore = useTrainingProfileStore()
    const latestWeight = profileStore.profile.weightLog.at(-1)?.weightKg ?? DEFAULT_WEIGHT_KG

    const volumeKg = draft.exercises.reduce((sum, ex) => {
      if (ex.isTimed || !ex.weightKg) return sum
      const totalReps = ex.repsLogged.reduce((a, b) => a + b, 0)
      return sum + ex.weightKg * totalReps
    }, 0)

    const estimatedKcal = draft.exercises.reduce(
      (sum, ex) => sum + estimateKcal(ex.met, latestWeight, ex.activeSeconds),
      0,
    )

    const previous = latestSessionForPlan(draft.planId)
    const deltaVsPrevious = buildDeltaVsPrevious(
      { completedSets: draft.completedSets, volumeKg, durationSeconds: draft.durationSeconds },
      previous
        ? { completedSets: previous.completedSets, volumeKg: previous.volumeKg, durationSeconds: previous.durationSeconds }
        : null,
    )

    const computedFields = {
      volumeKg: Math.round(volumeKg * 10) / 10,
      estimatedKcal,
      deltaVsPrevious,
    }

    const ref = await addDoc(collection(db, 'users', authStore.user.uid, 'trainingSessions'), {
      ...draft,
      ...computedFields,
    })

    const saved: TrainingSession = {
      ...draft,
      ...computedFields,
      id: ref.id,
      startedAt: Timestamp.fromDate(draft.startedAt),
      finishedAt: Timestamp.fromDate(draft.finishedAt),
    }
    return saved
  }

  const sessionsByDateKey = computed(() => {
    const map = new Map<string, TrainingSession>()
    for (const s of sessions.value) map.set(s.date, s)
    return map
  })

  const currentStreak = computed(() => computeStreak(new Set(sessions.value.map((s) => s.date))))
  const regularityPct = computed(() => computeRegularityPct(sessions.value.map((s) => s.date)))

  return {
    sessions,
    loading,
    error,
    watch,
    stopWatching,
    saveSession,
    latestSessionForPlan,
    sessionsByDateKey,
    currentStreak,
    regularityPct,
  }
})
