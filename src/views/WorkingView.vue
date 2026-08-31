<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { CalendarDays, Dumbbell, LineChart, ListChecks, Sparkles } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useTrainingExercisesStore } from '@/stores/trainingExercises'
import { useTrainingPlansStore } from '@/stores/trainingPlans'
import { useTrainingProfileStore } from '@/stores/trainingProfile'
import { useTrainingSessionsStore } from '@/stores/trainingSessions'
import TrainingToday from '@/components/training/TrainingToday.vue'
import TrainingPlanBuilder from '@/components/training/TrainingPlanBuilder.vue'
import ExerciseLibrary from '@/components/training/ExerciseLibrary.vue'
import TrainingCalendar from '@/components/training/TrainingCalendar.vue'
import TrainingProgress from '@/components/training/TrainingProgress.vue'

const authStore = useAuthStore()
const exercisesStore = useTrainingExercisesStore()
const plansStore = useTrainingPlansStore()
const profileStore = useTrainingProfileStore()
const sessionsStore = useTrainingSessionsStore()

watch(
  () => authStore.user?.uid,
  () => {
    exercisesStore.watch()
    plansStore.watch()
    profileStore.watch()
    sessionsStore.watch()
  },
  { immediate: true },
)

onUnmounted(() => {
  exercisesStore.stopWatching()
  plansStore.stopWatching()
  profileStore.stopWatching()
  sessionsStore.stopWatching()
})

type TabKey = 'today' | 'plan' | 'library' | 'calendar' | 'progress'

const tabs: { key: TabKey; label: string; icon: unknown }[] = [
  { key: 'today', label: 'Dzisiaj', icon: Sparkles },
  { key: 'plan', label: 'Plan', icon: ListChecks },
  { key: 'library', label: 'Ćwiczenia', icon: Dumbbell },
  { key: 'calendar', label: 'Kalendarz', icon: CalendarDays },
  { key: 'progress', label: 'Postępy', icon: LineChart },
]

const activeTab = ref<TabKey>('today')
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
    <div class="flex items-center gap-3">
      <Dumbbell class="w-7 h-7 text-orange-600 dark:text-orange-400" />
      <div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-wide uppercase">Working</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">Ćwiczenia — plan i wykonanie</p>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        @click="activeTab = tab.key"
        :class="[
          'flex items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border',
          activeTab === tab.key
            ? 'bg-gradient-to-r from-orange-500/20 to-transparent border-orange-500/50 text-orange-600 dark:text-orange-400'
            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40',
        ]"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <TrainingToday v-if="activeTab === 'today'" />
    <TrainingPlanBuilder v-else-if="activeTab === 'plan'" />
    <ExerciseLibrary v-else-if="activeTab === 'library'" />
    <TrainingCalendar v-else-if="activeTab === 'calendar'" />
    <TrainingProgress v-else-if="activeTab === 'progress'" />
  </div>
</template>
