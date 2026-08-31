import {
  Dumbbell,
  PersonStanding,
  Footprints,
  HeartPulse,
  Flame,
  Activity,
  Move,
  Anchor,
  Shrink,
  Bike,
  Timer,
} from 'lucide-vue-next'

export const MUSCLE_GROUPS = ['klatka', 'plecy', 'nogi', 'barki', 'ramiona', 'brzuch', 'całe ciało', 'cardio'] as const
export const EQUIPMENT_OPTIONS = ['brak', 'hantle', 'sztanga', 'maszyna', 'guma', 'kettlebell', 'ławka', 'drążek'] as const
export const DIFFICULTIES = ['początkujący', 'średni', 'zaawansowany'] as const
export const EXERCISE_TYPES = ['siłowe', 'cardio', 'rozciąganie'] as const
export const LOCATIONS = ['dom', 'siłownia'] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]
export type Equipment = (typeof EQUIPMENT_OPTIONS)[number]
export type Difficulty = (typeof DIFFICULTIES)[number]
export type ExerciseType = (typeof EXERCISE_TYPES)[number]
export type Location = (typeof LOCATIONS)[number]
export type Weekday = 'pon' | 'wt' | 'sr' | 'czw' | 'pt' | 'sob' | 'nd'

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  equipment: Equipment
  difficulty: Difficulty
  type: ExerciseType
  location: Location
  met: number
  description: string
  icon: string
  isTimed: boolean
}

export const WEEKDAYS: { code: Weekday; label: string }[] = [
  { code: 'pon', label: 'Pon' },
  { code: 'wt', label: 'Wt' },
  { code: 'sr', label: 'Śr' },
  { code: 'czw', label: 'Czw' },
  { code: 'pt', label: 'Pt' },
  { code: 'sob', label: 'Sob' },
  { code: 'nd', label: 'Nd' },
]

export const EXERCISE_ICONS: Record<string, unknown> = {
  dumbbell: Dumbbell,
  person: PersonStanding,
  footprints: Footprints,
  heart: HeartPulse,
  flame: Flame,
  activity: Activity,
  move: Move,
  anchor: Anchor,
  shrink: Shrink,
  bike: Bike,
  timer: Timer,
}

export function iconForExercise(key: string) {
  return EXERCISE_ICONS[key] ?? Dumbbell
}

export const EXERCISE_CATALOG: Exercise[] = [
  { id: 'pompki-klasyczne', name: 'Pompki klasyczne', muscleGroup: 'klatka', equipment: 'brak', difficulty: 'początkujący', type: 'siłowe', location: 'dom', met: 8, description: 'Ułóż dłonie nieco szerzej niż barki, ciało w linii prostej, schodź do kąta 90° w łokciach i wypchnij się w górę.', icon: 'dumbbell', isTimed: false },
  { id: 'pompki-diamentowe', name: 'Pompki diamentowe', muscleGroup: 'ramiona', equipment: 'brak', difficulty: 'średni', type: 'siłowe', location: 'dom', met: 8, description: 'Dłonie złączone pod klatką piersiową tworzą trójkąt — angażuje głównie triceps.', icon: 'dumbbell', isTimed: false },
  { id: 'wyciskanie-hantli-plasko', name: 'Wyciskanie hantli leżąc', muscleGroup: 'klatka', equipment: 'hantle', difficulty: 'średni', type: 'siłowe', location: 'siłownia', met: 6, description: 'Leżąc na ławce, wyciskaj hantle nad klatkę piersiową kontrolowanym ruchem.', icon: 'dumbbell', isTimed: false },
  { id: 'rozpietki-hantle', name: 'Rozpiętki z hantlami', muscleGroup: 'klatka', equipment: 'hantle', difficulty: 'średni', type: 'siłowe', location: 'siłownia', met: 5, description: 'Leżąc na ławce, ramiona lekko ugięte, rozłóż hantle na boki i wróć do góry.', icon: 'dumbbell', isTimed: false },
  { id: 'wioslowanie-hantla', name: 'Wiosłowanie hantlem', muscleGroup: 'plecy', equipment: 'hantle', difficulty: 'średni', type: 'siłowe', location: 'siłownia', met: 6, description: 'Oprzyj kolano i dłoń na ławce, drugą ręką ciągnij hantel do bioder.', icon: 'dumbbell', isTimed: false },
  { id: 'podciaganie', name: 'Podciąganie na drążku', muscleGroup: 'plecy', equipment: 'drążek', difficulty: 'zaawansowany', type: 'siłowe', location: 'siłownia', met: 8, description: 'Chwyt nachwytem szerzej niż barki, podciągnij się aż broda znajdzie się nad drążkiem.', icon: 'dumbbell', isTimed: false },
  { id: 'martwy-ciag-hantle', name: 'Martwy ciąg z hantlami', muscleGroup: 'plecy', equipment: 'hantle', difficulty: 'średni', type: 'siłowe', location: 'siłownia', met: 6, description: 'Plecy proste, zawiasa w biodrach, hantle blisko nóg, wróć do pozycji stojącej.', icon: 'dumbbell', isTimed: false },
  { id: 'superman', name: 'Superman', muscleGroup: 'plecy', equipment: 'brak', difficulty: 'początkujący', type: 'siłowe', location: 'dom', met: 4, description: 'Leżąc na brzuchu, unieś jednocześnie ręce i nogi, napinając dolny odcinek pleców.', icon: 'move', isTimed: true },
  { id: 'przysiady', name: 'Przysiady', muscleGroup: 'nogi', equipment: 'brak', difficulty: 'początkujący', type: 'siłowe', location: 'dom', met: 5, description: 'Stopy na szerokość barków, schodź biodrami w dół i do tyłu, kolana nad śródstopiem.', icon: 'person', isTimed: false },
  { id: 'przysiady-goblet', name: 'Przysiady goblet z hantlem', muscleGroup: 'nogi', equipment: 'hantle', difficulty: 'średni', type: 'siłowe', location: 'siłownia', met: 6, description: 'Trzymaj hantel oburącz przy klatce piersiowej i wykonuj przysiad.', icon: 'dumbbell', isTimed: false },
  { id: 'wykroki', name: 'Wykroki', muscleGroup: 'nogi', equipment: 'brak', difficulty: 'początkujący', type: 'siłowe', location: 'dom', met: 5, description: 'Zrób długi krok do przodu i zegnij oba kolana do kąta 90°, wróć do pozycji startowej.', icon: 'footprints', isTimed: false },
  { id: 'martwy-ciag-rumunski', name: 'Martwy ciąg rumuński', muscleGroup: 'nogi', equipment: 'sztanga', difficulty: 'zaawansowany', type: 'siłowe', location: 'siłownia', met: 6, description: 'Nogi lekko ugięte, sztanga blisko ud, opuszczaj tułów utrzymując proste plecy.', icon: 'dumbbell', isTimed: false },
  { id: 'wspiecia-na-palce', name: 'Wspięcia na palce', muscleGroup: 'nogi', equipment: 'brak', difficulty: 'początkujący', type: 'siłowe', location: 'dom', met: 4, description: 'Stojąc prosto, unoś się na palcach, napinając łydki, i powoli opuszczaj pięty.', icon: 'person', isTimed: false },
  { id: 'wyciskanie-nad-glowa', name: 'Wyciskanie hantli nad głowę', muscleGroup: 'barki', equipment: 'hantle', difficulty: 'średni', type: 'siłowe', location: 'siłownia', met: 6, description: 'Stojąc lub siedząc, wyciskaj hantle pionowo nad głowę i kontrolowanie opuszczaj.', icon: 'dumbbell', isTimed: false },
  { id: 'unoszenie-bokiem', name: 'Unoszenie hantli bokiem', muscleGroup: 'barki', equipment: 'hantle', difficulty: 'początkujący', type: 'siłowe', location: 'siłownia', met: 4, description: 'Ręce lekko ugięte, unoś hantle na boki do wysokości barków.', icon: 'dumbbell', isTimed: false },
  { id: 'pompki-pike', name: 'Pompki pike', muscleGroup: 'barki', equipment: 'brak', difficulty: 'zaawansowany', type: 'siłowe', location: 'dom', met: 7, description: 'Ułóż ciało w odwróconym V i wykonuj pompki kierując głowę w stronę podłogi.', icon: 'dumbbell', isTimed: false },
  { id: 'uginanie-ramion-hantle', name: 'Uginanie ramion z hantlami', muscleGroup: 'ramiona', equipment: 'hantle', difficulty: 'początkujący', type: 'siłowe', location: 'siłownia', met: 4, description: 'Ręce wzdłuż tułowia, uginaj łokcie unosząc hantle do barków.', icon: 'dumbbell', isTimed: false },
  { id: 'prostowanie-ramion', name: 'Prostowanie ramion nad głową', muscleGroup: 'ramiona', equipment: 'hantle', difficulty: 'początkujący', type: 'siłowe', location: 'siłownia', met: 4, description: 'Hantel trzymany oburącz nad głową, uginaj łokcie opuszczając go za głowę i prostuj.', icon: 'dumbbell', isTimed: false },
  { id: 'dipy-na-krzesle', name: 'Dipy na krześle', muscleGroup: 'ramiona', equipment: 'brak', difficulty: 'średni', type: 'siłowe', location: 'dom', met: 6, description: 'Dłonie na krawędzi krzesła, zginaj łokcie opuszczając biodra w dół i wypychaj się w górę.', icon: 'dumbbell', isTimed: false },
  { id: 'brzuszki', name: 'Brzuszki', muscleGroup: 'brzuch', equipment: 'brak', difficulty: 'początkujący', type: 'siłowe', location: 'dom', met: 4, description: 'Leżąc na plecach, kolana ugięte, unoś łopatki w kierunku bioder napinając brzuch.', icon: 'move', isTimed: false },
  { id: 'plank', name: 'Plank (deska)', muscleGroup: 'brzuch', equipment: 'brak', difficulty: 'początkujący', type: 'siłowe', location: 'dom', met: 4, description: 'Podpór na przedramionach i palcach stóp, ciało w linii prostej, napinaj brzuch.', icon: 'timer', isTimed: true },
  { id: 'plank-boczny', name: 'Plank boczny', muscleGroup: 'brzuch', equipment: 'brak', difficulty: 'średni', type: 'siłowe', location: 'dom', met: 4, description: 'Podpór bokiem na jednym przedramieniu, ciało w linii prostej, biodra uniesione.', icon: 'timer', isTimed: true },
  { id: 'unoszenie-nog', name: 'Unoszenie nóg w leżeniu', muscleGroup: 'brzuch', equipment: 'brak', difficulty: 'średni', type: 'siłowe', location: 'dom', met: 4, description: 'Leżąc na plecach, unoś wyprostowane nogi do kąta 90° i powoli opuszczaj.', icon: 'move', isTimed: false },
  { id: 'russian-twist', name: 'Russian twist', muscleGroup: 'brzuch', equipment: 'brak', difficulty: 'średni', type: 'siłowe', location: 'dom', met: 5, description: 'Siedząc z uniesionymi stopami, skręcaj tułów na boki dotykając podłoża.', icon: 'move', isTimed: false },
  { id: 'burpee', name: 'Burpee', muscleGroup: 'całe ciało', equipment: 'brak', difficulty: 'zaawansowany', type: 'cardio', location: 'dom', met: 10, description: 'Przysiad, wyskok do deski, pompka, powrót do przysiadu i wyskok w górę.', icon: 'flame', isTimed: false },
  { id: 'mountain-climbers', name: 'Mountain climbers', muscleGroup: 'całe ciało', equipment: 'brak', difficulty: 'średni', type: 'cardio', location: 'dom', met: 8, description: 'Podpór jak do pompki, naprzemiennie przyciągaj kolana do klatki piersiowej w szybkim tempie.', icon: 'activity', isTimed: true },
  { id: 'jumping-jacks', name: 'Pajacyki', muscleGroup: 'cardio', equipment: 'brak', difficulty: 'początkujący', type: 'cardio', location: 'dom', met: 7, description: 'Wyskok z jednoczesnym rozłożeniem nóg i uniesieniem rąk nad głowę, wróć do pozycji startowej.', icon: 'activity', isTimed: true },
  { id: 'bieg-w-miejscu', name: 'Bieg w miejscu', muscleGroup: 'cardio', equipment: 'brak', difficulty: 'początkujący', type: 'cardio', location: 'dom', met: 8, description: 'Dynamiczny bieg w miejscu z wysokim unoszeniem kolan.', icon: 'footprints', isTimed: true },
  { id: 'skakanka', name: 'Skakanka', muscleGroup: 'cardio', equipment: 'brak', difficulty: 'średni', type: 'cardio', location: 'dom', met: 10, description: 'Skakanie przez skakankę w równym tempie, lądowanie na palcach.', icon: 'heart', isTimed: true },
  { id: 'rower', name: 'Jazda na rowerze stacjonarnym', muscleGroup: 'cardio', equipment: 'maszyna', difficulty: 'początkujący', type: 'cardio', location: 'siłownia', met: 7, description: 'Utrzymuj równe tempo pedałowania na wybranym oporze.', icon: 'bike', isTimed: true },
  { id: 'rozciaganie-nog', name: 'Rozciąganie tylnej taśmy nóg', muscleGroup: 'nogi', equipment: 'brak', difficulty: 'początkujący', type: 'rozciąganie', location: 'dom', met: 2, description: 'Usiądź z wyprostowanymi nogami i sięgnij dłońmi w stronę stóp, utrzymaj napięcie.', icon: 'shrink', isTimed: true },
  { id: 'rozciaganie-klatki', name: 'Rozciąganie klatki piersiowej', muscleGroup: 'klatka', equipment: 'brak', difficulty: 'początkujący', type: 'rozciąganie', location: 'dom', met: 2, description: 'Oprzyj przedramię o framugę i delikatnie skręć tułów w przeciwną stronę.', icon: 'shrink', isTimed: true },
  { id: 'kocia-krowa', name: 'Kocia-krowa', muscleGroup: 'plecy', equipment: 'brak', difficulty: 'początkujący', type: 'rozciąganie', location: 'dom', met: 2, description: 'W podporze klęcznym naprzemiennie wyginaj i zaokrąglaj kręgosłup.', icon: 'anchor', isTimed: true },
]
