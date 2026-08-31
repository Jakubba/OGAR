<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ChevronDown, ChevronUp, Plus, Search, Trash2 } from 'lucide-vue-next'
import { useTrainingExercisesStore } from '@/stores/trainingExercises'
import { useExerciseFilters } from '@/composables/useExerciseFilters'
import {
  DIFFICULTIES,
  EQUIPMENT_OPTIONS,
  EXERCISE_ICONS,
  EXERCISE_TYPES,
  LOCATIONS,
  MUSCLE_GROUPS,
  iconForExercise,
  type Difficulty,
  type Equipment,
  type ExerciseType,
  type Location,
  type MuscleGroup,
} from '@/data/exercises'

const exercisesStore = useTrainingExercisesStore()
const { filters, filteredExercises, resetFilters } = useExerciseFilters(computed(() => exercisesStore.all))

const showForm = ref(false)
const formError = ref('')
const saving = ref(false)
const iconKeys = Object.keys(EXERCISE_ICONS)

const form = reactive({
  name: '',
  muscleGroup: 'całe ciało' as MuscleGroup,
  equipment: 'brak' as Equipment,
  difficulty: 'początkujący' as Difficulty,
  type: 'siłowe' as ExerciseType,
  location: 'dom' as Location,
  met: 5,
  description: '',
  icon: 'dumbbell',
  isTimed: false,
})

function resetForm() {
  form.name = ''
  form.muscleGroup = 'całe ciało'
  form.equipment = 'brak'
  form.difficulty = 'początkujący'
  form.type = 'siłowe'
  form.location = 'dom'
  form.met = 5
  form.description = ''
  form.icon = 'dumbbell'
  form.isTimed = false
  formError.value = ''
}

async function saveExercise() {
  if (saving.value) return
  if (!form.name.trim()) {
    formError.value = 'Podaj nazwę ćwiczenia.'
    return
  }
  formError.value = ''
  saving.value = true
  try {
    await exercisesStore.addCustomExercise({ ...form, name: form.name.trim() })
    resetForm()
    showForm.value = false
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Nie udało się zapisać ćwiczenia.'
  } finally {
    saving.value = false
  }
}

function deleteExercise(id: string) {
  if (!window.confirm('Usunąć to ćwiczenie z Twojej bazy?')) return
  exercisesStore.deleteCustomExercise(id).catch((err) => {
    formError.value = err instanceof Error ? err.message : 'Nie udało się usunąć ćwiczenia.'
  })
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5">
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex-1 min-w-[180px]">
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Szukaj</label>
          <div class="relative mt-1">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="filters.search"
              type="text"
              placeholder="Nazwa ćwiczenia..."
              class="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-orange-500/50"
            />
          </div>
        </div>

        <div>
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Grupa mięśniowa</label>
          <select v-model="filters.muscleGroup" class="mt-1 block w-full px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none">
            <option value="">Wszystkie</option>
            <option v-for="g in MUSCLE_GROUPS" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>

        <div>
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Sprzęt</label>
          <select v-model="filters.equipment" class="mt-1 block w-full px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none">
            <option value="">Wszystkie</option>
            <option v-for="eq in EQUIPMENT_OPTIONS" :key="eq" :value="eq">{{ eq }}</option>
          </select>
        </div>

        <div>
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Poziom</label>
          <select v-model="filters.difficulty" class="mt-1 block w-full px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none">
            <option value="">Wszystkie</option>
            <option v-for="d in DIFFICULTIES" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>

        <div>
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Rodzaj</label>
          <select v-model="filters.type" class="mt-1 block w-full px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none">
            <option value="">Wszystkie</option>
            <option v-for="t in EXERCISE_TYPES" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>

        <div>
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Miejsce</label>
          <select v-model="filters.location" class="mt-1 block w-full px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none">
            <option value="">Wszystkie</option>
            <option v-for="l in LOCATIONS" :key="l" :value="l">{{ l }}</option>
          </select>
        </div>

        <button
          type="button"
          @click="resetFilters"
          class="px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors"
        >
          Wyczyść filtry
        </button>

        <button
          type="button"
          @click="showForm = !showForm"
          class="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500 text-black hover:bg-orange-400 transition-colors"
        >
          <Plus class="w-4 h-4" /> Dodaj własne ćwiczenie
          <component :is="showForm ? ChevronUp : ChevronDown" class="w-4 h-4" />
        </button>
      </div>

      <div v-if="showForm" class="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="md:col-span-3">
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Nazwa</label>
          <input v-model="form.name" type="text" placeholder="np. Wznosy ramion" class="mt-1 w-full px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none" />
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Grupa mięśniowa</label>
          <select v-model="form.muscleGroup" class="mt-1 w-full px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none">
            <option v-for="g in MUSCLE_GROUPS" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Sprzęt</label>
          <select v-model="form.equipment" class="mt-1 w-full px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none">
            <option v-for="eq in EQUIPMENT_OPTIONS" :key="eq" :value="eq">{{ eq }}</option>
          </select>
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Poziom</label>
          <select v-model="form.difficulty" class="mt-1 w-full px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none">
            <option v-for="d in DIFFICULTIES" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Rodzaj</label>
          <select v-model="form.type" class="mt-1 w-full px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none">
            <option v-for="t in EXERCISE_TYPES" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Miejsce</label>
          <select v-model="form.location" class="mt-1 w-full px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none">
            <option v-for="l in LOCATIONS" :key="l" :value="l">{{ l }}</option>
          </select>
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Ikona</label>
          <select v-model="form.icon" class="mt-1 w-full px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none">
            <option v-for="key in iconKeys" :key="key" :value="key">{{ key }}</option>
          </select>
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input v-model="form.isTimed" type="checkbox" class="rounded" /> Ćwiczenie czasowe (np. plank)
        </label>
        <div class="md:col-span-3">
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Opis / technika</label>
          <textarea v-model="form.description" rows="2" class="mt-1 w-full px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none" />
        </div>
        <p v-if="formError" class="md:col-span-3 text-xs text-red-500">{{ formError }}</p>
        <div class="md:col-span-3 flex items-center gap-2">
          <button type="button" @click="saveExercise" :disabled="saving" class="px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500 text-black hover:bg-orange-400 transition-colors disabled:opacity-50">
            Zapisz ćwiczenie
          </button>
          <button type="button" @click="showForm = false" class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            Anuluj
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="ex in filteredExercises"
        :key="ex.id"
        class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 hover:border-orange-500/40 transition-all"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <div class="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-orange-600 dark:text-orange-400 shrink-0">
              <component :is="iconForExercise(ex.icon)" class="w-5 h-5" />
            </div>
            <div class="min-w-0">
              <h4 class="text-sm font-bold text-slate-900 dark:text-white truncate">{{ ex.name }}</h4>
              <p class="text-[10px] text-slate-500 uppercase tracking-wide truncate">{{ ex.muscleGroup }} · {{ ex.type }}</p>
            </div>
          </div>
          <button
            v-if="ex.source === 'custom'"
            type="button"
            @click="deleteExercise(ex.id)"
            class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title="Usuń ćwiczenie"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">{{ ex.description }}</p>
        <div class="flex flex-wrap gap-1.5 mt-3">
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">{{ ex.equipment }}</span>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">{{ ex.difficulty }}</span>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">{{ ex.location }}</span>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400">~{{ ex.met }} MET</span>
        </div>
      </div>

      <div v-if="!filteredExercises.length" class="sm:col-span-2 lg:col-span-3 text-center py-10 text-sm text-slate-500">
        Brak ćwiczeń pasujących do wybranych filtrów.
      </div>
    </div>
  </div>
</template>
