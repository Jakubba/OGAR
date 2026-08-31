<script setup lang="ts">
import { Clock, Dumbbell, Flame, ListChecks, TrendingDown, TrendingUp, Weight } from 'lucide-vue-next'
import type { TrainingSession } from '@/stores/trainingSessions'

const props = defineProps<{ session: TrainingSession }>()

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m} min${s ? ` ${s} s` : ''}`
}

function deltaLabel(value: number, suffix = '') {
  if (value === 0) return `bez zmian${suffix}`
  const sign = value > 0 ? '+' : ''
  return `${sign}${value}${suffix}`
}
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/60">
        <Clock class="w-4 h-4 text-orange-600 dark:text-orange-400 mb-1" />
        <p class="text-sm font-bold text-slate-900 dark:text-white">{{ formatDuration(props.session.durationSeconds) }}</p>
        <p class="text-[10px] text-slate-500">Czas treningu</p>
      </div>
      <div class="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/60">
        <ListChecks class="w-4 h-4 text-orange-600 dark:text-orange-400 mb-1" />
        <p class="text-sm font-bold text-slate-900 dark:text-white">{{ props.session.completedSets }}/{{ props.session.totalPlannedSets }}</p>
        <p class="text-[10px] text-slate-500">Wykonane serie ({{ props.session.percentComplete }}%)</p>
      </div>
      <div class="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/60">
        <Flame class="w-4 h-4 text-orange-600 dark:text-orange-400 mb-1" />
        <p class="text-sm font-bold text-slate-900 dark:text-white">~{{ props.session.estimatedKcal }} kcal</p>
        <p class="text-[10px] text-slate-500">Szacunkowe spalanie</p>
      </div>
      <div class="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/60">
        <Weight class="w-4 h-4 text-orange-600 dark:text-orange-400 mb-1" />
        <p class="text-sm font-bold text-slate-900 dark:text-white">{{ props.session.volumeKg }} kg</p>
        <p class="text-[10px] text-slate-500">Objętość treningowa</p>
      </div>
    </div>

    <div v-if="props.session.deltaVsPrevious" class="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex flex-wrap gap-x-5 gap-y-1 text-xs text-orange-700 dark:text-orange-300">
      <span class="flex items-center gap-1">
        <component :is="props.session.deltaVsPrevious.completedSetsDelta >= 0 ? TrendingUp : TrendingDown" class="w-3.5 h-3.5" />
        Serie: {{ deltaLabel(props.session.deltaVsPrevious.completedSetsDelta) }}
      </span>
      <span class="flex items-center gap-1">
        <component :is="props.session.deltaVsPrevious.volumeKgDelta >= 0 ? TrendingUp : TrendingDown" class="w-3.5 h-3.5" />
        Objętość: {{ deltaLabel(props.session.deltaVsPrevious.volumeKgDelta, ' kg') }}
      </span>
      <span class="flex items-center gap-1">
        <component :is="props.session.deltaVsPrevious.durationSecondsDelta >= 0 ? TrendingUp : TrendingDown" class="w-3.5 h-3.5" />
        Czas: {{ deltaLabel(Math.round(props.session.deltaVsPrevious.durationSecondsDelta / 60), ' min') }}
      </span>
      <span class="text-orange-500/70">względem poprzedniego treningu tego planu</span>
    </div>

    <div class="space-y-1.5">
      <div v-for="ex in props.session.exercises" :key="ex.planExerciseId" class="flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900/50">
        <span class="flex items-center gap-2 min-w-0 text-slate-700 dark:text-slate-300">
          <Dumbbell class="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span class="truncate">{{ ex.name }}</span>
        </span>
        <span class="text-slate-500 shrink-0">{{ ex.setsCompleted }}/{{ ex.setsPlanned }} serii</span>
      </div>
    </div>
  </div>
</template>
