import {
  LayoutGrid,
  BellRing,
  ShieldAlert,
  Clapperboard,
  Music2,
  FolderHeart,
  Dumbbell,
  ChartColumn,
  ShoppingCart,
  GraduationCap,
  FileText,
} from 'lucide-vue-next'

export interface NavItem {
  name: string
  label: string
  sublabel?: string
  description?: string
  badge?: string
  icon: unknown
  path: string
}

export const NAV_ITEMS: NavItem[] = [
  {
    name: 'overview',
    label: 'Overview',
    icon: LayoutGrid,
    path: '/overview',
    description: 'Szybki podgląd wszystkiego',
  },
  {
    name: 'systems-status',
    label: 'Systems Status',
    icon: BellRing,
    path: '/systems-status',
    description: 'Status usług i systemów',
  },
  {
    name: 'threat-intelligence',
    label: 'Threat Intelligence',
    icon: ShieldAlert,
    path: '/threat-intelligence',
    description: 'Analiza zagrożeń i alertów',
  },
  {
    name: 'movies-series',
    label: 'Movies & Series',
    icon: Clapperboard,
    path: '/movies-series',
    description: 'Szukaj, oceniaj i losuj filmy',
  },
  {
    name: 'music',
    label: 'Muzyka',
    sublabel: 'iTunes Search',
    icon: Music2,
    path: '/music',
    description: 'Szukaj, oceniaj i losuj utwory',
  },
  {
    name: 'my-collections',
    label: 'My Collections',
    sublabel: 'Księga Łowów',
    icon: FolderHeart,
    path: '/my-collections',
    description: 'Twoje kolekcje i osiągnięcia',
  },
  {
    name: 'working',
    label: 'Working',
    sublabel: 'Ćwiczenia',
    icon: Dumbbell,
    path: '/working',
    description: 'Plany treningowe i ćwiczenia',
  },
  {
    name: 'ogar-analytics',
    label: 'Ogar Analytics',
    icon: ChartColumn,
    path: '/ogar-analytics',
    description: 'Statystyki i analizy danych',
  },
  {
    name: 'shopping',
    label: 'Zakupy & Produkty',
    icon: ShoppingCart,
    path: '/shopping',
    description: 'Listy zakupów i produkty',
  },
  {
    name: 'ogar-english',
    label: 'Ogar English',
    sublabel: 'Vocabulary Hunt',
    badge: 'NEW',
    icon: GraduationCap,
    path: '/ogar-english',
    description: 'Nauka słownictwa angielskiego',
  },
  {
    name: 'documents',
    label: 'Dokumenty',
    sublabel: 'Terminy ważności',
    icon: FileText,
    path: '/documents',
    description: 'Terminy ważności dokumentów',
  },
]

export const ALWAYS_VISIBLE_NAV_NAMES = ['overview', 'settings']
