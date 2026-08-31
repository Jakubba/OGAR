<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { GripVertical, Plus, Trash2 } from 'lucide-vue-next'
import { useTrainingPlansStore, type PlanExercise, type TrainingPlan } from '@/stores/trainingPlans'
import type { CatalogExercise } from '@/stores/trainingExercises'
import { WEEKDAYS, iconForExercise, type Weekday } from '@/data/exercises'
import ExercisePickerModal from '@/components/training/ExercisePickerModal.vue'

const plansStore = useTrainingPlansStore()

const selectedPlanId = ref<string | null>(null)
watch(
  () => plansStore.plans,
  (plans) => {
    if (!selectedPlanId.value || !plans.some((p) => p.id === selectedPlanId.value)) {
      selectedPlanId.value = plans[0]?.id ?? null
    }
  },
  { immediate: true },
)

const activePlan = computed<TrainingPlan | undefined>(() => plansStore.plans.find((p) => p.id === selectedPlanId.value))

const newPlanName = ref('')
const creating = ref(false)
const actionError = ref('')

async function createPlan() {
  if (!newPlanName.value.trim() || creating.value) return
  creating.value = true
  try {
    const id = await plansStore.createPlan(newPlanName.value.trim())
    newPlanName.value = ''
    selectedPlanId.value = id
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Nie udało się utworzyć planu.'
  } finally {
    creating.value = false
  }
}

function deletePlan(plan: TrainingPlan) {
  if (!window.confirm(`Usunąć plan „${plan.name}”?`)) return
  plansStore.deletePlan(plan.id).catch((err) => {
    actionError.value = err instanceof Error ? err.message : 'Nie udało się usunąć planu.'
  })
}

function renamePlan(event: Event, plan: TrainingPlan) {
  const value = (event.target as HTMLInputElement).value.trim()
  if (!value || value === plan.name) return
  plansStore.renamePlan(plan.id, value).catch((err) => {
    actionError.value = err instanceof Error ? err.message : 'Nie udało się zmienić nazwy.'
  })
}

function toggleDay(plan: TrainingPlan, day: Weekday) {
  const days = plan.days.includes(day) ? plan.days.filter((d) => d !== day) : [...plan.days, day]
  plansStore.setPlanDays(plan, days).catch((err) => {
    actionError.value = err instanceof Error ? err.message : 'Nie udało się zapisać dni.'
  })
}

const pickerOpen = ref(false)

function onExerciseSelected(exercise: CatalogExercise) {
  if (!activePlan.value) return
  const base = {
    exerciseId: exercise.id,
    exerciseSource: exercise.source,
    name: exercise.name,
    icon: exercise.icon,
    met: exercise.met,
    isTimed: exercise.isTimed,
    sets: 3,
    restSeconds: 60,
  }
  plansStore
    .addExerciseToPlan(activePlan.value, exercise.isTimed ? { ...base, durationSeconds: 30 } : { ...base, reps: 10 })
    .catch((err) => {
      actionError.value = err instanceof Error ? err.message : 'Nie udało się dodać ćwiczenia.'
    })
  pickerOpen.value = false
}

function updateExercise(planExerciseId: string, patch: Partial<PlanExercise>) {
  if (!activePlan.value) return
  plansStore.updatePlanExercise(activePlan.value, planExerciseId, patch).catch((err) => {
    actionError.value = err instanceof Error ? err.message : 'Nie udało się zaktualizować ćwiczenia.'
  })
}

function onNumberChange(event: Event, planExerciseId: string, field: keyof PlanExercise) {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isNaN(value) || value < 0) return
  updateExercise(planExerciseId, { [field]: value } as Partial<PlanExercise>)
}

function removeExercise(planExerciseId: string) {
  if (!activePlan.value) return
  plansStore.removePlanExercise(activePlan.value, planExerciseId).catch((err) => {
    actionError.value = err instanceof Error ? err.message : 'Nie udało się usunąć ćwiczenia.'
  })
}

const draggingIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function onDrop(targetIndex: number) {
  if (activePlan.value && draggingIndex.value !== null) {
    plansStore.reorderPlanExercise(activePlan.value, draggingIndex.value, targetIndex).catch((err) => {
      actionError.value = err instanceof Error ? err.message : 'Nie udało się zmienić kolejności.'
    })
  }
  draggingIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
    <div class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 space-y-3 h-fit">
      <h3 class="text-xs uppercase tracking-wider font-semibold text-slate-500">Twoje plany</h3>
      <button
        v-for="plan in plansStore.plans"
        :key="plan.id"
        type="button"
        @click="selectedPlanId = plan.id"
        :class="[
          'w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border',
          selectedPlanId === plan.id
            ? 'bg-orange-500/10 border-orange-500/40 text-orange-600 dark:text-orange-400'
            : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40',
        ]"
      >
        {{ plan.name }}
        <span class="block text-[10px] font-normal opacity-70">{{ plan.exercises.length }} ćwiczeń</span>
      </button>

      <div class="pt-2 border-t border-slate-200 dark:border-slate-800 flex gap-2">
        <input
          v-model="newPlanName"
          type="text"
          placeholder="Nazwa nowego planu"
          @keyup.enter="createPlan"
          class="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none"
        />
        <button type="button" @click="createPlan" :disabled="creating" class="p-2 rounded-lg bg-orange-500 text-black hover:bg-orange-400 transition-colors disabled:opacity-50">
          <Plus class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div v-if="activePlan" class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 space-y-5">
      <div class="flex items-center justify-between gap-3">
        <input
          :value="activePlan.name"
          @change="renamePlan($event, activePlan)"
          type="text"
          class="min-w-0 text-lg font-bold text-slate-900 dark:text-white bg-transparent outline-none border-b border-transparent focus:border-orange-500/50 flex-1"
        />
        <button type="button" @click="deletePlan(activePlan)" class="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors">
          <Trash2 class="w-4 h-4" />
        </button>
      </div>

      <div>
        <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Dni treningowe</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="day in WEEKDAYS"
            :key="day.code"
            type="button"
            @click="toggleDay(activePlan, day.code)"
            :class="[
              'w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-colors border',
              activePlan.days.includes(day.code)
                ? 'bg-orange-500 border-orange-500 text-black'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-orange-500/40',
            ]"
          >
            {{ day.label }}
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Ćwiczenia</p>
          <button type="button" @click="pickerOpen = true" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 text-black hover:bg-orange-400 transition-colors">
            <Plus class="w-3.5 h-3.5" /> Dodaj ćwiczenie
          </button>
        </div>

        <div
          v-for="(pe, index) in activePlan.exercises"
          :key="pe.id"
          draggable="true"
          @dragstart="draggingIndex = index"
          @dragover.prevent="dragOverIndex = index"
          @drop="onDrop(index)"
          @dragend="draggingIndex = null; dragOverIndex = null"
          :class="[
            'flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 border transition-colors cursor-grab',
            dragOverIndex === index ? 'border-orange-500/60' : 'border-slate-200/70 dark:border-slate-800/60',
          ]"
        >
          <GripVertical class="w-4 h-4 text-slate-400 shrink-0" />
          <div class="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-orange-600 dark:text-orange-400 shrink-0">
            <component :is="iconForExercise(pe.icon)" class="w-4 h-4" />
          </div>
          <span class="text-sm font-semibold text-slate-800 dark:text-slate-200 min-w-[120px] max-w-full break-words">{{ pe.name }}</span>

          <label class="flex items-center gap-1 text-xs text-slate-500">
            Serie
            <input type="number" min="1" :value="pe.sets" @change="onNumberChange($event, pe.id, 'sets')" class="w-14 px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200" />
          </label>

          <label v-if="!pe.isTimed" class="flex items-center gap-1 text-xs text-slate-500">
            Powt.
            <input type="number" min="1" :value="pe.reps" @change="onNumberChange($event, pe.id, 'reps')" class="w-14 px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200" />
          </label>
          <label v-else class="flex items-center gap-1 text-xs text-slate-500">
            Czas (s)
            <input type="number" min="1" :value="pe.durationSeconds" @change="onNumberChange($event, pe.id, 'durationSeconds')" class="w-16 px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200" />
          </label>

          <label class="flex items-center gap-1 text-xs text-slate-500">
            Przerwa (s)
            <input type="number" min="0" :value="pe.restSeconds" @change="onNumberChange($event, pe.id, 'restSeconds')" class="w-16 px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200" />
          </label>

          <label class="flex items-center gap-1 text-xs text-slate-500">
            Ciężar (kg)
            <input type="number" min="0" :value="pe.weightKg ?? 0" @change="onNumberChange($event, pe.id, 'weightKg')" class="w-16 px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200" />
          </label>

          <button type="button" @click="removeExercise(pe.id)" class="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors">
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>

        <p v-if="!activePlan.exercises.length" class="text-sm text-slate-500 py-6 text-center">
          Ten plan nie ma jeszcze ćwiczeń — dodaj pierwsze powyżej.
        </p>
      </div>
    </div>

    <div v-else class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-sm text-slate-500">
      Utwórz swój pierwszy plan treningowy.
    </div>

    <p v-if="actionError" class="lg:col-span-2 text-xs text-red-500">{{ actionError }}</p>

    <ExercisePickerModal v-if="pickerOpen" @select="onExerciseSelected" @close="pickerOpen = false" />
  </div>
</template>
