<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Check, Clapperboard, Music2, Pause, Play, Star, X } from 'lucide-vue-next'

export interface DrawItem {
  id: string
  title: string
  subtitle: string
  meta?: string
  badge?: string
  imageUrl?: string
  previewUrl?: string
  favorite?: boolean
}

const props = defineProps<{
  items: DrawItem[]
  kind: 'music' | 'film'
  playingUrl?: string | null
}>()

const emit = defineEmits<{
  close: []
  reject: [id: string]
  favorite: [id: string]
  like: [id: string]
  'toggle-preview': [url: string]
  'stop-preview': []
}>()

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const pool = ref<DrawItem[]>([])
const currentIndex = ref(0)

watch(
  () => props.items,
  (items) => {
    pool.value = shuffle(items)
    currentIndex.value = 0
  },
  { immediate: true },
)

const current = computed(() => pool.value[currentIndex.value] ?? null)

function next() {
  if (!pool.value.length) return
  pool.value.splice(currentIndex.value, 1)
  if (currentIndex.value >= pool.value.length) currentIndex.value = 0
}

// Przeciąganie karty (Tinder-style): lewo = Nie, prawo = OK, góra = gwiazdka
const THRESHOLD_X = 110
const THRESHOLD_Y = 90

const dragOffset = reactive({ x: 0, y: 0 })
const isDragging = ref(false)
const exitDirection = ref<'left' | 'right' | 'up' | null>(null)
const showHint = ref(true)
let startX = 0
let startY = 0

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

const horizontalDominant = computed(() => Math.abs(dragOffset.x) >= Math.abs(dragOffset.y))
const nopeOpacity = computed(() => (horizontalDominant.value ? clamp01(-dragOffset.x / THRESHOLD_X) : 0))
const likeOpacity = computed(() => (horizontalDominant.value ? clamp01(dragOffset.x / THRESHOLD_X) : 0))
const starOpacity = computed(() => (!horizontalDominant.value ? clamp01(-dragOffset.y / THRESHOLD_Y) : 0))

const cardStyle = computed(() => {
  if (exitDirection.value === 'left' || exitDirection.value === 'right') {
    const dx = exitDirection.value === 'left' ? -700 : 700
    return {
      transform: `translate(${dx}px, ${dragOffset.y}px) rotate(${exitDirection.value === 'left' ? -28 : 28}deg)`,
      transition: 'transform 0.32s ease-in, opacity 0.32s ease-in',
      opacity: 0,
    }
  }
  if (exitDirection.value === 'up') {
    return {
      transform: `translate(${dragOffset.x}px, -750px) scale(1.05)`,
      transition: 'transform 0.32s ease-in, opacity 0.32s ease-in',
      opacity: 0,
    }
  }
  const rotate = dragOffset.x / 18
  return {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotate}deg)`,
    transition: isDragging.value ? 'none' : 'transform 0.35s cubic-bezier(.2,.8,.2,1)',
  }
})

function resetDrag() {
  dragOffset.x = 0
  dragOffset.y = 0
}

function onPointerDown(e: PointerEvent) {
  if (exitDirection.value || !current.value) return
  showHint.value = false
  isDragging.value = true
  startX = e.clientX
  startY = e.clientY
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  dragOffset.x = e.clientX - startX
  dragOffset.y = e.clientY - startY
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

// Podpowiedź: przy otwarciu popupu karta sama pokazuje ruch w każdą stronę razem z odpowiednią
// ikoną (Nie / Ulubione / OK), żeby było jasne, że kartę można przeciągać.
async function playHint() {
  const steps: Array<[number, number, number]> = [
    [-THRESHOLD_X, 0, 700],
    [0, 0, 350],
    [THRESHOLD_X, 0, 700],
    [0, 0, 350],
    [0, -THRESHOLD_Y, 700],
    [0, 0, 350],
  ]
  for (const [x, y, holdMs] of steps) {
    if (!showHint.value || isDragging.value || exitDirection.value) return
    dragOffset.x = x
    dragOffset.y = y
    await wait(holdMs)
  }
  showHint.value = false
}

onMounted(() => {
  playHint()
})

function playExit(direction: 'left' | 'right' | 'up', action: () => void) {
  exitDirection.value = direction
  window.setTimeout(() => {
    action()
    exitDirection.value = null
    resetDrag()
  }, 320)
}

function onPointerUp() {
  if (!isDragging.value) return
  isDragging.value = false
  if (horizontalDominant.value && dragOffset.x <= -THRESHOLD_X) {
    reject()
  } else if (horizontalDominant.value && dragOffset.x >= THRESHOLD_X) {
    like()
  } else if (!horizontalDominant.value && dragOffset.y <= -THRESHOLD_Y) {
    toggleFavorite()
  } else {
    resetDrag()
  }
}

// Każda z trzech akcji (Nie / Ulubione / OK) odsłania kolejną losową pozycję i zatrzymuje podgląd audio
function reject() {
  if (!current.value || exitDirection.value) return
  const id = current.value.id
  emit('stop-preview')
  playExit('left', () => {
    emit('reject', id)
    next()
  })
}

function like() {
  if (!current.value || exitDirection.value) return
  const id = current.value.id
  emit('stop-preview')
  playExit('right', () => {
    emit('like', id)
    next()
  })
}

function toggleFavorite() {
  if (!current.value || exitDirection.value) return
  const id = current.value.id
  emit('stop-preview')
  playExit('up', () => {
    emit('favorite', id)
    next()
  })
}

function togglePreview() {
  if (current.value?.previewUrl) emit('toggle-preview', current.value.previewUrl)
}

function closeModal() {
  emit('stop-preview')
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="closeModal">
    <div class="w-full max-w-sm max-h-[90vh] overflow-y-auto overscroll-contain rounded-3xl bg-white dark:bg-[#0b1220] shadow-2xl border border-slate-200 dark:border-slate-800">
      <div class="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 class="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">
          {{ kind === 'music' ? 'Losowy utwór' : 'Losowy tytuł' }}
        </h3>
        <button type="button" @click="closeModal" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div v-if="current" class="p-4 sm:p-5">
        <div
          class="draw-card select-none cursor-grab active:cursor-grabbing"
          :style="cardStyle"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <div
            :class="[
              'relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-950 flex items-center justify-center',
              kind === 'film' ? 'h-72 sm:h-[26rem]' : 'h-64 sm:h-80',
            ]"
          >
            <img v-if="current.imageUrl" :src="current.imageUrl" :alt="current.title" class="w-full h-full object-contain pointer-events-none" draggable="false" />
            <component :is="kind === 'music' ? Music2 : Clapperboard" v-else class="w-12 h-12 text-slate-400 dark:text-slate-700" />
            <span v-if="current.badge" class="absolute top-3 right-3 text-[10px] font-bold bg-black/70 text-slate-200 px-2 py-1 rounded-lg pointer-events-none">
              {{ current.badge }}
            </span>
            <button
              v-if="kind === 'music' && current.previewUrl"
              type="button"
              @click.stop="togglePreview"
              @pointerdown.stop
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              title="Odtwórz podgląd"
            >
              <component :is="playingUrl === current.previewUrl ? Pause : Play" class="w-10 h-10" />
            </button>

            <div
              class="absolute top-6 left-4 px-3 py-1 rounded-lg border-4 border-red-500 text-red-500 font-black text-xl uppercase -rotate-12 pointer-events-none"
              :style="{ opacity: nopeOpacity }"
            >
              Nie
            </div>
            <div
              class="absolute top-6 right-4 px-3 py-1 rounded-lg border-4 border-emerald-500 text-emerald-500 font-black text-xl uppercase rotate-12 pointer-events-none"
              :style="{ opacity: likeOpacity }"
            >
              OK
            </div>
            <div
              class="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg border-4 border-amber-400 text-amber-400 font-black text-lg uppercase pointer-events-none"
              :style="{ opacity: starOpacity }"
            >
              ★ Ulubione
            </div>
          </div>

          <div class="mt-4 text-center">
            <p class="text-base font-black text-slate-900 dark:text-white">{{ current.title }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ current.subtitle }}</p>
            <p v-if="current.meta" class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{{ current.meta }}</p>
          </div>
        </div>

        <p class="mt-3 text-center text-[10px] text-slate-400 dark:text-slate-500">
          Przeciągnij kartę: <span class="text-red-500 font-semibold">← Nie</span> ·
          <span class="text-amber-500 font-semibold">↑ Ulubione</span> ·
          <span class="text-emerald-500 font-semibold">OK →</span>
        </p>

        <div class="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            @click="reject"
            title="Nie"
            class="w-14 h-14 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 transition-colors"
          >
            <X class="w-6 h-6" />
          </button>
          <button
            type="button"
            @click="toggleFavorite"
            title="Dodaj do listy"
            :class="[
              'w-12 h-12 rounded-full flex items-center justify-center border transition-colors',
              current.favorite
                ? 'bg-amber-400/20 text-amber-500 border-amber-400/50'
                : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/30',
            ]"
          >
            <Star :class="['w-5 h-5', current.favorite ? 'fill-amber-400' : '']" />
          </button>
          <button
            type="button"
            @click="like"
            title="OK"
            class="w-14 h-14 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
          >
            <Check class="w-6 h-6" />
          </button>
        </div>
      </div>

      <div v-else class="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Brak więcej pozycji do wylosowania.
      </div>
    </div>
  </div>
</template>

<style scoped>
.draw-card {
  touch-action: none;
  will-change: transform;
}
</style>
