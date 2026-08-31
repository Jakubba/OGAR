<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Flame, Plus, Target, TrendingUp, Trash2 } from 'lucide-vue-next'
import { useTrainingProfileStore } from '@/stores/trainingProfile'
import { useTrainingSessionsStore } from '@/stores/trainingSessions'

const profileStore = useTrainingProfileStore()
const sessionsStore = useTrainingSessionsStore()

const newWeight = ref<number | null>(null)
const weightError = ref('')

const goalInput = ref<number | null>(null)
watch(
  () => profileStore.profile.goalWeightKg,
  (v) => {
    goalInput.value = v
  },
  { immediate: true },
)

const sortedLog = computed(() => [...profileStore.profile.weightLog].sort((a, b) => b.date.localeCompare(a.date)))
const currentWeight = computed(() => sortedLog.value[0]?.weightKg ?? null)
const firstWeight = computed(() => sortedLog.value.at(-1)?.weightKg ?? null)

async function addWeight() {
  if (!newWeight.value || newWeight.value <= 0) {
    weightError.value = 'Podaj prawidłową wagę.'
    return
  }
  weightError.value = ''
  try {
    await profileStore.addWeightEntry(newWeight.value)
    newWeight.value = null
  } catch (err) {
    weightError.value = err instanceof Error ? err.message : 'Nie udało się zapisać wpisu.'
  }
}

function removeEntry(id: string) {
  profileStore.removeWeightEntry(id).catch(() => {})
}

async function saveGoal() {
  await profileStore.setGoalWeight(goalInput.value)
}

const goalProgressPct = computed(() => {
  const goal = profileStore.profile.goalWeightKg
  if (currentWeight.value == null || goal == null || firstWeight.value == null) return null
  const totalDelta = firstWeight.value - goal
  if (totalDelta === 0) return 100
  const doneDelta = firstWeight.value - currentWeight.value
  return Math.max(0, Math.min(100, Math.round((doneDelta / totalDelta) * 100)))
})
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5">
        <Flame class="w-5 h-5 text-orange-600 dark:text-orange-400 mb-2" />
        <p class="text-2xl font-black text-slate-900 dark:text-white">{{ sessionsStore.currentStreak }}</p>
        <p class="text-xs text-slate-500">dni serii treningowej</p>
      </div>
      <div class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5">
        <TrendingUp class="w-5 h-5 text-orange-600 dark:text-orange-400 mb-2" />
        <p class="text-2xl font-black text-slate-900 dark:text-white">{{ sessionsStore.regularityPct }}%</p>
        <p class="text-xs text-slate-500">regularność (30 dni)</p>
      </div>
      <div class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5">
        <Target class="w-5 h-5 text-orange-600 dark:text-orange-400 mb-2" />
        <p class="text-2xl font-black text-slate-900 dark:text-white">{{ currentWeight ?? '—' }} kg</p>
        <p class="text-xs text-slate-500">aktualna waga</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 space-y-4">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white">Cel wagowy</h3>
        <div class="flex items-center gap-2">
          <input
            v-model.number="goalInput"
            type="number"
            min="0"
            placeholder="np. 75"
            class="min-w-0 flex-1 px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          />
          <span class="text-xs text-slate-500">kg</span>
          <button type="button" @click="saveGoal" class="px-4 py-2 rounded-lg text-xs font-semibold bg-orange-500 text-black hover:bg-orange-400 transition-colors">
            Zapisz
          </button>
        </div>

        <div v-if="goalProgressPct !== null" class="space-y-1.5">
          <div class="flex justify-between text-xs text-slate-500">
            <span>Cel: {{ profileStore.profile.goalWeightKg }} kg</span>
            <span>{{ goalProgressPct }}%</span>
          </div>
          <div class="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div class="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all" :style="{ width: `${goalProgressPct}%` }" />
          </div>
        </div>
      </div>

      <div class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 space-y-4">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white">Dziennik wagi</h3>
        <div class="flex items-center gap-2">
          <input
            v-model.number="newWeight"
            type="number"
            min="0"
            step="0.1"
            placeholder="Dzisiejsza waga (kg)"
            @keyup.enter="addWeight"
            class="min-w-0 flex-1 px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          />
          <button type="button" @click="addWeight" class="p-2 rounded-lg bg-orange-500 text-black hover:bg-orange-400 transition-colors">
            <Plus class="w-4 h-4" />
          </button>
        </div>
        <p v-if="weightError" class="text-xs text-red-500">{{ weightError }}</p>

        <div class="space-y-1.5 max-h-56 overflow-y-auto">
          <div v-for="entry in sortedLog" :key="entry.id" class="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900/50 text-sm">
            <span class="text-slate-500 text-xs">{{ entry.date }}</span>
            <span class="font-semibold text-slate-800 dark:text-slate-200">{{ entry.weightKg }} kg</span>
            <button type="button" @click="removeEntry(entry.id)" class="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
          <p v-if="!sortedLog.length" class="text-xs text-slate-500 text-center py-4">Brak wpisów wagi.</p>
        </div>
      </div>
    </div>
  </div>
</template>
