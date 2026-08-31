<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { Check, Clock, SkipForward, X } from 'lucide-vue-next'
import type { TrainingPlan } from '@/stores/trainingPlans'
import type { SessionDraft, SessionExerciseLog } from '@/stores/trainingSessions'
import { iconForExercise } from '@/data/exercises'
import { toDateKey } from '@/lib/training'

const props = defineProps<{ plan: TrainingPlan }>()
const emit = defineEmits<{ finished: [draft: SessionDraft]; cancelled: [] }>()

type Phase = 'exercise' | 'rest'

const currentExerciseIndex = ref(0)
const currentSetIndex = ref(0)
const phase = ref<Phase>('exercise')
const restRemaining = ref(0)
const setTimeRemaining = ref(0)
const startedAt = ref(new Date())
const elapsedSeconds = ref(0)
const exerciseStartedAt = ref(Date.now())
const repsInput = ref(0)
const weightInput = ref(0)
const logs = reactive<Record<string, SessionExerciseLog>>({})

let elapsedTimerId: number | null = null
let restTimerId: number | null = null
let setTimerId: number | null = null

const currentExercise = computed(() => props.plan.exercises[currentExerciseIndex.value])
const isLastExercise = computed(() => currentExerciseIndex.value >= props.plan.exercises.length - 1)

function clearRestTimer() {
  if (restTimerId) {
    clearInterval(restTimerId)
    restTimerId = null
  }
}

function clearSetTimer() {
  if (setTimerId) {
    clearInterval(setTimerId)
    setTimerId = null
  }
}

function primeInputsForCurrentExercise() {
  const pe = currentExercise.value
  if (!pe) return
  repsInput.value = pe.reps ?? 10
  weightInput.value = pe.weightKg ?? 0
}

function startTimedSet() {
  const pe = currentExercise.value
  if (!pe?.isTimed) return
  setTimeRemaining.value = pe.durationSeconds ?? 30
  clearSetTimer()
  setTimerId = window.setInterval(() => {
    setTimeRemaining.value--
    if (setTimeRemaining.value <= 0) {
      clearSetTimer()
      logCurrentSet()
    }
  }, 1000)
}

onMounted(() => {
  elapsedTimerId = window.setInterval(() => {
    elapsedSeconds.value++
  }, 1000)
  exerciseStartedAt.value = Date.now()
  primeInputsForCurrentExercise()
  startTimedSet()
})

onUnmounted(() => {
  if (elapsedTimerId) clearInterval(elapsedTimerId)
  clearRestTimer()
  clearSetTimer()
})

function logCurrentSet() {
  const pe = currentExercise.value
  if (!pe) return

  const log =
    logs[pe.id] ??
    (logs[pe.id] = {
      planExerciseId: pe.id,
      name: pe.name,
      met: pe.met,
      isTimed: pe.isTimed,
      setsCompleted: 0,
      setsPlanned: pe.sets,
      repsLogged: [],
      weightKg: pe.isTimed ? undefined : weightInput.value || undefined,
      activeSeconds: 0,
    })

  log.setsCompleted++
  log.repsLogged.push(pe.isTimed ? (pe.durationSeconds ?? 0) : repsInput.value || 0)
  if (!pe.isTimed && weightInput.value) log.weightKg = weightInput.value

  if (currentSetIndex.value < pe.sets - 1) {
    currentSetIndex.value++
    startRest(pe.restSeconds)
  } else {
    finishCurrentExercise()
  }
}

function startRest(seconds: number) {
  if (!seconds) {
    phase.value = 'exercise'
    startTimedSet()
    return
  }
  phase.value = 'rest'
  restRemaining.value = seconds
  clearRestTimer()
  restTimerId = window.setInterval(() => {
    restRemaining.value--
    if (restRemaining.value <= 0) skipRest()
  }, 1000)
}

function skipRest() {
  clearRestTimer()
  phase.value = 'exercise'
  startTimedSet()
}

function finishCurrentExercise() {
  const pe = currentExercise.value
  const log = logs[pe.id]
  if (log) log.activeSeconds = Math.max(1, Math.round((Date.now() - exerciseStartedAt.value) / 1000))

  if (!isLastExercise.value) {
    currentExerciseIndex.value++
    currentSetIndex.value = 0
    exerciseStartedAt.value = Date.now()
    phase.value = 'exercise'
    primeInputsForCurrentExercise()
    startTimedSet()
  } else {
    finish()
  }
}

function buildDraft(): SessionDraft {
  const exerciseLogs = Object.values(logs)
  const totalPlannedSets = props.plan.exercises.reduce((sum, e) => sum + e.sets, 0)
  const completedSets = exerciseLogs.reduce((sum, l) => sum + l.setsCompleted, 0)
  const totalReps = exerciseLogs
    .filter((l) => !l.isTimed)
    .reduce((sum, l) => sum + l.repsLogged.reduce((a, b) => a + b, 0), 0)

  return {
    planId: props.plan.id,
    planName: props.plan.name,
    date: toDateKey(new Date()),
    startedAt: startedAt.value,
    finishedAt: new Date(),
    durationSeconds: elapsedSeconds.value,
    exercises: exerciseLogs,
    totalPlannedSets,
    completedSets,
    totalReps,
    percentComplete: totalPlannedSets ? Math.round((completedSets / totalPlannedSets) * 100) : 0,
  }
}

function cleanupTimers() {
  if (elapsedTimerId) clearInterval(elapsedTimerId)
  clearRestTimer()
  clearSetTimer()
}

function finish() {
  cleanupTimers()
  emit('finished', buildDraft())
}

function finishEarly() {
  const pe = currentExercise.value
  const log = logs[pe?.id ?? '']
  if (log) log.activeSeconds = Math.max(1, Math.round((Date.now() - exerciseStartedAt.value) / 1000))
  finish()
}

function cancel() {
  cleanupTimers()
  emit('cancelled')
}
</script>

<template>
  <div class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="min-w-0">
        <p class="text-xs text-slate-500 truncate">{{ props.plan.name }} · Ćwiczenie {{ currentExerciseIndex + 1 }}/{{ props.plan.exercises.length }}</p>
        <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 min-w-0">
          <component :is="iconForExercise(currentExercise.icon)" class="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0" />
          <span class="truncate">{{ currentExercise.name }}</span>
        </h3>
      </div>
      <div class="flex items-center gap-1.5 text-sm font-semibold text-slate-500 shrink-0">
        <Clock class="w-4 h-4" />
        {{ String(Math.floor(elapsedSeconds / 60)).padStart(2, '0') }}:{{ String(elapsedSeconds % 60).padStart(2, '0') }}
      </div>
    </div>

    <div v-if="phase === 'exercise'" class="text-center py-6 space-y-4">
      <p class="text-sm text-slate-500">Seria {{ currentSetIndex + 1 }}/{{ currentExercise.sets }}</p>

      <div v-if="currentExercise.isTimed" class="text-4xl font-black text-slate-900 dark:text-white tabular-nums">
        {{ setTimeRemaining }}s
      </div>
      <div v-else class="flex items-center justify-center gap-4">
        <label class="text-xs text-slate-500 flex flex-col items-center gap-1">
          Powtórzenia
          <input v-model.number="repsInput" type="number" min="0" class="w-20 text-center px-2 py-2 rounded-lg text-lg font-bold bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" />
        </label>
        <label class="text-xs text-slate-500 flex flex-col items-center gap-1">
          Ciężar (kg)
          <input v-model.number="weightInput" type="number" min="0" class="w-20 text-center px-2 py-2 rounded-lg text-lg font-bold bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" />
        </label>
      </div>

      <button
        v-if="!currentExercise.isTimed"
        type="button"
        @click="logCurrentSet"
        class="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl text-sm font-bold bg-orange-500 text-black hover:bg-orange-400 transition-colors"
      >
        <Check class="w-4 h-4" /> Zakończ serię
      </button>
    </div>

    <div v-else class="text-center py-6 space-y-3">
      <p class="text-sm text-slate-500">Przerwa</p>
      <div class="text-4xl font-black text-orange-600 dark:text-orange-400 tabular-nums">{{ restRemaining }}s</div>
      <button
        type="button"
        @click="skipRest"
        class="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        <SkipForward class="w-4 h-4" /> Pomiń przerwę
      </button>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
      <button type="button" @click="cancel" class="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors">
        <X class="w-3.5 h-3.5" /> Anuluj trening
      </button>
      <button type="button" @click="finishEarly" class="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
        Zakończ trening teraz
      </button>
    </div>
  </div>
</template>
