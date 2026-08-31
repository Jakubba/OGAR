<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { AlertTriangle, Clapperboard, Music2, Sparkles, Star } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useDocumentsStore } from '@/stores/documents'
import { useMusicStore } from '@/stores/music'
import { useMoviesStore } from '@/stores/movies'
import { daysUntil, formatDaysLabel } from '@/lib/documents'

const authStore = useAuthStore()
const documentsStore = useDocumentsStore()
const musicStore = useMusicStore()
const moviesStore = useMoviesStore()

watch(
  () => authStore.user?.uid,
  () => {
    documentsStore.watch()
    musicStore.watch()
    moviesStore.watch()
  },
  { immediate: true },
)
onUnmounted(() => {
  documentsStore.stopWatching()
  musicStore.stopWatching()
  moviesStore.stopWatching()
})

const toWatchMovies = computed(() => moviesStore.movies.filter((m) => m.status === 'do obejrzenia'))
const toListenTracks = computed(() => musicStore.tracks.filter((t) => t.status === 'do odsłuchania'))
const favoriteCount = computed(
  () => moviesStore.movies.filter((m) => m.favorite).length + musicStore.tracks.filter((t) => t.favorite).length,
)

const stats = computed(() => [
  { label: 'Utwory w kolekcji', value: String(musicStore.tracks.length), icon: Music2, color: 'from-orange-500 to-amber-500' },
  { label: 'Filmy i seriale', value: String(moviesStore.movies.length), icon: Clapperboard, color: 'from-cyan-500 to-blue-500' },
  {
    label: 'Do obejrzenia / odsłuchania',
    value: String(toWatchMovies.value.length + toListenTracks.value.length),
    icon: Sparkles,
    color: 'from-amber-500 to-orange-600',
  },
  { label: 'Ulubione', value: String(favoriteCount.value), icon: Star, color: 'from-blue-500 to-cyan-400' },
])

interface RecentItem {
  id: string
  title: string
  tag: string
  status: string
  to: string
}

const recentActivities = computed<RecentItem[]>(() => {
  const movies: RecentItem[] = moviesStore.movies.slice(0, 3).map((m) => ({
    id: `movie-${m.id}`,
    title: m.title,
    tag: m.mediaType === 'tv' ? 'Serial' : 'Film',
    status: m.status === 'obejrzany' ? 'Obejrzane' : 'Do obejrzenia',
    to: '/movies-series',
  }))
  const tracks: RecentItem[] = musicStore.tracks.slice(0, 3).map((t) => ({
    id: `track-${t.id}`,
    title: `${t.title} — ${t.artist}`,
    tag: 'Muzyka',
    status: t.status === 'odsłuchane' ? 'Odsłuchane' : 'Do odsłuchania',
    to: '/music',
  }))
  return [...movies, ...tracks].slice(0, 6)
})
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl">
    <div>
      <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-wide uppercase">Overview</h2>
      <p class="text-xs text-slate-500 dark:text-slate-400">Witaj z powrotem w systemie OGAR</p>
    </div>

    <RouterLink
      v-if="documentsStore.alerts.length"
      to="/documents"
      class="block bg-white/90 dark:bg-[#0b1220]/80 border border-orange-500/30 rounded-2xl p-5 hover:border-orange-500/50 transition-colors"
    >
      <h3 class="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide flex items-center gap-2 mb-3">
        <AlertTriangle class="w-4 h-4" /> Dokumenty wymagają uwagi
      </h3>
      <div class="space-y-1.5">
        <div
          v-for="doc in documentsStore.alerts.slice(0, 3)"
          :key="doc.id"
          class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300"
        >
          <span class="font-semibold">{{ doc.name }}</span>
          <span class="text-xs font-bold text-orange-600 dark:text-orange-400">{{ formatDaysLabel(daysUntil(doc.expiresAt)) }}</span>
        </div>
      </div>
    </RouterLink>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <div
        v-for="(stat, index) in stats"
        :key="index"
        class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-orange-500/40 transition-all duration-300"
      >
        <div :class="['absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity', stat.color]" />

        <div class="flex justify-between items-start mb-4">
          <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ stat.label }}</span>
          <div class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-orange-600 dark:text-orange-400">
            <component :is="stat.icon" class="w-5 h-5" />
          </div>
        </div>

        <div class="flex items-baseline justify-between">
          <h3 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{{ stat.value }}</h3>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-center mb-6">
            <div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">Co dalej?</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Twoja kolejka do obejrzenia i odsłuchania</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <RouterLink
              to="/movies-series"
              class="rounded-xl bg-gradient-to-br from-orange-50 via-white to-slate-100 dark:from-slate-950 dark:via-[#0e172a] dark:to-[#1a110b] border border-slate-200 dark:border-slate-800 p-5 relative overflow-hidden hover:border-orange-500/40 transition-colors"
            >
              <div class="absolute -top-10 -left-10 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl" />
              <Clapperboard class="w-8 h-8 text-orange-600 dark:text-orange-400 mb-3 relative z-10" />
              <p class="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold relative z-10">Następny do obejrzenia</p>
              <p class="text-sm font-bold text-slate-900 dark:text-white mt-1 relative z-10 truncate">
                {{ toWatchMovies[0]?.title ?? 'Kolejka jest pusta' }}
              </p>
              <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1 relative z-10">
                {{ toWatchMovies.length }} {{ toWatchMovies.length === 1 ? 'pozycja' : 'pozycji' }} w kolejce
              </p>
            </RouterLink>

            <RouterLink
              to="/music"
              class="rounded-xl bg-gradient-to-br from-orange-50 via-white to-slate-100 dark:from-slate-950 dark:via-[#0e172a] dark:to-[#1a110b] border border-slate-200 dark:border-slate-800 p-5 relative overflow-hidden hover:border-orange-500/40 transition-colors"
            >
              <div class="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />
              <Music2 class="w-8 h-8 text-orange-600 dark:text-orange-400 mb-3 relative z-10" />
              <p class="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold relative z-10">Następny do odsłuchania</p>
              <p class="text-sm font-bold text-slate-900 dark:text-white mt-1 relative z-10 truncate">
                {{ toListenTracks[0]?.title ?? 'Kolejka jest pusta' }}
              </p>
              <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1 relative z-10">
                {{ toListenTracks.length }} {{ toListenTracks.length === 1 ? 'pozycja' : 'pozycji' }} w kolejce
              </p>
            </RouterLink>
          </div>
        </div>
      </div>

      <div class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Ostatnio dodane</h3>

        <div v-if="recentActivities.length" class="space-y-4">
          <RouterLink
            v-for="item in recentActivities"
            :key="item.id"
            :to="item.to"
            class="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col gap-1"
          >
            <div class="flex justify-between items-center">
              <span class="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                {{ item.tag }}
              </span>
            </div>
            <p class="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1 truncate">{{ item.title }}</p>
            <p class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{{ item.status }}</p>
          </RouterLink>
        </div>
        <p v-else class="text-xs text-slate-500 dark:text-slate-400">
          Nic jeszcze nie dodałeś — zajrzyj do Muzyki albo Movies &amp; Series.
        </p>
      </div>
    </div>
  </div>
</template>
