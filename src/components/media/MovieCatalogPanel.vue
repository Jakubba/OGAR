<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Clapperboard, Loader2, Star } from 'lucide-vue-next'
import {
  discoverCatalog,
  isTmdbConfigured,
  TMDB_GENRE_NAMES,
  type CatalogSort,
  type CatalogType,
  type TmdbDiscoverResult,
} from '@/lib/tmdb'

const props = withDefaults(defineProps<{ excludedKeys?: Set<string> }>(), { excludedKeys: () => new Set() })
const emit = defineEmits<{ 'open-details': [item: TmdbDiscoverResult] }>()

const typeFilter = ref<CatalogType>('all')
const genreFilter = ref('')
const yearFilter = ref('')
const sort = ref<CatalogSort>('popularity')
const page = ref(1)

const items = ref<TmdbDiscoverResult[]>([])
const visibleItems = computed(() => items.value.filter((item) => !props.excludedKeys.has(`${item.mediaType}:${item.id}`)))
const hasNextPage = ref(false)
const loading = ref(false)
const error = ref('')

let yearDebounce: ReturnType<typeof setTimeout> | null = null

async function load() {
  if (!isTmdbConfigured()) {
    error.value = 'Brak skonfigurowanego klucza TMDB API — katalog niedostępny.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const yearNum = yearFilter.value.trim() ? Number(yearFilter.value.trim()) : undefined
    const result = await discoverCatalog({
      page: page.value,
      type: typeFilter.value,
      genre: genreFilter.value || undefined,
      year: yearNum && Number.isFinite(yearNum) ? yearNum : undefined,
      sort: sort.value,
    })
    items.value = result.items
    hasNextPage.value = result.hasNextPage
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Błąd wczytywania katalogu.'
    items.value = []
    hasNextPage.value = false
  } finally {
    loading.value = false
  }
}

function resetToFirstPageAndLoad() {
  page.value = 1
  load()
}

watch([typeFilter, genreFilter, sort], resetToFirstPageAndLoad)

watch(yearFilter, () => {
  if (yearDebounce) clearTimeout(yearDebounce)
  yearDebounce = setTimeout(resetToFirstPageAndLoad, 500)
})

onUnmounted(() => {
  if (yearDebounce) clearTimeout(yearDebounce)
})

function prevPage() {
  if (page.value <= 1 || loading.value) return
  page.value--
  load()
}

function nextPage() {
  if (!hasNextPage.value || loading.value) return
  page.value++
  load()
}

onMounted(load)
</script>

<template>
  <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Wszystkie filmy i seriale</h3>
      <span class="text-[10px] text-slate-500">TMDB</span>
    </div>

    <div class="flex flex-wrap gap-2 mb-4">
      <select
        v-model="typeFilter"
        class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
      >
        <option value="all">Wszystko</option>
        <option value="movie">Filmy</option>
        <option value="tv">Seriale</option>
      </select>
      <select
        v-model="genreFilter"
        class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
      >
        <option value="">Wszystkie gatunki</option>
        <option v-for="g in TMDB_GENRE_NAMES" :key="g" :value="g">{{ g }}</option>
      </select>
      <input
        v-model="yearFilter"
        type="number"
        placeholder="Rok wydania"
        class="w-28 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500"
      />
      <select
        v-model="sort"
        class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
      >
        <option value="popularity">Popularność</option>
        <option value="title_asc">Nazwa (A-Z)</option>
        <option value="release_desc">Data wydania (najnowsze)</option>
        <option value="release_asc">Data wydania (najstarsze)</option>
      </select>
    </div>

    <p v-if="error" class="text-xs text-rose-600 dark:text-rose-400 mb-3">{{ error }}</p>

    <div v-if="loading" class="flex flex-col items-center justify-center gap-2 py-14 text-slate-400 dark:text-slate-500">
      <Loader2 class="w-6 h-6 animate-spin text-orange-500" />
      <p class="text-xs font-semibold">Wczytuję katalog...</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <button
        v-for="item in visibleItems"
        :key="`${item.mediaType}:${item.id}`"
        type="button"
        @click="emit('open-details', item)"
        class="text-left rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/60 overflow-hidden flex flex-col hover:border-orange-500/40 transition-all cursor-pointer"
      >
        <div class="h-32 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-950 relative flex items-center justify-center overflow-hidden">
          <img v-if="item.posterUrl" :src="item.posterUrl" :alt="item.title" class="w-full h-full object-cover" />
          <Clapperboard v-else class="w-8 h-8 text-slate-400 dark:text-slate-700" />
          <span class="absolute top-2 right-2 text-[9px] font-bold bg-black/70 text-slate-200 px-1.5 py-0.5 rounded">
            {{ item.mediaType === 'tv' ? 'Serial' : 'Film' }}
          </span>
        </div>
        <div class="p-3 flex-1 flex flex-col">
          <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight mb-1">{{ item.title }}</h4>
          <p class="text-[10px] text-slate-500 mb-2">{{ item.year || '—' }} · {{ item.genres.join(', ') || 'brak gatunku' }}</p>
          <span v-if="item.voteAverage" class="mt-auto flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
            <Star class="w-3.5 h-3.5 fill-amber-400" /> {{ item.voteAverage.toFixed(1) }}
          </span>
        </div>
      </button>

      <p v-if="!visibleItems.length" class="sm:col-span-2 lg:col-span-3 text-center py-10 text-sm text-slate-500">
        {{ items.length ? 'Wszystkie tytuły z tej strony masz już na liście — sprawdź kolejną.' : 'Brak wyników dla wybranych filtrów.' }}
      </p>
    </div>

    <div v-if="!loading && items.length" class="flex items-center justify-center gap-3 mt-5">
      <button
        type="button"
        @click="prevPage"
        :disabled="page <= 1"
        class="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>
      <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">Strona {{ page }}</span>
      <button
        type="button"
        @click="nextPage"
        :disabled="!hasNextPage"
        class="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
