<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch as vueWatch } from 'vue'
import { Check, Clapperboard, Eye, Filter, Loader2, Search, Shuffle, Star, Trash2, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useMoviesStore, type Movie, type MovieStatus } from '@/stores/movies'
import {
  getRandomDiscoverBatch,
  isTmdbConfigured,
  searchMovies,
  type TmdbDiscoverResult,
  type TmdbSearchResult,
} from '@/lib/tmdb'
import RandomDrawModal, { type DrawItem } from '@/components/media/RandomDrawModal.vue'
import MovieDetailsModal, { type MovieAddPayload } from '@/components/media/MovieDetailsModal.vue'
import MovieCatalogPanel from '@/components/media/MovieCatalogPanel.vue'
import SuperFilterPanel from '@/components/media/SuperFilterPanel.vue'
import { PLATFORMS } from '@/lib/moviePlatforms'
import { useMobileReveal } from '@/composables/useMobileReveal'

const authStore = useAuthStore()
const moviesStore = useMoviesStore()

vueWatch(
  () => authStore.user?.uid,
  () => moviesStore.watch(),
  { immediate: true },
)
onUnmounted(() => moviesStore.stopWatching())

// Wyszukiwarka TMDB
const searchQuery = ref('')
const searchResults = ref<TmdbSearchResult[]>([])
const searching = ref(false)
const searchError = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

vueWatch(searchQuery, (q) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  const trimmed = q.trim()
  if (!trimmed) {
    searchResults.value = []
    searchError.value = ''
    return
  }
  debounceTimer = setTimeout(async () => {
    searching.value = true
    searchError.value = ''
    try {
      searchResults.value = await searchMovies(trimmed)
    } catch (err) {
      searchError.value = err instanceof Error ? err.message : 'Błąd wyszukiwania.'
    } finally {
      searching.value = false
    }
  }, 400)
})
onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})

// Potwierdzenie dodania wybranego filmu
const selectedResult = ref<TmdbSearchResult | null>(null)
const addForm = reactive({
  platform: PLATFORMS[0],
  status: 'do obejrzenia' as MovieStatus,
  rating: 8,
})
const formError = ref('')
const saving = ref(false)

function selectResult(r: TmdbSearchResult) {
  selectedResult.value = r
  searchResults.value = []
  searchQuery.value = ''
  addForm.platform = PLATFORMS[0]
  addForm.status = 'do obejrzenia'
  addForm.rating = 8
  formError.value = ''
}

function cancelSelection() {
  selectedResult.value = null
}

async function confirmAdd() {
  if (!selectedResult.value || saving.value) return
  saving.value = true
  formError.value = ''
  try {
    await moviesStore.addMovie({
      tmdbId: selectedResult.value.id,
      title: selectedResult.value.title,
      platform: addForm.platform,
      category: selectedResult.value.genres.join(', ') || 'Inne',
      status: addForm.status,
      rating: addForm.rating,
      ...(selectedResult.value.posterUrl ? { photoUrl: selectedResult.value.posterUrl } : {}),
    })
    selectedResult.value = null
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Nie udało się dodać filmu.'
  } finally {
    saving.value = false
  }
}

const selectedDetailsMovie = ref<Movie | null>(null)
function openMovieDetails(movie: Movie) {
  selectedDetailsMovie.value = movie
}

// Popup szczegółów dla pozycji z katalogu "Wszystkie filmy i seriale" (jeszcze niedodanych do Twojej listy)
const selectedCatalogItem = ref<TmdbDiscoverResult | null>(null)
const catalogAdding = ref(false)
const catalogAddError = ref('')

// Tytuły, które są już w Twojej liście — katalog je ukrywa, żeby nie dało się dodać duplikatu.
const existingCatalogKeys = computed(
  () => new Set(moviesStore.movies.filter((m) => m.tmdbId != null).map((m) => `${m.mediaType ?? 'movie'}:${m.tmdbId}`)),
)

function openCatalogDetails(item: TmdbDiscoverResult) {
  selectedCatalogItem.value = item
  catalogAddError.value = ''
}

async function addCatalogItemToList(payload: MovieAddPayload) {
  if (!selectedCatalogItem.value || catalogAdding.value) return
  const key = `${selectedCatalogItem.value.mediaType}:${selectedCatalogItem.value.id}`
  if (existingCatalogKeys.value.has(key)) {
    catalogAddError.value = 'Ten tytuł jest już na Twojej liście.'
    return
  }
  catalogAdding.value = true
  catalogAddError.value = ''
  try {
    await moviesStore.addMovie({
      tmdbId: selectedCatalogItem.value.id,
      mediaType: selectedCatalogItem.value.mediaType,
      title: selectedCatalogItem.value.title,
      platform: payload.platform,
      category: selectedCatalogItem.value.genres.join(', ') || 'Inne',
      status: payload.status,
      ...(payload.status === 'obejrzany' ? { rating: payload.rating } : {}),
      ...(selectedCatalogItem.value.posterUrl ? { photoUrl: selectedCatalogItem.value.posterUrl } : {}),
    })
    selectedCatalogItem.value = null
  } catch (err) {
    catalogAddError.value = err instanceof Error ? err.message : 'Nie udało się dodać do listy.'
  } finally {
    catalogAdding.value = false
  }
}

function removeMovie(movie: Movie) {
  if (!window.confirm(`Usunąć „${movie.title}” z listy?`)) return
  moviesStore.deleteMovie(movie.id).catch((err) => {
    formError.value = err instanceof Error ? err.message : 'Nie udało się usunąć filmu.'
  })
}

// Oznaczanie „do obejrzenia” jako obejrzane, z oceną
const markingWatchedId = ref<string | null>(null)
const watchedRatingDraft = ref(8)

function startMarkWatched(movie: Movie) {
  markingWatchedId.value = movie.id
  watchedRatingDraft.value = 8
}

function cancelMarkWatched() {
  markingWatchedId.value = null
}

function confirmMarkWatched(movie: Movie) {
  moviesStore.updateMovie(movie.id, { status: 'obejrzany', rating: watchedRatingDraft.value }).catch((err) => {
    formError.value = err instanceof Error ? err.message : 'Nie udało się zaktualizować filmu.'
  })
  markingWatchedId.value = null
}

// Super-filtr — filtruje realną listę filmów
const selectedGenres = reactive<string[]>([])
function toggleGenre(g: string) {
  const i = selectedGenres.indexOf(g)
  if (i >= 0) selectedGenres.splice(i, 1)
  else selectedGenres.push(g)
}

const statusFilter = ref<'wszystkie' | MovieStatus>('wszystkie')
const minRating = ref(0)

const filteredMovies = computed(() =>
  moviesStore.movies.filter((m) => {
    if (statusFilter.value !== 'wszystkie' && m.status !== statusFilter.value) return false
    if (selectedGenres.length && !selectedGenres.some((g) => m.category.includes(g))) return false
    if (m.rating != null && m.rating < minRating.value) return false
    return true
  }),
)

function resetFilters() {
  selectedGenres.splice(0, selectedGenres.length)
  statusFilter.value = 'wszystkie'
  minRating.value = 0
}

const { displayedItems: displayedMovies, canShowMore: canShowMoreMovies, showMore: showMoreMovies } = useMobileReveal(filteredMovies)

const showMobileFilters = ref(false)

// Losowanie — losuje tytuł z API TMDB (popularne filmy i seriale, spoza własnej listy)
const showDrawModal = ref(false)
const drawItems = ref<DrawItem[]>([])
const drawLoading = ref(false)
const drawError = ref('')
const drawSourceMap = ref<Map<string, TmdbDiscoverResult>>(new Map())
const addedExternalMovies = ref<Map<string, string>>(new Map()) // "mediaType:tmdbId" -> id dokumentu w Firestore

function drawKey(r: { id: number; mediaType: 'movie' | 'tv' }) {
  return `${r.mediaType}:${r.id}`
}

function discoverToDrawItem(r: TmdbDiscoverResult): DrawItem {
  return {
    id: drawKey(r),
    title: r.title,
    subtitle: r.genres.join(', ') || 'brak gatunku',
    meta: r.year,
    badge: r.mediaType === 'tv' ? 'Serial' : 'Film',
    imageUrl: r.posterUrl ?? undefined,
    favorite: false,
  }
}

async function openDraw() {
  drawLoading.value = true
  drawError.value = ''
  try {
    await moviesStore.loadRejectedExternal()
    const existingKeys = new Set(
      moviesStore.movies.filter((m) => m.tmdbId != null).map((m) => `${m.mediaType ?? 'movie'}:${m.tmdbId}`),
    )
    let results: TmdbDiscoverResult[] = []
    for (let attempt = 0; attempt < 3 && results.length === 0; attempt++) {
      const batch = await getRandomDiscoverBatch()
      results = batch.filter((r) => !moviesStore.rejectedExternalKeys.has(drawKey(r)) && !existingKeys.has(drawKey(r)))
    }
    if (!results.length) {
      drawError.value = 'Nie znaleziono nowych tytułów do wylosowania — spróbuj ponownie.'
      return
    }
    drawSourceMap.value = new Map(results.map((r) => [drawKey(r), r]))
    addedExternalMovies.value = new Map()
    drawItems.value = results.map(discoverToDrawItem)
    showDrawModal.value = true
  } catch (err) {
    drawError.value = err instanceof Error ? err.message : 'Błąd losowania.'
  } finally {
    drawLoading.value = false
  }
}

async function ensureDrawnMovieSaved(source: TmdbDiscoverResult, favorite: boolean) {
  const key = drawKey(source)
  const existingDocId = addedExternalMovies.value.get(key)
  if (existingDocId) {
    await moviesStore.updateMovie(existingDocId, { favorite })
    return
  }
  const docId = await moviesStore.addMovie({
    tmdbId: source.id,
    mediaType: source.mediaType,
    title: source.title,
    platform: 'Inna',
    category: source.genres.join(', ') || 'Inne',
    status: 'do obejrzenia',
    favorite,
    ...(source.posterUrl ? { photoUrl: source.posterUrl } : {}),
  })
  addedExternalMovies.value.set(key, docId)
}

function handleDrawReject(id: string) {
  const source = drawSourceMap.value.get(id)
  if (source) moviesStore.rejectExternalTitle(source.id, source.mediaType).catch(() => {})
}

function handleDrawFavorite(id: string) {
  const source = drawSourceMap.value.get(id)
  if (source) ensureDrawnMovieSaved(source, true).catch((err) => {
    formError.value = err instanceof Error ? err.message : 'Nie udało się dodać tytułu.'
  })
}

function handleDrawLike(id: string) {
  const source = drawSourceMap.value.get(id)
  if (source) ensureDrawnMovieSaved(source, false).catch((err) => {
    formError.value = err instanceof Error ? err.message : 'Nie udało się dodać tytułu.'
  })
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="flex items-center gap-3 mb-8">
      <Clapperboard class="w-7 h-7 text-orange-600 dark:text-orange-400 shrink-0" />
      <div class="flex-1 min-w-0">
        <h2 class="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-wide uppercase">Movies &amp; Series</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">Wyszukaj, oznacz jako obejrzane i oceń</p>
      </div>
      <button
        type="button"
        @click="openDraw"
        :disabled="drawLoading"
        class="flex items-center justify-center gap-1.5 sm:gap-2 p-3 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-orange-500 text-black hover:bg-orange-400 transition-colors disabled:opacity-50 shrink-0"
      >
        <Shuffle class="w-6 h-6 sm:w-4 sm:h-4" />
        <span class="hidden sm:inline">{{ drawLoading ? 'Losuję...' : 'Losowanie' }}</span>
      </button>
    </div>
    <p v-if="drawError" class="-mt-6 mb-6 text-xs text-red-500">{{ drawError }}</p>

    <RandomDrawModal
      v-if="showDrawModal"
      :items="drawItems"
      kind="film"
      @close="showDrawModal = false"
      @reject="handleDrawReject"
      @favorite="handleDrawFavorite"
      @like="handleDrawLike"
    />

    <MovieDetailsModal v-if="selectedDetailsMovie" :movie="selectedDetailsMovie" @close="selectedDetailsMovie = null" />

    <MovieDetailsModal
      v-if="selectedCatalogItem"
      :movie="{
        tmdbId: selectedCatalogItem.id,
        mediaType: selectedCatalogItem.mediaType,
        title: selectedCatalogItem.title,
        photoUrl: selectedCatalogItem.posterUrl ?? undefined,
      }"
      mode="catalog"
      :adding="catalogAdding"
      :add-error="catalogAddError"
      @close="selectedCatalogItem = null"
      @add="addCatalogItemToList"
    />

    <div class="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
      <div class="space-y-6">
        <!-- Wyszukiwarka TMDB -->
        <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3">Wyszukaj film</h3>

          <p v-if="!isTmdbConfigured()" class="text-xs text-red-500 mb-3">
            Brak klucza TMDB API — ustaw <code>VITE_TMDB_API_KEY</code> w pliku <code>.env.local</code>.
          </p>

          <div class="relative">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="np. Incepcja"
              class="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-orange-500/50"
            />
          </div>
          <p v-if="searching" class="text-xs text-slate-500 mt-2">Szukam...</p>
          <p v-if="searchError" class="text-xs text-red-500 mt-2">{{ searchError }}</p>

          <div v-if="searchResults.length" class="mt-3 space-y-1.5 max-h-72 overflow-y-auto">
            <button
              v-for="r in searchResults"
              :key="r.id"
              type="button"
              @click="selectResult(r)"
              class="w-full flex items-center gap-3 p-2 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/60 hover:border-orange-500/40 transition-colors text-left"
            >
              <img v-if="r.posterUrl" :src="r.posterUrl" :alt="r.title" class="w-10 h-14 rounded-lg object-cover shrink-0" />
              <div v-else class="w-10 h-14 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Clapperboard class="w-4 h-4 text-slate-400" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{{ r.title }}</p>
                <p class="text-[10px] text-slate-500">{{ r.year }} · {{ r.genres.join(', ') || 'brak gatunku' }}</p>
              </div>
              <span v-if="r.voteAverage" class="ml-auto flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                <Star class="w-3 h-3 fill-amber-400" /> {{ r.voteAverage.toFixed(1) }}
              </span>
            </button>
          </div>

          <!-- Potwierdzenie dodania -->
          <div v-if="selectedResult" class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
            <img v-if="selectedResult.posterUrl" :src="selectedResult.posterUrl" :alt="selectedResult.title" class="w-20 h-28 rounded-xl object-cover shrink-0" />
            <div class="flex-1 min-w-0 space-y-3">
              <div>
                <p class="text-sm font-bold text-slate-900 dark:text-white truncate">{{ selectedResult.title }}</p>
                <p class="text-[10px] text-slate-500">{{ selectedResult.year }} · {{ selectedResult.genres.join(', ') || 'brak gatunku' }}</p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Platforma</label>
                  <select v-model="addForm.platform" class="mt-1 w-full px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none">
                    <option v-for="p in PLATFORMS" :key="p" :value="p">{{ p }}</option>
                  </select>
                </div>
                <div>
                  <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Status</label>
                  <select v-model="addForm.status" class="mt-1 w-full px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none">
                    <option value="do obejrzenia">Do obejrzenia</option>
                    <option value="obejrzany">Obejrzany</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Twoja ocena: {{ addForm.rating }}/10</label>
                <input v-model.number="addForm.rating" type="range" min="1" max="10" step="1" class="w-full mt-1 accent-orange-500" />
              </div>

              <p v-if="formError" class="text-xs text-red-500">{{ formError }}</p>

              <div class="flex items-center gap-2 flex-wrap">
                <button type="button" @click="confirmAdd" :disabled="saving" class="px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500 text-black hover:bg-orange-400 transition-colors disabled:opacity-50">
                  Dodaj do listy
                </button>
                <button type="button" @click="cancelSelection" class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Katalog wszystkich filmów i seriali (TMDB, z paginacją i filtrami) -->
        <MovieCatalogPanel :excluded-keys="existingCatalogKeys" @open-details="openCatalogDetails" />

        <!-- Lista filmów -->
        <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Twoja lista</h3>
            <button
              type="button"
              @click="showMobileFilters = true"
              class="xl:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-orange-500/40 transition-all cursor-pointer"
            >
              <Filter class="w-3.5 h-3.5" /> Filtry
            </button>
          </div>

          <div v-if="moviesStore.loading" class="flex flex-col items-center justify-center gap-2 py-14 text-slate-400 dark:text-slate-500">
            <Loader2 class="w-6 h-6 animate-spin text-orange-500" />
            <p class="text-xs font-semibold">Wczytuję Twoją listę filmów i seriali...</p>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div
              v-for="movie in displayedMovies"
              :key="movie.id"
              class="rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/60 overflow-hidden flex flex-col hover:border-orange-500/40 transition-all"
            >
              <div
                @click="openMovieDetails(movie)"
                class="aspect-[5/2] w-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-950 relative flex items-center justify-center overflow-hidden cursor-pointer"
              >
                <img v-if="movie.photoUrl" :src="movie.photoUrl" :alt="movie.title" class="w-full h-full object-cover" />
                <Clapperboard v-else class="w-8 h-8 text-slate-400 dark:text-slate-700" />
                <span class="absolute top-2 right-2 text-[9px] font-bold bg-black/70 text-slate-200 px-1.5 py-0.5 rounded">
                  {{ movie.platform }}
                </span>
                <span
                  v-if="movie.status === 'do obejrzenia'"
                  class="absolute top-2 left-2 text-[9px] font-bold bg-orange-500 text-black px-1.5 py-0.5 rounded"
                >
                  Do obejrzenia
                </span>
              </div>
              <div class="p-3 flex-1 flex flex-col">
                <h4
                  @click="openMovieDetails(movie)"
                  class="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight mb-1 cursor-pointer hover:underline"
                >
                  {{ movie.title }}
                </h4>
                <p class="text-[10px] text-slate-500 mb-2">{{ movie.category }}</p>

                <template v-if="markingWatchedId === movie.id">
                  <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Ocena: {{ watchedRatingDraft }}/10</label>
                  <input v-model.number="watchedRatingDraft" type="range" min="1" max="10" step="1" class="w-full accent-orange-500 mb-2" />
                  <div class="flex items-center gap-1.5 mt-auto">
                    <button type="button" @click="confirmMarkWatched(movie)" class="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold bg-orange-500 text-black hover:bg-orange-400 transition-colors">
                      <Check class="w-3.5 h-3.5" /> Zapisz
                    </button>
                    <button type="button" @click="cancelMarkWatched" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                      <X class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </template>
                <div v-else class="flex items-center justify-between mt-auto">
                  <span v-if="movie.status === 'obejrzany'" class="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    <Star class="w-3.5 h-3.5 fill-amber-400" /> {{ movie.rating }}/10
                  </span>
                  <button
                    v-else
                    type="button"
                    @click="startMarkWatched(movie)"
                    class="flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    <Eye class="w-3.5 h-3.5" /> Oznacz jako obejrzane
                  </button>
                  <button type="button" @click="removeMovie(movie)" class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Usuń">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div v-if="!filteredMovies.length" class="sm:col-span-2 lg:col-span-3 text-center py-10 text-sm text-slate-500">
              {{ moviesStore.movies.length ? 'Brak filmów pasujących do filtrów.' : 'Nie masz jeszcze żadnych filmów na liście — wyszukaj coś powyżej.' }}
            </div>
          </div>

          <button
            v-if="canShowMoreMovies"
            type="button"
            @click="showMoreMovies"
            class="w-full mt-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-orange-500/40 transition-all cursor-pointer"
          >
            Pokaż więcej
          </button>
        </div>
      </div>

      <!-- Super-filtr: stały panel na xl+, wysuwany drawer na mobile/tablet -->
      <div class="hidden xl:block bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5">
        <SuperFilterPanel
          v-model:status-filter="statusFilter"
          v-model:min-rating="minRating"
          :selected-genres="selectedGenres"
          @toggle-genre="toggleGenre"
          @reset="resetFilters"
        />
      </div>

      <Teleport to="body">
        <div v-if="showMobileFilters" class="xl:hidden fixed inset-0 z-50 flex justify-end">
          <div class="absolute inset-0 bg-black/50" @click="showMobileFilters = false" />
          <div class="relative w-full max-w-xs h-full bg-white dark:bg-[#0b1220] border-l border-slate-200 dark:border-slate-800 p-5 pr-12 overflow-y-auto">
            <button
              type="button"
              @click="showMobileFilters = false"
              class="absolute top-2 right-2 w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
              title="Zamknij filtry"
            >
              <X class="w-5 h-5" />
            </button>
            <SuperFilterPanel
              v-model:status-filter="statusFilter"
              v-model:min-rating="minRating"
              :selected-genres="selectedGenres"
              @toggle-genre="toggleGenre"
              @reset="resetFilters"
            />
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>
