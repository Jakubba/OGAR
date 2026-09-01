<script setup lang="ts">
import { computed } from 'vue'
import { Plus, Search, X } from 'lucide-vue-next'
import { useTrainingExercisesStore, type CatalogExercise } from '@/stores/trainingExercises'
import { useExerciseFilters } from '@/composables/useExerciseFilters'
import { EQUIPMENT_OPTIONS, LOCATIONS, MUSCLE_GROUPS, iconForExercise } from '@/data/exercises'

const emit = defineEmits<{ select: [exercise: CatalogExercise]; close: [] }>()

const exercisesStore = useTrainingExercisesStore()
const { filters, filteredExercises } = useExerciseFilters(computed(() => exercisesStore.all))
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" @click.self="emit('close')">
    <div class="w-full max-w-2xl max-h-[80vh] flex flex-col bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white">Wybierz ćwiczenie</h3>
        <button type="button" @click="emit('close')" class="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
        <div class="relative flex-1 min-w-[160px]">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="filters.search"
            type="text"
            placeholder="Szukaj..."
            class="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-orange-500/50"
          />
        </div>
        <select v-model="filters.muscleGroup" class="px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none">
          <option value="">Grupa</option>
          <option v-for="g in MUSCLE_GROUPS" :key="g" :value="g">{{ g }}</option>
        </select>
        <select v-model="filters.equipment" class="px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none">
          <option value="">Sprzęt</option>
          <option v-for="eq in EQUIPMENT_OPTIONS" :key="eq" :value="eq">{{ eq }}</option>
        </select>
        <select v-model="filters.location" class="px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none">
          <option value="">Miejsce</option>
          <option v-for="l in LOCATIONS" :key="l" :value="l">{{ l }}</option>
        </select>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-2">
        <div
          v-for="ex in filteredExercises"
          :key="ex.id"
          class="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/60 hover:border-orange-500/40 transition-colors"
        >
          <div class="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-orange-600 dark:text-orange-400 shrink-0">
            <component :is="iconForExercise(ex.icon)" class="w-4 h-4" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{{ ex.name }}</p>
            <p class="text-[10px] text-slate-500 uppercase tracking-wide">{{ ex.muscleGroup }} · {{ ex.equipment }} · {{ ex.location }}</p>
          </div>
          <button
            type="button"
            @click="emit('select', ex)"
            class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 text-black hover:bg-orange-400 transition-colors shrink-0"
          >
            <Plus class="w-3.5 h-3.5" /> Dodaj
          </button>
        </div>

        <p v-if="!filteredExercises.length" class="text-center text-sm text-slate-500 py-8">Brak wyników.</p>
      </div>
    </div>
  </div>
</template>
