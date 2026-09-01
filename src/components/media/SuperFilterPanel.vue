<script setup lang="ts">
import { TMDB_GENRE_NAMES } from '@/lib/tmdb'
import type { MovieStatus } from '@/stores/movies'

defineProps<{ selectedGenres: string[] }>()
const emit = defineEmits<{ 'toggle-genre': [genre: string]; reset: [] }>()

const statusFilter = defineModel<'wszystkie' | MovieStatus>('statusFilter', { required: true })
const minRating = defineModel<number>('minRating', { required: true })
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Super-Filtr</h3>
      <button type="button" @click="emit('reset')" class="text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        Wyczyść
      </button>
    </div>

    <div class="space-y-5">
      <div>
        <label class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</label>
        <div class="flex flex-wrap gap-1.5 mt-2">
          <button
            v-for="s in (['wszystkie', 'obejrzany', 'do obejrzenia'] as const)"
            :key="s"
            @click="statusFilter = s"
            :class="[
              'px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer capitalize',
              statusFilter === s
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-600 dark:text-orange-400'
                : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700',
            ]"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <div>
        <label class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Gatunek</label>
        <div class="flex flex-wrap gap-1.5 mt-2">
          <button
            v-for="g in TMDB_GENRE_NAMES"
            :key="g"
            @click="emit('toggle-genre', g)"
            :class="[
              'px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer',
              selectedGenres.includes(g)
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-600 dark:text-orange-400'
                : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700',
            ]"
          >
            {{ g }}
          </button>
        </div>
      </div>

      <div>
        <div class="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
          <span>Min. ocena</span>
          <span>{{ minRating }}/10</span>
        </div>
        <input v-model.number="minRating" type="range" min="0" max="10" class="w-full accent-orange-500" />
      </div>
    </div>
  </div>
</template>
