import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth'
import { computeStreakStats, toDateKey } from '@/lib/reviewStreak'
import { computeLevelStats, computeXp } from '@/lib/xpLevel'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'

export type CardStatus = 'new' | 'learning' | 'mastered'

export interface Flashcard {
  id: string
  word: string
  phonetic: string
  partOfSpeech: string
  example: string
  translation: string
  definition: string
  status: CardStatus
}

export interface FlashcardSet {
  id: string
  name: string
  icon: string
  cards: Flashcard[]
}

interface SeedCard {
  word: string
  phonetic: string
  partOfSpeech: string
  example: string
  translation: string
  definition: string
}

const DEFAULT_SETS: { name: string; icon: string; cards: SeedCard[] }[] = [
  {
    name: 'Moje słówka',
    icon: 'user',
    cards: [
      {
        word: 'unrelenting',
        phonetic: '/ˌʌnrɪˈlentɪŋ/',
        partOfSpeech: 'Przymiotnik',
        example: 'The hound was unrelenting in its pursuit, never giving up until it caught the prey.',
        translation: 'nieustępliwy, bezwzględny',
        definition: 'persistent and determined; not giving up',
      },
      {
        word: 'meticulous',
        phonetic: '/məˈtɪkjələs/',
        partOfSpeech: 'Przymiotnik',
        example: 'She was meticulous about checking every detail before submitting the report.',
        translation: 'dokładny, skrupulatny',
        definition: 'showing great attention to detail; very careful',
      },
      {
        word: 'alleviate',
        phonetic: '/əˈliːvieɪt/',
        partOfSpeech: 'Czasownik',
        example: 'The medicine helped alleviate her headache.',
        translation: 'łagodzić, zmniejszać',
        definition: 'to make suffering, pain or a problem less severe',
      },
      {
        word: 'ambiguous',
        phonetic: '/æmˈbɪɡjuəs/',
        partOfSpeech: 'Przymiotnik',
        example: 'His answer was so ambiguous that no one knew what he meant.',
        translation: 'niejednoznaczny',
        definition: 'open to more than one interpretation',
      },
      {
        word: 'ceasefire',
        phonetic: '/ˈsiːsfaɪər/',
        partOfSpeech: 'Rzeczownik',
        example: 'Both sides agreed to a ceasefire after months of conflict.',
        translation: 'zawieszenie broni',
        definition: 'a temporary suspension of fighting',
      },
    ],
  },
  {
    name: 'IT & Web Dev',
    icon: 'trending-up',
    cards: [
      {
        word: 'deploy',
        phonetic: '/dɪˈplɔɪ/',
        partOfSpeech: 'Czasownik',
        example: 'We deploy the new version to production every Friday.',
        translation: 'wdrożyć, wypuścić',
        definition: 'to put a new version of software into use',
      },
      {
        word: 'refactor',
        phonetic: '/riːˈfæktər/',
        partOfSpeech: 'Czasownik',
        example: 'This function is messy — we should refactor it.',
        translation: 'refaktoryzować, przebudować kod',
        definition: 'to restructure code without changing its behavior',
      },
      {
        word: 'bug',
        phonetic: '/bʌɡ/',
        partOfSpeech: 'Rzeczownik',
        example: 'There is a bug in the login form.',
        translation: 'błąd (w programie)',
        definition: 'an error or flaw in software',
      },
    ],
  },
  {
    name: 'Business & Tech',
    icon: 'briefcase',
    cards: [
      {
        word: 'leverage',
        phonetic: '/ˈlevərɪdʒ/',
        partOfSpeech: 'Czasownik',
        example: 'We should leverage our existing customer base to launch this feature.',
        translation: 'wykorzystać (przewagę, zasoby)',
        definition: 'to use something to maximum advantage',
      },
      {
        word: 'stakeholder',
        phonetic: '/ˈsteɪkˌhoʊldər/',
        partOfSpeech: 'Rzeczownik',
        example: 'All stakeholders agreed on the new roadmap.',
        translation: 'interesariusz',
        definition: 'a person with an interest in a business or project',
      },
      {
        word: 'scalable',
        phonetic: '/ˈskeɪləbl/',
        partOfSpeech: 'Przymiotnik',
        example: 'The architecture needs to be scalable to handle more users.',
        translation: 'skalowalny',
        definition: 'able to grow or handle growth easily',
      },
    ],
  },
  {
    name: 'Codzienne zwroty',
    icon: 'message-circle',
    cards: [
      {
        word: 'by the way',
        phonetic: '/baɪ ðə weɪ/',
        partOfSpeech: 'Zwrot',
        example: 'By the way, did you finish the report?',
        translation: 'przy okazji, à propos',
        definition: 'used to introduce a new, often unrelated, topic',
      },
      {
        word: 'sort of',
        phonetic: '/sɔːrt əv/',
        partOfSpeech: 'Zwrot',
        example: 'I sort of agree with you, but not completely.',
        translation: 'w pewnym sensie, jakby',
        definition: 'to some extent; somewhat',
      },
      {
        word: 'no worries',
        phonetic: '/noʊ ˈwʌriz/',
        partOfSpeech: 'Zwrot',
        example: "No worries, I'll take care of it.",
        translation: 'żaden problem, spoko',
        definition: 'used to say that something is not a problem',
      },
    ],
  },
  {
    name: 'Seriale & Filmy',
    icon: 'film',
    cards: [
      {
        word: 'cliffhanger',
        phonetic: '/ˈklɪfˌhæŋər/',
        partOfSpeech: 'Rzeczownik',
        example: 'The season ended on a huge cliffhanger.',
        translation: 'zawieszenie akcji (przed napięciem)',
        definition: 'a dramatic and exciting ending that leaves the outcome unresolved',
      },
      {
        word: 'spoiler',
        phonetic: '/ˈspɔɪlər/',
        partOfSpeech: 'Rzeczownik',
        example: "Don't tell me who dies — no spoilers!",
        translation: 'spoiler, zdradzenie fabuły',
        definition: 'information that reveals important plot elements',
      },
      {
        word: 'plot twist',
        phonetic: '/plɒt twɪst/',
        partOfSpeech: 'Rzeczownik',
        example: 'Nobody expected that plot twist in the finale.',
        translation: 'zwrot akcji',
        definition: 'an unexpected change in the direction of a story',
      },
    ],
  },
  {
    name: 'Trudne słówka',
    icon: 'flame',
    cards: [
      {
        word: 'ubiquitous',
        phonetic: '/juːˈbɪkwɪtəs/',
        partOfSpeech: 'Przymiotnik',
        example: 'Smartphones have become ubiquitous in modern life.',
        translation: 'wszechobecny',
        definition: 'present, appearing, or found everywhere',
      },
      {
        word: 'juxtapose',
        phonetic: '/ˈdʒʌkstəpoʊz/',
        partOfSpeech: 'Czasownik',
        example: 'The film juxtaposes wealth and poverty in the same city.',
        translation: 'zestawiać (dla kontrastu)',
        definition: 'to place things side by side to compare or contrast them',
      },
      {
        word: 'ephemeral',
        phonetic: '/ɪˈfemərəl/',
        partOfSpeech: 'Przymiotnik',
        example: 'Fame on social media can be ephemeral.',
        translation: 'ulotny, przemijający',
        definition: 'lasting for a very short time',
      },
    ],
  },
  {
    name: 'Slang & Idioms',
    icon: 'sparkles',
    cards: [
      {
        word: 'break a leg',
        phonetic: '/breɪk ə leɡ/',
        partOfSpeech: 'Idiom',
        example: 'Break a leg on your presentation today!',
        translation: 'powodzenia!',
        definition: 'used to wish someone good luck',
      },
      {
        word: 'spill the tea',
        phonetic: '/spɪl ðə tiː/',
        partOfSpeech: 'Slang',
        example: 'Okay, spill the tea — what happened at the party?',
        translation: 'wygadać sekrety, zdradzić plotki',
        definition: 'to share gossip or interesting information',
      },
      {
        word: 'hit the sack',
        phonetic: '/hɪt ðə sæk/',
        partOfSpeech: 'Idiom',
        example: "I'm exhausted, I'm going to hit the sack.",
        translation: 'iść spać',
        definition: 'to go to bed',
      },
    ],
  },
]

export const useEnglishSetsStore = defineStore('englishSets', () => {
  const sets = ref<FlashcardSet[]>([])
  const loading = ref(false)
  const error = ref('')
  let unsubscribeSets: Unsubscribe | null = null
  const cardUnsubscribers = new Map<string, Unsubscribe>()

  const reviewActivity = ref<Record<string, number>>({})
  const streakStats = computed(() => computeStreakStats(reviewActivity.value))
  const totalReviews = computed(() => Object.values(reviewActivity.value).reduce((sum, n) => sum + n, 0))
  const masteredCount = computed(() => sets.value.flatMap((s) => s.cards).filter((c) => c.status === 'mastered').length)
  const levelStats = computed(() => computeLevelStats(computeXp(totalReviews.value, masteredCount.value)))
  let unsubscribeActivity: Unsubscribe | null = null

  function activityDocRef(uid: string) {
    return doc(db, 'users', uid, 'meta', 'englishReviewActivity')
  }

  function watch() {
    unsubscribeSets?.()
    unsubscribeActivity?.()
    cardUnsubscribers.forEach((unsub) => unsub())
    cardUnsubscribers.clear()
    sets.value = []
    reviewActivity.value = {}
    error.value = ''
    const authStore = useAuthStore()
    if (!authStore.user) return
    const uid = authStore.user.uid

    unsubscribeActivity = onSnapshot(activityDocRef(uid), (snap) => {
      reviewActivity.value = (snap.data()?.days as Record<string, number> | undefined) ?? {}
    })

    loading.value = true
    const q = query(collection(db, 'users', uid, 'englishSets'), orderBy('createdAt', 'asc'))
    unsubscribeSets = onSnapshot(
      q,
      (snapshot) => {
        const currentIds = new Set(snapshot.docs.map((d) => d.id))
        for (const [setId, unsub] of cardUnsubscribers) {
          if (!currentIds.has(setId)) {
            unsub()
            cardUnsubscribers.delete(setId)
          }
        }
        sets.value = sets.value.filter((s) => currentIds.has(s.id))

        snapshot.docs.forEach((setDocSnap) => {
          const data = setDocSnap.data() as { name: string; icon: string }
          const existing = sets.value.find((s) => s.id === setDocSnap.id)
          if (existing) {
            existing.name = data.name
            existing.icon = data.icon
          } else {
            sets.value.push({ id: setDocSnap.id, name: data.name, icon: data.icon, cards: [] })
          }

          if (!cardUnsubscribers.has(setDocSnap.id)) {
            const cardsQuery = query(
              collection(db, 'users', uid, 'englishSets', setDocSnap.id, 'cards'),
              orderBy('createdAt', 'asc'),
            )
            const unsub = onSnapshot(cardsQuery, (cardsSnapshot) => {
              const set = sets.value.find((s) => s.id === setDocSnap.id)
              if (!set) return
              set.cards = cardsSnapshot.docs.map((c) => ({ id: c.id, ...(c.data() as Omit<Flashcard, 'id'>) }))
            })
            cardUnsubscribers.set(setDocSnap.id, unsub)
          }
        })
        loading.value = false
      },
      (err) => {
        loading.value = false
        error.value = err.message
        console.error('[englishSets] błąd nasłuchu Firestore:', err)
      },
    )
  }

  function stopWatching() {
    unsubscribeSets?.()
    unsubscribeSets = null
    unsubscribeActivity?.()
    unsubscribeActivity = null
    cardUnsubscribers.forEach((unsub) => unsub())
    cardUnsubscribers.clear()
  }

  async function recordReview() {
    const authStore = useAuthStore()
    if (!authStore.user) return
    const todayKey = toDateKey(new Date())
    await setDoc(activityDocRef(authStore.user.uid), { days: { [todayKey]: increment(1) } }, { merge: true })
  }

  async function createSet(name: string, icon: string) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    const ref = await addDoc(collection(db, 'users', authStore.user.uid, 'englishSets'), {
      name,
      icon,
      createdAt: serverTimestamp(),
    })
    return ref.id
  }

  async function deleteSet(setId: string) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    const uid = authStore.user.uid
    const set = sets.value.find((s) => s.id === setId)
    if (set) {
      await Promise.all(
        set.cards.map((c) => deleteDoc(doc(db, 'users', uid, 'englishSets', setId, 'cards', c.id))),
      )
    }
    await deleteDoc(doc(db, 'users', uid, 'englishSets', setId))
  }

  async function addCard(setId: string, card: Omit<Flashcard, 'id' | 'status'>) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    await addDoc(collection(db, 'users', authStore.user.uid, 'englishSets', setId, 'cards'), {
      ...card,
      status: 'new' as const,
      createdAt: serverTimestamp(),
    })
  }

  async function importCards(setId: string, cards: Omit<Flashcard, 'id' | 'status'>[]) {
    for (const card of cards) {
      await addCard(setId, card)
    }
  }

  async function updateCardStatus(setId: string, cardId: string, status: CardStatus) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    await updateDoc(doc(db, 'users', authStore.user.uid, 'englishSets', setId, 'cards', cardId), { status })
  }

  async function deleteCard(setId: string, cardId: string) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    await deleteDoc(doc(db, 'users', authStore.user.uid, 'englishSets', setId, 'cards', cardId))
  }

  async function seedIfNeeded() {
    const authStore = useAuthStore()
    if (!authStore.user) return
    const uid = authStore.user.uid
    const markerRef = doc(db, 'users', uid, 'meta', 'englishSeeded')
    const markerSnap = await getDoc(markerRef)
    if (markerSnap.exists()) return
    await setDoc(markerRef, { seededAt: serverTimestamp() })

    for (const seedSet of DEFAULT_SETS) {
      const setId = await createSet(seedSet.name, seedSet.icon)
      for (const card of seedSet.cards) {
        await addCard(setId, card)
      }
    }
  }

  return {
    sets,
    loading,
    error,
    streakStats,
    levelStats,
    watch,
    stopWatching,
    createSet,
    deleteSet,
    addCard,
    importCards,
    updateCardStatus,
    deleteCard,
    seedIfNeeded,
    recordReview,
  }
})
