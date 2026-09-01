<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Plus, Star, X } from 'lucide-vue-next'
import { getMediaDetails, isTmdbConfigured, type TmdbMediaDetails } from '@/lib/tmdb'
import { PLATFORMS } from '@/lib/moviePlatforms'
import type { MovieStatus } from '@/stores/movies'

export interface MovieDetailsSubject {
  tmdbId?: number
  mediaType?: 'movie' | 'tv'
  title: string
  photoUrl?: string
  platform?: string
  category?: string
  status?: MovieStatus
  rating?: number
}

export interface MovieAddPayload {
  platform: string
  status: MovieStatus
  rating?: number
}

const props = withDefaults(
  defineProps<{
    movie: MovieDetailsSubject
    mode?: 'saved' | 'catalog'
    adding?: boolean
    addError?: string
  }>(),
  { mode: 'saved', adding: false, addError: '' },
)
const emit = defineEmits<{ close: []; add: [payload: MovieAddPayload] }>()

const addPlatform = ref(PLATFORMS[0])
const addStatus = ref<MovieStatus>('do obejrzenia')
const addRating = ref(8)

function confirmAdd() {
  emit('add', {
    platform: addPlatform.value,
    status: addStatus.value,
    ...(addStatus.value === 'obejrzany' ? { rating: addRating.value } : {}),
  })
}

const details = ref<TmdbMediaDetails | null>(null)
const loading = ref(false)
const error = ref('')

const activeImageOverride = ref<string | null>(null)
const activeImage = computed(() => activeImageOverride.value ?? details.value?.posterUrl ?? props.movie.photoUrl ?? null)

onMounted(async () => {
  activeImageOverride.value = null
  if (props.movie.tmdbId == null) return
  if (!isTmdbConfigured()) {
    error.value = 'Brak skonfigurowanego klucza TMDB API — nie można pobrać dodatkowych informacji.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    details.value = await getMediaDetails(props.movie.tmdbId, props.movie.mediaType ?? 'movie')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Nie udało się pobrać szczegółów.'
  } finally {
    loading.value = false
  }
})

function closeModal() {
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="closeModal">
    <div class="w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain rounded-3xl bg-white dark:bg-[#0b1220] shadow-2xl border border-slate-200 dark:border-slate-800">
      <div class="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-[#0b1220]/95 backdrop-blur z-10">
        <h3 class="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white truncate pr-2">
          {{ movie.title }}
        </h3>
        <button type="button" @click="closeModal" class="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-4 sm:p-5 space-y-4">
        <div class="rounded-2xl overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-950 h-56 sm:h-72 flex items-center justify-center">
          <img v-if="activeImage" :src="activeImage" :alt="movie.title" class="w-full h-full object-cover" />
          <span v-else class="text-xs text-slate-400 dark:text-slate-600">Brak zdjęcia</span>
        </div>

        <div v-if="details && details.backdropUrls.length" class="flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="(url, i) in details.backdropUrls"
            :key="i"
            type="button"
            @click="activeImageOverride = url"
            class="shrink-0 w-20 h-12 rounded-lg overflow-hidden border-2 cursor-pointer transition-colors"
            :class="activeImage === url ? 'border-orange-500' : 'border-transparent hover:border-orange-500/40'"
          >
            <img :src="url" :alt="`Kadr ${i + 1}`" class="w-full h-full object-cover" />
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span v-if="details?.releaseYear">{{ details.releaseYear }}</span>
          <span v-if="details?.runtimeMinutes">{{ details.runtimeMinutes }} min</span>
          <span v-if="details?.voteAverage" class="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
            <Star class="w-3.5 h-3.5 fill-amber-400" /> {{ details.voteAverage.toFixed(1) }}/10 (TMDB)
          </span>
          <span v-if="movie.platform" class="px-1.5 py-0.5 rounded bg-black/70 text-slate-200 text-[10px] font-bold">{{ movie.platform }}</span>
        </div>

        <p v-if="details?.genres.length" class="text-[11px] text-slate-500 dark:text-slate-400">
          {{ details.genres.join(', ') }}
        </p>

        <p v-if="details?.tagline" class="text-xs italic text-slate-500 dark:text-slate-400">
          „{{ details.tagline }}"
        </p>

        <div v-if="loading" class="text-xs text-slate-500 dark:text-slate-400">Wczytuję opis z TMDB...</div>
        <p v-else-if="error" class="text-xs text-rose-600 dark:text-rose-400">{{ error }}</p>
        <p v-else-if="details?.overview" class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {{ details.overview }}
        </p>
        <p v-else class="text-xs text-slate-500 dark:text-slate-400">Brak opisu — film został dodany ręcznie, bez powiązania z TMDB.</p>

        <div v-if="mode === 'catalog'" class="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div>
            <label class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Platforma</label>
            <select
              v-model="addPlatform"
              class="w-full mt-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option v-for="p in PLATFORMS" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>

          <div class="flex gap-2">
            <button
              type="button"
              @click="addStatus = 'do obejrzenia'"
              :class="[
                'flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer',
                addStatus === 'do obejrzenia'
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-600 dark:text-orange-400'
                  : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700',
              ]"
            >
              Do obejrzenia
            </button>
            <button
              type="button"
              @click="addStatus = 'obejrzany'"
              :class="[
                'flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer',
                addStatus === 'obejrzany'
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-600 dark:text-orange-400'
                  : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700',
              ]"
            >
              Oceń i dodaj
            </button>
          </div>

          <div v-if="addStatus === 'obejrzany'">
            <label class="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Ocena: {{ addRating }}/10</label>
            <input v-model.number="addRating" type="range" min="1" max="10" step="1" class="w-full accent-orange-500" />
          </div>

          <p v-if="addError" class="text-xs text-rose-600 dark:text-rose-400">{{ addError }}</p>

          <button
            type="button"
            @click="confirmAdd"
            :disabled="adding"
            class="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus class="w-4 h-4" /> {{ adding ? 'Dodaję...' : 'Dodaj do listy' }}
          </button>
        </div>

        <div v-else class="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
          <span class="text-slate-500 dark:text-slate-400">{{ movie.category }}</span>
          <span v-if="movie.status === 'obejrzany'" class="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
            <Star class="w-3.5 h-3.5 fill-amber-400" /> Twoja ocena: {{ movie.rating }}/10
          </span>
          <span v-else class="font-semibold text-orange-600 dark:text-orange-400">Do obejrzenia</span>
        </div>
      </div>
    </div>
  </div>
</template>
