import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth'
import { todayWeekday } from '@/lib/training'
import type { ExerciseSource } from '@/stores/trainingExercises'
import type { Weekday } from '@/data/exercises'
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

export interface PlanExercise {
  id: string
  exerciseId: string
  exerciseSource: ExerciseSource
  name: string
  icon: string
  met: number
  isTimed: boolean
  sets: number
  reps?: number
  durationSeconds?: number
  restSeconds: number
  weightKg?: number
}

export interface TrainingPlan {
  id: string
  name: string
  days: Weekday[]
  exercises: PlanExercise[]
}

export type NewPlanExercise = Omit<PlanExercise, 'id'>

export const useTrainingPlansStore = defineStore('trainingPlans', () => {
  const plans = ref<TrainingPlan[]>([])
  const loading = ref(false)
  const error = ref('')
  let unsubscribe: Unsubscribe | null = null

  function watch() {
    unsubscribe?.()
    plans.value = []
    error.value = ''
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    const q = query(
      collection(db, 'users', authStore.user.uid, 'trainingPlans'),
      orderBy('createdAt', 'desc'),
    )
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        plans.value = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TrainingPlan, 'id'>) }))
        loading.value = false
      },
      (err) => {
        loading.value = false
        error.value = err.message
        console.error('[trainingPlans] błąd nasłuchu Firestore:', err)
      },
    )
  }

  function stopWatching() {
    unsubscribe?.()
    unsubscribe = null
  }

  function planDocRef(planId: string) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    return doc(db, 'users', authStore.user.uid, 'trainingPlans', planId)
  }

  async function createPlan(name: string, days: Weekday[] = []) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    const ref = await addDoc(collection(db, 'users', authStore.user.uid, 'trainingPlans'), {
      name,
      days,
      exercises: [] as PlanExercise[],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }

  async function deletePlan(planId: string) {
    await deleteDoc(planDocRef(planId))
  }

  async function renamePlan(planId: string, name: string) {
    await updateDoc(planDocRef(planId), { name, updatedAt: serverTimestamp() })
  }

  async function setPlanDays(plan: TrainingPlan, days: Weekday[]) {
    await updateDoc(planDocRef(plan.id), { days, updatedAt: serverTimestamp() })
  }

  async function savePlanExercises(planId: string, exercises: PlanExercise[]) {
    await updateDoc(planDocRef(planId), { exercises, updatedAt: serverTimestamp() })
  }

  function addExerciseToPlan(plan: TrainingPlan, exercise: NewPlanExercise) {
    const exercises = [...plan.exercises, { ...exercise, id: crypto.randomUUID() }]
    return savePlanExercises(plan.id, exercises)
  }

  function updatePlanExercise(plan: TrainingPlan, planExerciseId: string, patch: Partial<PlanExercise>) {
    const exercises = plan.exercises.map((e) => (e.id === planExerciseId ? { ...e, ...patch } : e))
    return savePlanExercises(plan.id, exercises)
  }

  function removePlanExercise(plan: TrainingPlan, planExerciseId: string) {
    const exercises = plan.exercises.filter((e) => e.id !== planExerciseId)
    return savePlanExercises(plan.id, exercises)
  }

  function reorderPlanExercise(plan: TrainingPlan, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return Promise.resolve()
    const exercises = [...plan.exercises]
    const [moved] = exercises.splice(fromIndex, 1)
    if (!moved) return Promise.resolve()
    exercises.splice(toIndex, 0, moved)
    return savePlanExercises(plan.id, exercises)
  }

  function planForWeekday(weekday: Weekday = todayWeekday()) {
    return plans.value.find((p) => p.days.includes(weekday)) ?? null
  }

  return {
    plans,
    loading,
    error,
    watch,
    stopWatching,
    createPlan,
    deletePlan,
    renamePlan,
    setPlanDays,
    savePlanExercises,
    addExerciseToPlan,
    updatePlanExercise,
    removePlanExercise,
    reorderPlanExercise,
    planForWeekday,
  }
})
