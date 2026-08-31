import beaverImg from '@/assets/img/beaver.svg'
import boarImg from '@/assets/img/boar.svg'
import deerImg from '@/assets/img/deer.svg'
import foxImg from '@/assets/img/fox.svg'
import hedgehogImg from '@/assets/img/hedgehog.svg'
import lynxImg from '@/assets/img/lynx.svg'
import owlImg from '@/assets/img/owl.svg'
import squirrelImg from '@/assets/img/squirrel.svg'
import wolfImg from '@/assets/img/wolf.svg'

export type AnimalId = 'wolf' | 'fox' | 'owl' | 'deer' | 'boar' | 'lynx' | 'beaver' | 'hedgehog' | 'squirrel'

export interface AnimalProfile {
  id: AnimalId
  label: string
  title: string
  emoji: string
  image: string
  description: string
  strengths: string
  weakness: string
  motto: string
}

export const ANIMALS: Record<AnimalId, AnimalProfile> = {
  wolf: {
    id: 'wolf',
    label: 'Wilk',
    title: 'Jesteś Wilkiem!',
    emoji: '🐺',
    image: wolfImg,
    description:
      'Masz silne poczucie własnej wartości i naturalne zdolności przywódcze. Cenisz lojalność i sam jesteś lojalny wobec tych, którym zaufałeś. Nie boisz się trudnych sytuacji i potrafisz podjąć decyzję, gdy inni się wahają.',
    strengths: 'odwaga, niezależność, lojalność, zdolności przywódcze',
    weakness: 'czasami bywasz zbyt uparty i trudno ci zaakceptować cudze zdanie.',
    motto: 'Idę własną ścieżką, ale nigdy nie zostawiam swoich w tyle.',
  },
  fox: {
    id: 'fox',
    label: 'Lis',
    title: 'Jesteś Lisem!',
    emoji: '🦊',
    image: foxImg,
    description:
      'Jesteś osobą kreatywną, ciekawą świata i potrafisz znaleźć wyjście nawet z trudnej sytuacji. Nie zawsze wybierasz najprostszą drogę — często szukasz własnego rozwiązania. Lubisz niezależność, ale potrafisz świetnie odnaleźć się wśród ludzi.',
    strengths: 'spryt, kreatywność, elastyczność, intuicja',
    weakness: 'czasami możesz zbyt długo kombinować zamiast po prostu działać.',
    motto: 'Nie muszę być najsilniejszy. Wystarczy, że znajdę sposób.',
  },
  owl: {
    id: 'owl',
    label: 'Sowa',
    title: 'Jesteś Sową!',
    emoji: '🦉',
    image: owlImg,
    description:
      'Zanim podejmiesz decyzję, dokładnie analizujesz sytuację. Cenisz sobie spokój i wiedzę, a innych zadziwiasz trafnością spostrzeżeń. Rzadko działasz pochopnie — wolisz zrozumieć, zanim zareagujesz.',
    strengths: 'analityczne myślenie, spokój, obserwacja, mądrość',
    weakness: 'czasem zbyt długo się zastanawiasz, przez co przegapiasz dobry moment na działanie.',
    motto: 'Zanim zrobię krok, chcę wiedzieć, dokąd prowadzi.',
  },
  deer: {
    id: 'deer',
    label: 'Jeleń',
    title: 'Jesteś Jeleniem!',
    emoji: '🦌',
    image: deerImg,
    description:
      'Jesteś osobą empatyczną i łagodną, dla której relacje z innymi mają ogromne znaczenie. Unikasz konfliktów i wolisz szukać porozumienia niż konfrontacji. Ludzie czują się przy tobie bezpiecznie.',
    strengths: 'empatia, łagodność, wyczucie innych, dyplomacja',
    weakness: 'czasami zbyt łatwo rezygnujesz ze swojego zdania, żeby uniknąć sporu.',
    motto: 'Wolę spokój i zrozumienie niż wygraną kłótnię.',
  },
  boar: {
    id: 'boar',
    label: 'Dzik',
    title: 'Jesteś Dzikiem!',
    emoji: '🐗',
    image: boarImg,
    description:
      'Działasz zdecydowanie i nie boisz się iść pod prąd. Kiedy coś postanowisz, trudno cię powstrzymać. Twoja siła i upór sprawiają, że inni wiedzą, że można na tobie polegać w trudnych chwilach.',
    strengths: 'stanowczość, siła charakteru, wytrwałość, odwaga w konfrontacji',
    weakness: 'bywasz zbyt impulsywny i czasem działasz, zanim pomyślisz.',
    motto: 'Nie cofam się, kiedy wiem, że mam rację.',
  },
  lynx: {
    id: 'lynx',
    label: 'Ryś',
    title: 'Jesteś Rysiem!',
    emoji: '🐆',
    image: lynxImg,
    description:
      'Cenisz sobie niezależność i wolisz działać na własnych zasadach. Jesteś czujny, precyzyjny i dobrze radzisz sobie sam, bez oglądania się na innych. Rzadko dajesz się zaskoczyć.',
    strengths: 'samodzielność, czujność, precyzja, dystans',
    weakness: 'czasem zbyt trudno ci otworzyć się przed innymi i poprosić o pomoc.',
    motto: 'Polegam przede wszystkim na sobie.',
  },
  beaver: {
    id: 'beaver',
    label: 'Bóbr',
    title: 'Jesteś Bobrem!',
    emoji: '🦫',
    image: beaverImg,
    description:
      'Jesteś osobą pracowitą i zorganizowaną, która lubi budować trwałe rzeczy — projekty, relacje, plany. Dbasz o innych i chętnie wspierasz grupę, w której się znajdujesz.',
    strengths: 'pracowitość, organizacja, troska o innych, konsekwencja',
    weakness: 'czasem bierzesz na siebie zbyt wiele obowiązków, zapominając o sobie.',
    motto: 'Krok po kroku buduję coś, co przetrwa.',
  },
  hedgehog: {
    id: 'hedgehog',
    label: 'Jeż',
    title: 'Jesteś Jeżem!',
    emoji: '🦔',
    image: hedgehogImg,
    description:
      'Jesteś ostrożny i dobrze przemyślany, zanim komuś zaufasz. Wolisz obserwować z bezpiecznego dystansu, zanim się otworzysz. Kiedy już kogoś poznasz, potrafisz być bardzo lojalny.',
    strengths: 'ostrożność, opanowanie, umiejętność obrony granic',
    weakness: 'czasem zbyt szybko się zamykasz, zanim dasz innym szansę.',
    motto: 'Najpierw sprawdzam, komu mogę zaufać.',
  },
  squirrel: {
    id: 'squirrel',
    label: 'Wiewiórka',
    title: 'Jesteś Wiewiórką!',
    emoji: '🐿️',
    image: squirrelImg,
    description:
      'Jesteś pełen energii, ciekawości i zawsze masz w zanadrzu jakiś plan na przyszłość. Szybko się adaptujesz i potrafisz znaleźć rozwiązanie tam, gdzie inni widzą tylko problem.',
    strengths: 'energia, zapobiegliwość, ciekawość świata, elastyczność',
    weakness: 'czasem rozpraszasz się zbyt wieloma rzeczami naraz.',
    motto: 'Zawsze warto mieć zapasowy plan.',
  },
}

export const ANIMAL_ORDER: AnimalId[] = ['wolf', 'fox', 'owl', 'deer', 'boar', 'lynx', 'beaver', 'hedgehog', 'squirrel']

type Scores = Partial<Record<AnimalId, number>>

export interface AnimalTestOption {
  id: string
  label: string
  scores: Scores
}

export interface AnimalTestQuestion {
  id: string
  text: string
  options: AnimalTestOption[]
}

export const ANIMAL_TEST_QUESTIONS: AnimalTestQuestion[] = [
  {
    id: 'q1',
    text: 'Trafiasz samotnie na nieznaną ścieżkę w lesie. Co robisz?',
    options: [
      { id: 'a', label: 'Idę dalej. Lubię odkrywać nowe miejsca.', scores: { squirrel: 2, fox: 1 } },
      { id: 'b', label: 'Najpierw dokładnie obserwuję teren.', scores: { owl: 2, lynx: 1 } },
      { id: 'c', label: 'Zawracam — lepiej nie ryzykować bez potrzeby.', scores: { hedgehog: 2, deer: 1 } },
      { id: 'd', label: 'Sprawdzam, dokąd prowadzi, ale jestem przygotowany na problemy.', scores: { wolf: 1, boar: 1, lynx: 1 } },
      { id: 'e', label: 'Szukam kogoś, kto pójdzie ze mną.', scores: { beaver: 2, deer: 1 } },
    ],
  },
  {
    id: 'q2',
    text: 'W grupie znajomych najczęściej…',
    options: [
      { id: 'a', label: 'przejmuję inicjatywę', scores: { wolf: 2, boar: 1 } },
      { id: 'b', label: 'obserwuję i słucham', scores: { owl: 2, lynx: 1 } },
      { id: 'c', label: 'rozładowuję napięcie żartem', scores: { fox: 2, squirrel: 1 } },
      { id: 'd', label: 'pilnuję, żeby wszystkim było dobrze', scores: { beaver: 2, deer: 1 } },
      { id: 'e', label: 'robię swoje i nie przejmuję się grupą', scores: { lynx: 2, hedgehog: 1 } },
    ],
  },
  {
    id: 'q3',
    text: 'Ktoś cię niesprawiedliwie krytykuje. Co robisz?',
    options: [
      { id: 'a', label: 'Od razu odpowiadam.', scores: { boar: 2, wolf: 1 } },
      { id: 'b', label: 'Zachowuję spokój i analizuję, czy ma rację.', scores: { owl: 2, beaver: 1 } },
      { id: 'c', label: 'Obracam sytuację w żart.', scores: { fox: 2, squirrel: 1 } },
      { id: 'd', label: 'Raczej mnie to zaboli, ale nie pokażę tego.', scores: { deer: 2, hedgehog: 1 } },
      { id: 'e', label: 'Zapamiętuję to i następnym razem zachowuję dystans.', scores: { lynx: 2, hedgehog: 1 } },
    ],
  },
  {
    id: 'q4',
    text: 'Dostajesz wolny weekend. Wybierasz:',
    options: [
      { id: 'a', label: 'spontaniczną wyprawę', scores: { fox: 2, squirrel: 1 } },
      { id: 'b', label: 'spokojny dzień z książką/filmem', scores: { owl: 2, hedgehog: 1 } },
      { id: 'c', label: 'spotkanie ze znajomymi', scores: { beaver: 2, deer: 1 } },
      { id: 'd', label: 'aktywność i nowe doświadczenie', scores: { wolf: 2, boar: 1 } },
      { id: 'e', label: 'samotny odpoczynek', scores: { lynx: 2, hedgehog: 1 } },
    ],
  },
  {
    id: 'q5',
    text: 'Co najbardziej cenisz u innych?',
    options: [
      { id: 'a', label: 'Lojalność', scores: { wolf: 2 } },
      { id: 'b', label: 'Inteligencję', scores: { owl: 2 } },
      { id: 'c', label: 'Poczucie humoru', scores: { fox: 2 } },
      { id: 'd', label: 'Dobroć', scores: { deer: 2, beaver: 1 } },
      { id: 'e', label: 'Odwagę', scores: { boar: 2, wolf: 1 } },
      { id: 'f', label: 'Zaradność', scores: { squirrel: 2, lynx: 1 } },
    ],
  },
  {
    id: 'q6',
    text: 'W lesie znajdujesz starą, zamkniętą chatę. Co robisz?',
    options: [
      { id: 'a', label: 'Otwieram. Ciekawość wygrywa.', scores: { squirrel: 2, fox: 1 } },
      { id: 'b', label: 'Najpierw oglądam ją z zewnątrz.', scores: { owl: 2, lynx: 1 } },
      { id: 'c', label: 'Robię zdjęcie i idę dalej.', scores: { deer: 1, squirrel: 1 } },
      { id: 'd', label: 'Sprawdzam, czy ktoś może potrzebować pomocy.', scores: { beaver: 2, deer: 1 } },
      { id: 'e', label: 'Nie wchodzę — nie wiadomo, co jest w środku.', scores: { hedgehog: 2, lynx: 1 } },
    ],
  },
  {
    id: 'q7',
    text: 'Kiedy pojawia się problem…',
    options: [
      { id: 'a', label: 'działam natychmiast', scores: { boar: 2, wolf: 1 } },
      { id: 'b', label: 'analizuję wszystkie możliwości', scores: { owl: 2, beaver: 1 } },
      { id: 'c', label: 'próbuję znaleźć nietypowe rozwiązanie', scores: { fox: 2, squirrel: 1 } },
      { id: 'd', label: 'pytam innych o pomoc', scores: { deer: 2, beaver: 1 } },
      { id: 'e', label: 'radzę sobie sam', scores: { lynx: 2, hedgehog: 1 } },
    ],
  },
  {
    id: 'q8',
    text: 'Które zdanie najbardziej do ciebie pasuje?',
    options: [
      { id: 'a', label: '„Najlepiej czuję się, kiedy mam wolność.”', scores: { lynx: 2, fox: 1 } },
      { id: 'b', label: '„Zanim coś zrobię, chcę to zrozumieć.”', scores: { owl: 2 } },
      { id: 'c', label: '„Zawsze znajdzie się jakieś rozwiązanie.”', scores: { squirrel: 2, fox: 1 } },
      { id: 'd', label: '„Najważniejsi są ludzie, na których można liczyć.”', scores: { beaver: 2, deer: 1 } },
      { id: 'e', label: '„Nie boję się trudnych sytuacji.”', scores: { wolf: 2, boar: 1 } },
    ],
  },
]

export function computeAnimalResult(answers: Record<string, string>): AnimalId {
  const totals: Record<AnimalId, number> = {
    wolf: 0,
    fox: 0,
    owl: 0,
    deer: 0,
    boar: 0,
    lynx: 0,
    beaver: 0,
    hedgehog: 0,
    squirrel: 0,
  }

  for (const question of ANIMAL_TEST_QUESTIONS) {
    const chosenOptionId = answers[question.id]
    const option = question.options.find((o) => o.id === chosenOptionId)
    if (!option) continue
    for (const [animalId, points] of Object.entries(option.scores) as [AnimalId, number][]) {
      totals[animalId] += points
    }
  }

  let winner: AnimalId = ANIMAL_ORDER[0]
  for (const animalId of ANIMAL_ORDER) {
    if (totals[animalId] > totals[winner]) winner = animalId
  }
  return winner
}
