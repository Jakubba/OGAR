<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useTrainingSessionsStore } from '@/stores/trainingSessions'
import { toDateKey } from '@/lib/training'
import { WEEKDAYS } from '@/data/exercises'
import WorkoutSummary from '@/components/training/WorkoutSummary.vue'

const sessionsStore = useTrainingSessionsStore()

const viewDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const selectedDateKey = ref<string | null>(null)

const monthLabel = computed(() =>
  viewDate.value.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' }),
)

interface DayCell {
  date: Date
  dateKey: string
  inMonth: boolean
}

const weeks = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = (firstOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: DayCell[] = []
  for (let i = startOffset; i > 0; i--) {
    const d = new Date(year, month, 1 - i)
    cells.push({ date: d, dateKey: toDateKey(d), inMonth: false })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day)
    cells.push({ date: d, dateKey: toDateKey(d), inMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const prevDate = cells[cells.length - 1]!.date
    const d = new Date(prevDate)
    d.setDate(d.getDate() + 1)
    cells.push({ date: d, dateKey: toDateKey(d), inMonth: false })
  }

  const rows: DayCell[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
  return rows
})

function prevMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1)
}
function nextMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
}

function selectDay(dateKey: string) {
  selectedDateKey.value = sessionsStore.sessionsByDateKey.has(dateKey) ? dateKey : null
}

const selectedSession = computed(() =>
  selectedDateKey.value ? (sessionsStore.sessionsByDateKey.get(selectedDateKey.value) ?? null) : null,
)

const todayKey = toDateKey(new Date())
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
    <div class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3 sm:p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white capitalize">{{ monthLabel }}</h3>
        <div class="flex gap-1.5">
          <button type="button" @click="prevMonth" class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/40">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button type="button" @click="nextMonth" class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/40">
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1 sm:gap-1.5 text-center mb-1 sm:mb-1.5">
        <span v-for="d in WEEKDAYS" :key="d.code" class="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase">{{ d.label }}</span>
      </div>

      <div v-for="(row, i) in weeks" :key="i" class="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
        <button
          v-for="cell in row"
          :key="cell.dateKey"
          type="button"
          @click="selectDay(cell.dateKey)"
          :class="[
            'aspect-square rounded-lg text-[11px] sm:text-xs font-semibold flex items-center justify-center transition-colors',
            !cell.inMonth && 'opacity-30',
            sessionsStore.sessionsByDateKey.has(cell.dateKey)
              ? 'bg-orange-500 text-black hover:bg-orange-400'
              : 'bg-slate-100 dark:bg-slate-900/50 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800/60',
            cell.dateKey === todayKey && 'ring-2 ring-orange-500/60',
            selectedDateKey === cell.dateKey && 'ring-2 ring-slate-900 dark:ring-white',
          ]"
        >
          {{ cell.date.getDate() }}
        </button>
      </div>
    </div>

    <div class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5">
      <template v-if="selectedSession">
        <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{{ selectedSession.planName }}</p>
        <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-4">{{ selectedSession.date }}</h3>
        <WorkoutSummary :session="selectedSession" />
      </template>
      <p v-else class="text-sm text-slate-500 text-center py-8">Kliknij oznaczony dzień, aby zobaczyć podsumowanie treningu.</p>
    </div>
  </div>
</template>
