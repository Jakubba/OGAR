<script setup lang="ts">
import { computed, ref } from 'vue'
import { CalendarOff, PlayCircle } from 'lucide-vue-next'
import { useTrainingPlansStore } from '@/stores/trainingPlans'
import { useTrainingSessionsStore, type SessionDraft, type TrainingSession } from '@/stores/trainingSessions'
import { iconForExercise } from '@/data/exercises'
import WorkoutRunner from '@/components/training/WorkoutRunner.vue'
import WorkoutSummary from '@/components/training/WorkoutSummary.vue'

const plansStore = useTrainingPlansStore()
const sessionsStore = useTrainingSessionsStore()

const todayPlan = computed(() => plansStore.planForWeekday())

const running = ref(false)
const finishedSession = ref<TrainingSession | null>(null)
const saving = ref(false)
const saveError = ref('')

function start() {
  finishedSession.value = null
  running.value = true
}

async function onFinished(draft: SessionDraft) {
  running.value = false
  saving.value = true
  saveError.value = ''
  try {
    finishedSession.value = await sessionsStore.saveSession(draft)
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Nie udało się zapisać treningu.'
  } finally {
    saving.value = false
  }
}

function onCancelled() {
  running.value = false
}
</script>

<template>
  <div class="space-y-6">
    <WorkoutRunner v-if="running && todayPlan" :plan="todayPlan" @finished="onFinished" @cancelled="onCancelled" />

    <div v-else-if="saving" class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-10 text-center text-sm text-slate-500">
      Zapisywanie treningu...
    </div>

    <div v-else-if="finishedSession" class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 space-y-4">
      <h3 class="text-lg font-bold text-slate-900 dark:text-white">Trening zakończony 🎉</h3>
      <WorkoutSummary :session="finishedSession" />
      <button type="button" @click="finishedSession = null" class="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline">
        Wróć do dzisiejszego planu
      </button>
    </div>

    <div v-else-if="todayPlan" class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 space-y-4">
      <div>
        <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold">Plan na dziś</p>
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ todayPlan.name }}</h3>
        <p class="text-xs text-slate-500">{{ todayPlan.exercises.length }} ćwiczeń</p>
      </div>

      <div class="space-y-1.5">
        <div v-for="pe in todayPlan.exercises" :key="pe.id" class="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900/50 text-sm text-slate-700 dark:text-slate-300">
          <component :is="iconForExercise(pe.icon)" class="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
          <span class="flex-1 min-w-0 truncate">{{ pe.name }}</span>
          <span class="text-xs text-slate-500 shrink-0">{{ pe.sets }} × {{ pe.isTimed ? `${pe.durationSeconds}s` : pe.reps }}</span>
        </div>
      </div>

      <button
        type="button"
        :disabled="!todayPlan.exercises.length"
        @click="start"
        class="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-orange-500 text-black hover:bg-orange-400 transition-colors disabled:opacity-50"
      >
        <PlayCircle class="w-5 h-5" /> Rozpocznij trening
      </button>
    </div>

    <div v-else class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-sm text-slate-500 flex flex-col items-center gap-3">
      <CalendarOff class="w-8 h-8 text-slate-300 dark:text-slate-700" />
      Na dziś nie masz przypisanego planu treningowego. Przejdź do zakładki „Plan”, aby go utworzyć.
    </div>

    <p v-if="saveError" class="text-xs text-red-500">{{ saveError }}</p>
  </div>
</template>
