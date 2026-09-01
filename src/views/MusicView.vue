<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch as vueWatch } from 'vue'
import { Check, Eye, Loader2, Music2, Pause, Pencil, Play, Plus, Search, Shuffle, Star, Trash2, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useMusicStore, type Track, type TrackStatus } from '@/stores/music'
import { useMusicPlaylistsStore } from '@/stores/musicPlaylists'
import { getRandomTracks, searchTracks, type ItunesSearchResult } from '@/lib/itunes'
import RandomDrawModal, { type DrawItem } from '@/components/media/RandomDrawModal.vue'
import { useMobileReveal } from '@/composables/useMobileReveal'

const authStore = useAuthStore()
const musicStore = useMusicStore()
const playlistsStore = useMusicPlaylistsStore()

vueWatch(
  () => authStore.user?.uid,
  () => {
    musicStore.watch()
    playlistsStore.watch()
  },
  { immediate: true },
)
onUnmounted(() => {
  musicStore.stopWatching()
  playlistsStore.stopWatching()
})

const PLATFORMS = ['Spotify', 'Apple Music', 'YouTube Music', 'Tidal', 'Deezer', 'SoundCloud', 'Inna']

// Playlisty
const selectedPlaylistId = ref<string | null>(null)
const playlistError = ref('')
const creatingPlaylist = ref(false)
const newPlaylistName = ref('')
const showNewPlaylistInput = ref(false)
const renamingPlaylistId = ref<string | null>(null)
const renameDraft = ref('')

vueWatch(
  [() => playlistsStore.playlists, () => playlistsStore.loading],
  async ([list, loading]) => {
    if (selectedPlaylistId.value && list.some((p) => p.id === selectedPlaylistId.value)) return
    if (list.length) {
      selectedPlaylistId.value = list[0].id
      return
    }
    // Nie twórz automatycznie playlisty, dopóki nie wiadomo na pewno, że lista jest pusta
    // (a nie po prostu jeszcze się nie załadowała z Firestore).
    if (loading || !authStore.user || creatingPlaylist.value) return
    creatingPlaylist.value = true
    try {
      selectedPlaylistId.value = await playlistsStore.createPlaylist('Moja lista')
    } catch (err) {
      playlistError.value = err instanceof Error ? err.message : 'Nie udało się utworzyć playlisty.'
    } finally {
      creatingPlaylist.value = false
    }
  },
  { immediate: true },
)

async function createPlaylist() {
  if (!newPlaylistName.value.trim()) return
  try {
    selectedPlaylistId.value = await playlistsStore.createPlaylist(newPlaylistName.value.trim())
    newPlaylistName.value = ''
    showNewPlaylistInput.value = false
  } catch (err) {
    playlistError.value = err instanceof Error ? err.message : 'Nie udało się utworzyć playlisty.'
  }
}

function startRenamePlaylist(id: string, currentName: string) {
  renamingPlaylistId.value = id
  renameDraft.value = currentName
}

async function confirmRenamePlaylist() {
  if (!renamingPlaylistId.value || !renameDraft.value.trim()) {
    renamingPlaylistId.value = null
    return
  }
  try {
    await playlistsStore.renamePlaylist(renamingPlaylistId.value, renameDraft.value.trim())
  } catch (err) {
    playlistError.value = err instanceof Error ? err.message : 'Nie udało się zmienić nazwy.'
  }
  renamingPlaylistId.value = null
}

async function deletePlaylist(id: string) {
  if (!window.confirm('Usunąć tę playlistę razem ze wszystkimi jej utworami?')) return
  try {
    await musicStore.deleteTracksInPlaylist(id)
    await playlistsStore.deletePlaylist(id)
    if (selectedPlaylistId.value === id) selectedPlaylistId.value = null
  } catch (err) {
    playlistError.value = err instanceof Error ? err.message : 'Nie udało się usunąć playlisty.'
  }
}

// Podgląd 30s (iTunes preview)
const previewAudio = ref<HTMLAudioElement | null>(null)
const playingUrl = ref<string | null>(null)

function togglePreview(url: string | null | undefined) {
  if (!url) return
  if (playingUrl.value === url) {
    previewAudio.value?.pause()
    playingUrl.value = null
    return
  }
  previewAudio.value?.pause()
  const audio = new Audio(url)
  audio.addEventListener('ended', () => {
    if (playingUrl.value === url) playingUrl.value = null
  })
  audio.play().catch(() => {})
  previewAudio.value = audio
  playingUrl.value = url
}

function stopPreview() {
  previewAudio.value?.pause()
  playingUrl.value = null
}

onUnmounted(() => previewAudio.value?.pause())

// Wyszukiwarka iTunes
const searchQuery = ref('')
const searchResults = ref<ItunesSearchResult[]>([])
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
      searchResults.value = await searchTracks(trimmed)
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

// Potwierdzenie dodania wybranego utworu
const selectedResult = ref<ItunesSearchResult | null>(null)
const addForm = reactive({
  platform: PLATFORMS[0],
  status: 'do odsłuchania' as TrackStatus,
  rating: 8,
})
const formError = ref('')
const saving = ref(false)

function selectResult(r: ItunesSearchResult) {
  selectedResult.value = r
  searchResults.value = []
  searchQuery.value = ''
  addForm.platform = PLATFORMS[0]
  addForm.status = 'do odsłuchania'
  addForm.rating = 8
  formError.value = ''
}

function cancelSelection() {
  selectedResult.value = null
}

async function confirmAdd() {
  if (!selectedResult.value || saving.value || !selectedPlaylistId.value) return
  saving.value = true
  formError.value = ''
  try {
    await musicStore.addTrack({
      playlistId: selectedPlaylistId.value,
      itunesId: selectedResult.value.id,
      title: selectedResult.value.title,
      artist: selectedResult.value.artist,
      album: selectedResult.value.album,
      genre: selectedResult.value.genre,
      platform: addForm.platform,
      status: addForm.status,
      rating: addForm.rating,
      photoUrl: selectedResult.value.artworkUrl ?? undefined,
      previewUrl: selectedResult.value.previewUrl ?? undefined,
    })
    selectedResult.value = null
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Nie udało się dodać utworu.'
  } finally {
    saving.value = false
  }
}

function removeTrack(track: Track) {
  if (!window.confirm(`Usunąć „${track.title}” z listy?`)) return
  musicStore.deleteTrack(track.id).catch((err) => {
    formError.value = err instanceof Error ? err.message : 'Nie udało się usunąć utworu.'
  })
}

// Oznaczanie „do odsłuchania” jako odsłuchane, z oceną
const markingListenedId = ref<string | null>(null)
const listenedRatingDraft = ref(8)

function startMarkListened(track: Track) {
  markingListenedId.value = track.id
  listenedRatingDraft.value = 8
}

function cancelMarkListened() {
  markingListenedId.value = null
}

function confirmMarkListened(track: Track) {
  musicStore.updateTrack(track.id, { status: 'odsłuchane', rating: listenedRatingDraft.value }).catch((err) => {
    formError.value = err instanceof Error ? err.message : 'Nie udało się zaktualizować utworu.'
  })
  markingListenedId.value = null
}

// Super-filtr
const selectedPlatforms = reactive<string[]>([])
function togglePlatform(p: string) {
  const i = selectedPlatforms.indexOf(p)
  if (i >= 0) selectedPlatforms.splice(i, 1)
  else selectedPlatforms.push(p)
}

const selectedGenres = reactive<string[]>([])
function toggleGenre(g: string) {
  const i = selectedGenres.indexOf(g)
  if (i >= 0) selectedGenres.splice(i, 1)
  else selectedGenres.push(g)
}

const selectedPlaylist = computed(() => playlistsStore.playlists.find((p) => p.id === selectedPlaylistId.value) ?? null)
const playlistTracks = computed(() => musicStore.tracks.filter((t) => t.playlistId === selectedPlaylistId.value))

// Losowanie — losuje utwór z API iTunes (spoza własnej listy), a nie z tego, co już masz zapisane
const showDrawModal = ref(false)
const drawItems = ref<DrawItem[]>([])
const drawLoading = ref(false)
const drawError = ref('')
const drawSourceMap = ref<Map<string, ItunesSearchResult>>(new Map())
const addedExternalTracks = ref<Map<string, string>>(new Map()) // itunesId(string) -> id dokumentu w Firestore

function trackToDrawItem(r: ItunesSearchResult): DrawItem {
  return {
    id: String(r.id),
    title: r.title,
    subtitle: `${r.artist} · ${r.genre}`,
    meta: r.album,
    badge: 'iTunes',
    imageUrl: r.artworkUrl ?? undefined,
    previewUrl: r.previewUrl ?? undefined,
    favorite: false,
  }
}

async function openDraw() {
  drawLoading.value = true
  drawError.value = ''
  try {
    await musicStore.loadRejectedExternal()
    const existingIds = new Set(musicStore.tracks.map((t) => t.itunesId).filter((v): v is number => v != null))
    let results: ItunesSearchResult[] = []
    for (let attempt = 0; attempt < 3 && results.length === 0; attempt++) {
      const batch = await getRandomTracks()
      results = batch.filter((r) => !musicStore.rejectedExternalIds.has(r.id) && !existingIds.has(r.id))
    }
    if (!results.length) {
      drawError.value = 'Nie znaleziono nowych utworów do wylosowania — spróbuj ponownie.'
      return
    }
    drawSourceMap.value = new Map(results.map((r) => [String(r.id), r]))
    addedExternalTracks.value = new Map()
    drawItems.value = results.map(trackToDrawItem)
    showDrawModal.value = true
  } catch (err) {
    drawError.value = err instanceof Error ? err.message : 'Błąd losowania.'
  } finally {
    drawLoading.value = false
  }
}

async function ensureDrawnTrackSaved(source: ItunesSearchResult, favorite: boolean) {
  const key = String(source.id)
  const existingDocId = addedExternalTracks.value.get(key)
  if (existingDocId) {
    await musicStore.updateTrack(existingDocId, { favorite })
    return
  }
  if (!selectedPlaylistId.value) return
  const docId = await musicStore.addTrack({
    playlistId: selectedPlaylistId.value,
    itunesId: source.id,
    title: source.title,
    artist: source.artist,
    album: source.album,
    genre: source.genre,
    platform: 'Inna',
    status: 'do odsłuchania',
    photoUrl: source.artworkUrl ?? undefined,
    previewUrl: source.previewUrl ?? undefined,
    favorite,
  })
  addedExternalTracks.value.set(key, docId)
}

function handleDrawReject(id: string) {
  const source = drawSourceMap.value.get(id)
  if (source) musicStore.rejectExternalTrack(source.id).catch(() => {})
}

function handleDrawFavorite(id: string) {
  const source = drawSourceMap.value.get(id)
  if (source) ensureDrawnTrackSaved(source, true).catch((err) => {
    formError.value = err instanceof Error ? err.message : 'Nie udało się dodać utworu.'
  })
}

function handleDrawLike(id: string) {
  const source = drawSourceMap.value.get(id)
  if (source) ensureDrawnTrackSaved(source, false).catch((err) => {
    formError.value = err instanceof Error ? err.message : 'Nie udało się dodać utworu.'
  })
}

const knownGenres = computed(() => Array.from(new Set(playlistTracks.value.map((t) => t.genre).filter(Boolean))).sort())

const statusFilter = ref<'wszystkie' | TrackStatus>('wszystkie')
const minRating = ref(0)

const filteredTracks = computed(() =>
  playlistTracks.value.filter((t) => {
    if (statusFilter.value !== 'wszystkie' && t.status !== statusFilter.value) return false
    if (selectedPlatforms.length && !selectedPlatforms.includes(t.platform)) return false
    if (selectedGenres.length && !selectedGenres.includes(t.genre)) return false
    if (t.rating != null && t.rating < minRating.value) return false
    return true
  }),
)

const { displayedItems: displayedTracks, canShowMore: canShowMoreTracks, showMore: showMoreTracks } = useMobileReveal(
  filteredTracks,
  { initial: 5, firstStep: 5, nextStep: 5 },
)

function resetFilters() {
  selectedPlatforms.splice(0, selectedPlatforms.length)
  selectedGenres.splice(0, selectedGenres.length)
  statusFilter.value = 'wszystkie'
  minRating.value = 0
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="flex items-center gap-3 mb-8">
      <Music2 class="w-7 h-7 text-orange-600 dark:text-orange-400" />
      <div class="flex-1">
        <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-wide uppercase">Muzyka</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">Wyszukaj (iTunes), oznacz jako odsłuchane i oceń</p>
      </div>
      <button
        type="button"
        @click="openDraw"
        :disabled="drawLoading"
        class="flex items-center justify-center gap-2 p-3 sm:px-4 sm:py-2 rounded-xl text-sm font-bold bg-orange-500 text-black hover:bg-orange-400 transition-colors disabled:opacity-50"
      >
        <Shuffle class="w-6 h-6 sm:w-4 sm:h-4" />
        <span class="hidden sm:inline">{{ drawLoading ? 'Losuję...' : 'Losowanie' }}</span>
      </button>
    </div>
    <p v-if="drawError" class="-mt-6 mb-6 text-xs text-red-500">{{ drawError }}</p>

    <RandomDrawModal
      v-if="showDrawModal"
      :items="drawItems"
      kind="music"
      :playing-url="playingUrl"
      @close="showDrawModal = false"
      @reject="handleDrawReject"
      @favorite="handleDrawFavorite"
      @like="handleDrawLike"
      @toggle-preview="togglePreview"
      @stop-preview="stopPreview"
    />

    <div class="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
      <div class="space-y-6">
        <!-- Playlisty -->
        <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3">Playlisty</h3>
          <p v-if="playlistError" class="text-xs text-red-500 mb-2">{{ playlistError }}</p>

          <div class="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
            <div
              v-for="p in playlistsStore.playlists"
              :key="p.id"
              :class="[
                'flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-xl text-sm font-semibold border transition-all min-w-0 w-full sm:w-auto sm:max-w-full',
                selectedPlaylistId === p.id
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-600 dark:text-orange-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700',
              ]"
            >
              <template v-if="renamingPlaylistId === p.id">
                <input
                  v-model="renameDraft"
                  type="text"
                  autofocus
                  @keyup.enter="confirmRenamePlaylist"
                  @blur="confirmRenamePlaylist"
                  class="w-full sm:w-28 px-1.5 py-0.5 rounded-md text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none"
                />
              </template>
              <template v-else>
                <button type="button" @click="selectedPlaylistId = p.id" class="flex-1 min-w-0 sm:flex-initial sm:max-w-[220px] truncate text-left cursor-pointer">{{ p.name }}</button>
                <button
                  v-if="selectedPlaylistId === p.id"
                  type="button"
                  @click.stop="startRenamePlaylist(p.id, p.name)"
                  class="p-1 rounded-md hover:bg-orange-500/10"
                  title="Zmień nazwę"
                >
                  <Pencil class="w-3 h-3" />
                </button>
                <button
                  v-if="selectedPlaylistId === p.id"
                  type="button"
                  @click.stop="deletePlaylist(p.id)"
                  class="p-1 rounded-md hover:bg-red-500/10 hover:text-red-500"
                  title="Usuń playlistę"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </template>
            </div>

            <div v-if="showNewPlaylistInput" class="flex items-center gap-1.5 w-full sm:w-auto">
              <input
                v-model="newPlaylistName"
                type="text"
                placeholder="Nazwa playlisty"
                autofocus
                @keyup.enter="createPlaylist"
                class="flex-1 min-w-0 sm:w-32 px-2 py-1.5 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none"
              />
              <button type="button" @click="createPlaylist" class="p-1.5 rounded-lg bg-orange-500 text-black hover:bg-orange-400 transition-colors">
                <Check class="w-3.5 h-3.5" />
              </button>
              <button type="button" @click="showNewPlaylistInput = false; newPlaylistName = ''" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              v-else
              type="button"
              @click="showNewPlaylistInput = true"
              class="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-orange-600 dark:text-orange-400 border border-dashed border-orange-500/40 hover:bg-orange-500/10 transition-colors"
            >
              <Plus class="w-3.5 h-3.5" /> Nowa playlista
            </button>
          </div>
        </div>

        <!-- Wyszukiwarka iTunes -->
        <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3">Wyszukaj utwór</h3>

          <div class="relative">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="np. Daft Punk"
              class="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-orange-500/50"
            />
          </div>
          <p v-if="searching" class="text-xs text-slate-500 mt-2">Szukam...</p>
          <p v-if="searchError" class="text-xs text-red-500 mt-2">{{ searchError }}</p>

          <div v-if="searchResults.length" class="mt-3 space-y-1.5 max-h-72 overflow-y-auto">
            <div
              v-for="r in searchResults"
              :key="r.id"
              class="w-full flex items-center gap-3 p-2 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/60 hover:border-orange-500/40 transition-colors"
            >
              <button type="button" @click="selectResult(r)" class="flex items-center gap-3 flex-1 min-w-0 text-left">
                <img v-if="r.artworkUrl" :src="r.artworkUrl" :alt="r.title" class="w-10 h-10 rounded-lg object-cover shrink-0" />
                <div v-else class="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Music2 class="w-4 h-4 text-slate-400" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{{ r.title }}</p>
                  <p class="text-[10px] text-slate-500 truncate">{{ r.artist }} · {{ r.album || r.year }}</p>
                </div>
              </button>
              <button
                v-if="r.previewUrl"
                type="button"
                @click="togglePreview(r.previewUrl)"
                class="p-2 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 transition-colors shrink-0"
                title="Odtwórz podgląd"
              >
                <component :is="playingUrl === r.previewUrl ? Pause : Play" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Potwierdzenie dodania -->
          <div v-if="selectedResult" class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
            <img v-if="selectedResult.artworkUrl" :src="selectedResult.artworkUrl" :alt="selectedResult.title" class="w-20 h-20 rounded-xl object-cover shrink-0" />
            <div class="flex-1 min-w-0 space-y-3">
              <div class="min-w-0">
                <p class="text-sm font-bold text-slate-900 dark:text-white truncate">{{ selectedResult.title }}</p>
                <p class="text-[10px] text-slate-500 truncate">{{ selectedResult.artist }} · {{ selectedResult.album || selectedResult.year }} · {{ selectedResult.genre }}</p>
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
                    <option value="do odsłuchania">Do odsłuchania</option>
                    <option value="odsłuchane">Odsłuchane</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Twoja ocena: {{ addForm.rating }}/10</label>
                <input v-model.number="addForm.rating" type="range" min="1" max="10" step="1" class="w-full mt-1 accent-orange-500" />
              </div>

              <p v-if="formError" class="text-xs text-red-500">{{ formError }}</p>

              <div class="flex flex-wrap items-center gap-2">
                <button type="button" @click="confirmAdd" :disabled="saving" class="px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500 text-black hover:bg-orange-400 transition-colors disabled:opacity-50">
                  Dodaj do listy
                </button>
                <button
                  v-if="selectedResult.previewUrl"
                  type="button"
                  @click="togglePreview(selectedResult.previewUrl)"
                  class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 transition-colors"
                >
                  <component :is="playingUrl === selectedResult.previewUrl ? Pause : Play" class="w-4 h-4" /> Podgląd
                </button>
                <button type="button" @click="cancelSelection" class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista utworów -->
        <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4">{{ selectedPlaylist?.name ?? 'Twoja lista' }}</h3>

          <div v-if="musicStore.loading" class="flex flex-col items-center justify-center gap-2 py-14 text-slate-400 dark:text-slate-500">
            <Loader2 class="w-6 h-6 animate-spin text-orange-500" />
            <p class="text-xs font-semibold">Wczytuję Twoją listę utworów...</p>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div
              v-for="track in displayedTracks"
              :key="track.id"
              class="rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/60 overflow-hidden flex flex-col hover:border-orange-500/40 transition-all"
            >
              <div class="h-32 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-950 relative flex items-center justify-center overflow-hidden">
                <img v-if="track.photoUrl" :src="track.photoUrl" :alt="track.title" class="w-full h-full object-cover" />
                <Music2 v-else class="w-8 h-8 text-slate-400 dark:text-slate-700" />
                <span class="absolute top-2 right-2 text-[9px] font-bold bg-black/70 text-slate-200 px-1.5 py-0.5 rounded">
                  {{ track.platform }}
                </span>
                <span
                  v-if="track.status === 'do odsłuchania'"
                  class="absolute top-2 left-2 text-[9px] font-bold bg-orange-500 text-black px-1.5 py-0.5 rounded"
                >
                  Do odsłuchania
                </span>
                <button
                  v-if="track.previewUrl"
                  type="button"
                  @click="togglePreview(track.previewUrl)"
                  class="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  title="Odtwórz podgląd"
                >
                  <component :is="playingUrl === track.previewUrl ? Pause : Play" class="w-3.5 h-3.5" />
                </button>
              </div>
              <div class="p-3 flex-1 flex flex-col">
                <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight mb-1">{{ track.title }}</h4>
                <p class="text-[10px] text-slate-500 mb-2">{{ track.artist }} · {{ track.genre }}</p>

                <template v-if="markingListenedId === track.id">
                  <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Ocena: {{ listenedRatingDraft }}/10</label>
                  <input v-model.number="listenedRatingDraft" type="range" min="1" max="10" step="1" class="w-full accent-orange-500 mb-2" />
                  <div class="flex items-center gap-1.5 mt-auto">
                    <button type="button" @click="confirmMarkListened(track)" class="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold bg-orange-500 text-black hover:bg-orange-400 transition-colors">
                      <Check class="w-3.5 h-3.5" /> Zapisz
                    </button>
                    <button type="button" @click="cancelMarkListened" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                      <X class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </template>
                <div v-else class="flex items-center justify-between mt-auto">
                  <span v-if="track.status === 'odsłuchane'" class="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    <Star class="w-3.5 h-3.5 fill-amber-400" /> {{ track.rating }}/10
                  </span>
                  <button
                    v-else
                    type="button"
                    @click="startMarkListened(track)"
                    class="flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    <Eye class="w-3.5 h-3.5" /> Oznacz jako odsłuchane
                  </button>
                  <button type="button" @click="removeTrack(track)" class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Usuń">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div v-if="!filteredTracks.length" class="sm:col-span-2 lg:col-span-3 text-center py-10 text-sm text-slate-500">
              {{ playlistTracks.length ? 'Brak utworów pasujących do filtrów.' : 'Ta playlista jest jeszcze pusta — wyszukaj coś powyżej.' }}
            </div>
          </div>

          <button
            v-if="canShowMoreTracks"
            type="button"
            @click="showMoreTracks"
            class="w-full mt-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-orange-500/40 transition-all cursor-pointer"
          >
            Zobacz więcej
          </button>
        </div>
      </div>

      <!-- Super-filtr -->
      <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Super-Filtr</h3>
          <button type="button" @click="resetFilters" class="text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            Wyczyść
          </button>
        </div>

        <div class="space-y-5">
          <div>
            <label class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</label>
            <div class="flex flex-wrap gap-1.5 mt-2">
              <button
                v-for="s in (['wszystkie', 'odsłuchane', 'do odsłuchania'] as const)"
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
            <label class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Platforma</label>
            <div class="flex flex-wrap gap-1.5 mt-2">
              <button
                v-for="p in PLATFORMS"
                :key="p"
                @click="togglePlatform(p)"
                :class="[
                  'px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer',
                  selectedPlatforms.includes(p)
                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-600 dark:text-orange-400'
                    : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700',
                ]"
              >
                {{ p }}
              </button>
            </div>
          </div>

          <div v-if="knownGenres.length">
            <label class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Gatunek</label>
            <div class="flex flex-wrap gap-1.5 mt-2">
              <button
                v-for="g in knownGenres"
                :key="g"
                @click="toggleGenre(g)"
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
    </div>
  </div>
</template>
