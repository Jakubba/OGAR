<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import {
  GraduationCap,
  Flame,
  TrendingUp,
  Check,
  Trophy,
  Plus,
  User,
  MessageCircle,
  Film,
  Sparkles,
  Briefcase,
  Upload,
  Download,
  EllipsisVertical,
  Trash2,
  Globe,
  BookOpen,
  Music2,
  Coffee,
  Heart,
  Star,
  Plane,
  Gamepad2,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useEnglishSetsStore, type CardStatus, type Flashcard, type FlashcardSet } from '@/stores/englishSets'

const authStore = useAuthStore()
const englishSetsStore = useEnglishSetsStore()

watch(
  () => authStore.user?.uid,
  async (uid) => {
    englishSetsStore.watch()
    if (uid) await englishSetsStore.seedIfNeeded()
  },
  { immediate: true },
)

onUnmounted(() => {
  englishSetsStore.stopWatching()
})

const ICONS: Record<string, unknown> = {
  user: User,
  'trending-up': TrendingUp,
  briefcase: Briefcase,
  'message-circle': MessageCircle,
  film: Film,
  flame: Flame,
  sparkles: Sparkles,
  'graduation-cap': GraduationCap,
  globe: Globe,
  'book-open': BookOpen,
  music: Music2,
  coffee: Coffee,
  heart: Heart,
  star: Star,
  plane: Plane,
  gamepad: Gamepad2,
}
const ICON_LIST = Object.keys(ICONS)

function iconFor(key: string) {
  return ICONS[key] ?? User
}

const sets = computed(() => englishSetsStore.sets)

const selectedSetId = ref<string | null>(null)
watch(
  () => englishSetsStore.sets,
  (list) => {
    if (!selectedSetId.value || !list.some((s) => s.id === selectedSetId.value)) {
      selectedSetId.value = list[0]?.id ?? null
    }
  },
  { immediate: true },
)

const activeSet = computed<FlashcardSet | undefined>(() => sets.value.find((s) => s.id === selectedSetId.value))

const cardIndex = ref(0)
const revealed = ref(false)

watch(selectedSetId, () => {
  cardIndex.value = 0
  revealed.value = false
})

const currentCard = computed(() => activeSet.value?.cards[cardIndex.value] ?? null)

function selectSet(id: string) {
  selectedSetId.value = id
}

function goNext() {
  revealed.value = false
  const total = activeSet.value?.cards.length ?? 0
  if (total === 0) return
  if (cardIndex.value < total - 1) {
    cardIndex.value++
  } else {
    cardIndex.value = 0
  }
}

const actionError = ref('')

function markDifficulty(status: CardStatus) {
  if (currentCard.value && activeSet.value) {
    const setId = activeSet.value.id
    const cardId = currentCard.value.id
    englishSetsStore.updateCardStatus(setId, cardId, status).catch((err) => {
      actionError.value = err instanceof Error ? err.message : 'Nie udało się zapisać statusu fiszki.'
    })
    englishSetsStore.recordReview().catch((err) => {
      console.error('[OgarEnglishView] recordReview failed:', err)
    })
  }
  goNext()
}

function deleteCard(card: Flashcard) {
  if (!activeSet.value) return
  if (!window.confirm(`Usunąć fiszkę „${card.word}”?`)) return
  englishSetsStore.deleteCard(activeSet.value.id, card.id).catch((err) => {
    actionError.value = err instanceof Error ? err.message : 'Nie udało się usunąć fiszki.'
  })
}

const masteredCount = computed(() => sets.value.flatMap((s) => s.cards).filter((c) => c.status === 'mastered').length)
const learningCount = computed(() => sets.value.flatMap((s) => s.cards).filter((c) => c.status === 'learning').length)
const newCount = computed(() => sets.value.flatMap((s) => s.cards).filter((c) => c.status === 'new').length)
const totalCount = computed(() => masteredCount.value + learningCount.value + newCount.value)
const masteredPct = computed(() => (totalCount.value ? Math.round((masteredCount.value / totalCount.value) * 100) : 0))

const donutStyle = computed(() => {
  const total = totalCount.value || 1
  const masteredDeg = (masteredCount.value / total) * 360
  const learningDeg = (learningCount.value / total) * 360
  return {
    background: `conic-gradient(#34d399 0deg ${masteredDeg}deg, #fbbf24 ${masteredDeg}deg ${masteredDeg + learningDeg}deg, #64748b ${masteredDeg + learningDeg}deg 360deg)`,
  }
})

const weekActivity = [
  { day: 'Pon', value: 40 },
  { day: 'Wt', value: 65 },
  { day: 'Śr', value: 30 },
  { day: 'Czw', value: 80 },
  { day: 'Pt', value: 55 },
  { day: 'Sob', value: 20 },
  { day: 'Nd', value: 45 },
]

const reviewQueue = computed(() =>
  sets.value.flatMap((s) => s.cards).filter((c) => c.status !== 'mastered').slice(0, 4),
)

const activityFeed = [
  { text: 'Dodałeś nowe słówko „relentless"', time: '2 min temu' },
  { text: 'Powtórzyłeś 15 słówek', time: '18 min temu' },
  { text: '23 dni serii — Brawo!', time: '1 godz. temu' },
]

const newCard = reactive({
  word: '',
  translation: '',
  example: '',
  definition: '',
  notes: '',
})
const cardFormError = ref('')
const cardFormSaving = ref(false)

function resetCardForm() {
  newCard.word = ''
  newCard.translation = ''
  newCard.example = ''
  newCard.definition = ''
  newCard.notes = ''
  cardFormError.value = ''
}

async function saveCard() {
  if (cardFormSaving.value) return
  if (!activeSet.value) {
    cardFormError.value = 'Najpierw utwórz zestaw.'
    return
  }
  if (!newCard.word.trim()) {
    cardFormError.value = 'Podaj słówko po angielsku.'
    return
  }
  cardFormError.value = ''
  cardFormSaving.value = true
  try {
    await englishSetsStore.addCard(activeSet.value.id, {
      word: newCard.word,
      phonetic: '',
      partOfSpeech: '',
      example: newCard.example,
      translation: newCard.translation,
      definition: newCard.definition,
    })
    resetCardForm()
  } catch (err) {
    cardFormError.value = err instanceof Error ? err.message : 'Nie udało się zapisać fiszki w Firebase.'
  } finally {
    cardFormSaving.value = false
  }
}

interface ImportedCardJson {
  word?: unknown
  translation?: unknown
  example?: unknown
  definition?: unknown
  phonetic?: unknown
}

const importFileInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)
const importError = ref('')
const importSuccess = ref('')

function triggerImport() {
  importError.value = ''
  importSuccess.value = ''
  importFileInput.value?.click()
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

async function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (!activeSet.value) {
    importError.value = 'Najpierw wybierz lub utwórz zestaw, do którego mają trafić słówka.'
    return
  }

  importing.value = true
  importError.value = ''
  importSuccess.value = ''
  try {
    const raw = await file.text()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      throw new Error('Plik JSON musi zawierać tablicę słówek, np. [ { "word": "...", ... } ].')
    }

    const cards = (parsed as ImportedCardJson[])
      .map((entry) => ({
        word: textOf(entry.word).trim(),
        phonetic: textOf(entry.phonetic),
        partOfSpeech: '',
        example: textOf(entry.example),
        translation: textOf(entry.translation),
        definition: textOf(entry.definition),
      }))
      .filter((card) => card.word.length > 0)

    if (cards.length === 0) {
      throw new Error('Nie znaleziono żadnych poprawnych słówek (pole "word" jest wymagane).')
    }

    await englishSetsStore.importCards(activeSet.value.id, cards)
    importSuccess.value = `Zaimportowano ${cards.length} słówek do zestawu „${activeSet.value.name}".`
  } catch (err) {
    importError.value = err instanceof Error ? err.message : 'Nie udało się zaimportować pliku.'
  } finally {
    importing.value = false
  }
}

const exportError = ref('')

function exportActiveSet() {
  exportError.value = ''
  const set = activeSet.value
  if (!set) {
    exportError.value = 'Najpierw wybierz zestaw do wyeksportowania.'
    return
  }
  if (set.cards.length === 0) {
    exportError.value = 'Ten zestaw nie ma jeszcze żadnych fiszek.'
    return
  }

  const data = set.cards.map((card) => ({
    word: card.word,
    phonetic: card.phonetic,
    translation: card.translation,
    example: card.example,
    definition: card.definition,
  }))

  const slug = set.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'zestaw'
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${slug}.json`
  link.click()
  URL.revokeObjectURL(url)
}

const showNewSetForm = ref(false)
const newSet = reactive({ name: '', icon: ICON_LIST[0] })
const setFormError = ref('')
const setFormSaving = ref(false)

async function createSet() {
  if (setFormSaving.value) return
  if (!newSet.name.trim()) {
    setFormError.value = 'Podaj nazwę zestawu.'
    return
  }
  setFormError.value = ''
  setFormSaving.value = true
  try {
    const id = await englishSetsStore.createSet(newSet.name, newSet.icon)
    selectedSetId.value = id
    newSet.name = ''
    newSet.icon = ICON_LIST[0]
    showNewSetForm.value = false
  } catch (err) {
    setFormError.value = err instanceof Error ? err.message : 'Nie udało się utworzyć zestawu w Firebase.'
  } finally {
    setFormSaving.value = false
  }
}

function removeSet(set: FlashcardSet) {
  if (!window.confirm(`Usunąć zestaw „${set.name}” wraz ze wszystkimi fiszkami? Tej operacji nie można cofnąć.`)) return
  englishSetsStore.deleteSet(set.id).catch((err) => {
    actionError.value = err instanceof Error ? err.message : 'Nie udało się usunąć zestawu.'
  })
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div class="flex items-center gap-3">
        <GraduationCap class="w-7 h-7 text-orange-600 dark:text-orange-400" />
        <div>
          <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-wide uppercase">Ogar English</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">Vocabulary Hunt</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl px-4 py-2.5 flex items-center gap-2">
          <Flame class="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <div>
            <p class="text-sm font-bold text-slate-900 dark:text-white leading-none">{{ englishSetsStore.streakStats.current }} dni</p>
            <p class="text-[10px] text-slate-500">Daily Streak · Najdłuższa: {{ englishSetsStore.streakStats.longest }}</p>
          </div>
        </div>
        <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl px-4 py-2.5 flex items-center gap-2">
          <TrendingUp class="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <div>
            <p class="text-sm font-bold text-slate-900 dark:text-white leading-none">{{ englishSetsStore.streakStats.todayCount }}</p>
            <p class="text-[10px] text-slate-500">Dzisiaj · Powtórki</p>
          </div>
        </div>
        <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl px-4 py-2.5 flex items-center gap-2">
          <Check class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p class="text-sm font-bold text-slate-900 dark:text-white leading-none">{{ masteredCount }}</p>
            <p class="text-[10px] text-slate-500">Opanowane słówek</p>
          </div>
        </div>
        <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-orange-500/40 rounded-2xl px-4 py-2.5 flex items-center gap-2">
          <Trophy class="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <div>
            <p class="text-sm font-bold text-slate-900 dark:text-white leading-none">{{ englishSetsStore.levelStats.title }}</p>
            <p class="text-[10px] text-slate-500">Poziom {{ englishSetsStore.levelStats.level }}</p>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="englishSetsStore.error || actionError"
      class="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-sm text-rose-700 dark:text-rose-300"
    >
      Błąd synchronizacji z Firebase: {{ englishSetsStore.error || actionError }}. Sprawdź, czy w konsoli Firebase reguły
      bezpieczeństwa Firestore pozwalają zalogowanemu użytkownikowi na zapis pod <code>users/&#123;uid&#125;</code>.
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[260px_1fr_340px] gap-6 items-start">
      <!-- Zestawy -->
      <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Moje zestawy</h3>
          <button
            @click="showNewSetForm = !showNewSetForm"
            class="text-orange-600 dark:text-orange-400 hover:text-orange-300 cursor-pointer"
          >
            <Plus class="w-4 h-4" />
          </button>
        </div>

        <div v-if="showNewSetForm" class="space-y-2 mb-3 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <input
            v-model="newSet.name"
            type="text"
            placeholder="Nazwa zestawu"
            class="w-full px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
          />
          <div class="grid grid-cols-6 gap-1.5">
            <button
              v-for="key in ICON_LIST"
              :key="key"
              @click="newSet.icon = key"
              type="button"
              :class="[
                'aspect-square rounded-lg flex items-center justify-center border cursor-pointer',
                newSet.icon === key
                  ? 'bg-orange-500/15 border-orange-500/50 text-orange-600 dark:text-orange-400'
                  : 'bg-slate-100 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800/60 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700',
              ]"
            >
              <component :is="iconFor(key)" class="w-4 h-4" />
            </button>
          </div>
          <p v-if="setFormError" class="text-[11px] text-rose-600 dark:text-rose-400">{{ setFormError }}</p>
          <button
            @click="createSet"
            :disabled="setFormSaving"
            class="w-full py-2 rounded-lg bg-orange-500/10 border border-orange-500/40 text-orange-600 dark:text-orange-400 text-xs font-bold hover:bg-orange-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ setFormSaving ? 'Tworzenie...' : 'Utwórz zestaw' }}
          </button>
        </div>

        <div class="space-y-1.5">
          <p v-if="sets.length === 0" class="text-xs text-slate-500 text-center py-3">Brak zestawów.</p>
          <div
            v-for="set in sets"
            :key="set.id"
            @click="selectSet(set.id)"
            :class="[
              'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer',
              selectedSetId === set.id ? 'bg-orange-500/15 border border-orange-500/40' : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 border border-transparent',
            ]"
          >
            <component :is="iconFor(set.icon)" class="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate pr-5">{{ set.name }}</p>
              <p class="text-[10px] text-slate-500">{{ set.cards.length }} słówek</p>
            </div>
            <button
              @click.stop="removeSet(set)"
              class="absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
              title="Usuń zestaw"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Fiszka -->
      <div class="space-y-6">
        <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Fiszki</h3>
            <span class="text-xs text-slate-500 font-semibold">{{ cardIndex + 1 }} / {{ activeSet?.cards.length || 0 }}</span>
          </div>

          <div v-if="!activeSet" class="h-72 flex items-center justify-center text-sm text-slate-500 text-center px-6">
            Nie masz jeszcze żadnego zestawu — utwórz go w panelu „Moje zestawy”.
          </div>
          <div v-else-if="!currentCard" class="h-72 flex items-center justify-center text-sm text-slate-500">
            Ten zestaw nie ma jeszcze żadnych fiszek.
          </div>

          <div
            v-else
            @click="revealed = !revealed"
            class="rounded-2xl bg-gradient-to-br from-orange-50 via-white to-slate-100 dark:from-slate-950 dark:via-[#0e172a] dark:to-[#1a110b] border border-slate-200 dark:border-slate-800 p-8 min-h-72 flex flex-col justify-center relative cursor-pointer select-none"
          >
            <div class="absolute top-5 left-6 text-[10px] text-slate-500 uppercase tracking-widest">Słówko</div>

            <div class="text-center">
              <h3 class="text-4xl font-black text-slate-900 dark:text-white mb-2">{{ currentCard.word }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">{{ currentCard.phonetic }}</p>
              <span v-if="currentCard.partOfSpeech" class="inline-block px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-700 dark:text-violet-300 text-xs font-semibold mb-4">
                {{ currentCard.partOfSpeech }}
              </span>
              <p class="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">{{ currentCard.example }}</p>

              <div v-if="revealed" class="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800">
                <p class="text-lg font-bold text-orange-600 dark:text-orange-400">{{ currentCard.translation }}</p>
                <p class="text-xs text-slate-500 mt-1">{{ currentCard.definition }}</p>
              </div>
            </div>
          </div>
          <p v-if="currentCard" class="text-center text-[11px] text-slate-500 mt-3">Kliknij kartę, aby zobaczyć tłumaczenie</p>

          <div v-if="currentCard" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <button @click="markDifficulty('mastered')" class="py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-sm font-bold hover:bg-emerald-500/25 cursor-pointer">
              Łatwe
            </button>
            <button @click="markDifficulty('learning')" class="py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-sm font-bold hover:bg-amber-500/25 cursor-pointer">
              Średnie
            </button>
            <button @click="markDifficulty('learning')" class="py-2.5 rounded-xl bg-orange-500/15 border border-orange-500/40 text-orange-600 dark:text-orange-400 text-sm font-bold hover:bg-orange-500/25 cursor-pointer">
              Trudne
            </button>
            <button @click="markDifficulty('new')" class="py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-400 text-sm font-bold hover:bg-rose-500/25 cursor-pointer">
              Powtórz
            </button>
          </div>

          <div v-if="currentCard" class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <button @click="goNext" class="py-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer">
              ⟪ Pomiń
            </button>
            <button @click="revealed = !revealed" class="py-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer">
              Pokazuj częściej
            </button>
            <button @click="goNext" class="py-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer">
              Następna ⟫
            </button>
          </div>
        </div>

        <!-- Postępy + powtórki -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Twoje postępy</h3>
              <EllipsisVertical class="w-4 h-4 text-slate-500" />
            </div>
            <div class="flex items-center gap-5">
              <div class="w-24 h-24 rounded-full shrink-0 flex items-center justify-center relative" :style="donutStyle">
                <div class="w-16 h-16 rounded-full bg-white dark:bg-[#0b1220] flex flex-col items-center justify-center">
                  <span class="text-lg font-black text-slate-900 dark:text-white">{{ masteredPct }}%</span>
                </div>
              </div>
              <div class="space-y-1.5 text-xs">
                <p class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-400" /> Opanowane <span class="text-slate-500 ml-auto">{{ masteredCount }}</span></p>
                <p class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-amber-400" /> W trakcie <span class="text-slate-500 ml-auto">{{ learningCount }}</span></p>
                <p class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-slate-500" /> Nowe <span class="text-slate-500 ml-auto">{{ newCount }}</span></p>
              </div>
            </div>
            <div class="flex items-end justify-between gap-1.5 mt-5 h-16">
              <div v-for="d in weekActivity" :key="d.day" class="flex-1 flex flex-col items-center justify-end gap-1">
                <div class="w-full rounded bg-gradient-to-t from-orange-500 to-amber-400" :style="{ height: `${d.value}%` }" />
                <span class="text-[9px] text-slate-500">{{ d.day }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4">Słówka do powtórki</h3>
            <div class="space-y-2">
              <div v-for="card in reviewQueue" :key="card.id" class="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/60">
                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ card.word }}</p>
                <p class="text-[10px] text-slate-500">{{ card.translation }}</p>
              </div>
              <p v-if="reviewQueue.length === 0" class="text-xs text-slate-500 text-center py-3">Brak słówek do powtórki 🎉</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Dodaj fiszkę + aktywność -->
      <div class="space-y-6">
        <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Dodaj nową fiszkę</h3>
            <span class="flex items-center gap-1 text-[10px] text-orange-600 dark:text-orange-400 font-semibold"><Sparkles class="w-3 h-3" /> AI Auto-Fill</span>
          </div>

          <div class="space-y-3">
            <div>
              <label class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Słówko po angielsku *</label>
              <input v-model="newCard.word" type="text" class="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500/50" />
            </div>
            <div>
              <label class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tłumaczenie (PL)</label>
              <input v-model="newCard.translation" type="text" class="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500/50" />
            </div>
            <div>
              <label class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Przykładowe zdanie (EN)</label>
              <textarea v-model="newCard.example" rows="2" class="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500/50" />
            </div>
            <div>
              <label class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Definicja (EN)</label>
              <input v-model="newCard.definition" type="text" class="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500/50" />
            </div>
            <div>
              <label class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Notatki (opcjonalnie)</label>
              <input v-model="newCard.notes" type="text" placeholder="Dodaj własne notatki..." class="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500/50" />
            </div>

            <p v-if="cardFormError" class="text-[11px] text-rose-600 dark:text-rose-400">{{ cardFormError }}</p>

            <div class="flex gap-2 pt-1">
              <button @click="resetCardForm" class="flex-1 py-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer">
                Anuluj
              </button>
              <button
                @click="saveCard"
                :disabled="cardFormSaving"
                class="flex-1 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black text-xs font-bold hover:brightness-110 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ cardFormSaving ? 'Zapisywanie...' : 'Zapisz fiszkę' }}
              </button>
            </div>
          </div>
        </div>

        <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4">
          <h3 class="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">
            Fiszki w zestawie{{ activeSet ? ` (${activeSet.cards.length})` : '' }}
          </h3>
          <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
            <div
              v-for="card in activeSet?.cards ?? []"
              :key="card.id"
              class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/60"
            >
              <div class="min-w-0">
                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{{ card.word }}</p>
                <p class="text-[10px] text-slate-500 truncate">{{ card.translation || '—' }}</p>
              </div>
              <button
                @click="deleteCard(card)"
                class="shrink-0 p-1.5 rounded-md text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                title="Usuń fiszkę"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
            <p v-if="!activeSet || activeSet.cards.length === 0" class="text-xs text-slate-500 text-center py-3">
              Ten zestaw nie ma jeszcze fiszek.
            </p>
          </div>
        </div>

        <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4">
          <h3 class="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">Importuj / eksportuj słówka</h3>
          <p class="text-[11px] text-slate-500 mb-3">Wczytaj plik JSON z listą słówek (word, translation, example, definition, phonetic) albo wyeksportuj bieżący zestaw.</p>
          <input ref="importFileInput" type="file" accept="application/json,.json" class="hidden" @change="handleImportFile" />
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="triggerImport"
              :disabled="importing"
              class="py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/40 text-orange-600 dark:text-orange-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-orange-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload class="w-4 h-4" /> {{ importing ? 'Importowanie...' : 'Importuj' }}
            </button>
            <button
              @click="exportActiveSet"
              :disabled="!activeSet || activeSet.cards.length === 0"
              class="py-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download class="w-4 h-4" /> Eksportuj
            </button>
          </div>
          <p v-if="importError" class="text-[11px] text-rose-600 dark:text-rose-400 mt-2">{{ importError }}</p>
          <p v-if="importSuccess" class="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2">{{ importSuccess }}</p>
          <p v-if="exportError" class="text-[11px] text-rose-600 dark:text-rose-400 mt-2">{{ exportError }}</p>
        </div>

        <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4">
          <h3 class="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">Aktywność</h3>
          <div class="space-y-3">
            <div v-for="(a, i) in activityFeed" :key="i" class="text-xs">
              <p class="text-slate-600 dark:text-slate-300">{{ a.text }}</p>
              <p class="text-[10px] text-slate-500">{{ a.time }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
