const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w342'
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780'

export const TMDB_GENRE_MAP: Record<number, string> = {
  28: 'Akcja',
  12: 'Przygodowy',
  16: 'Animacja',
  35: 'Komedia',
  80: 'Kryminał',
  99: 'Dokumentalny',
  18: 'Dramat',
  10751: 'Familijny',
  14: 'Fantasy',
  36: 'Historyczny',
  27: 'Horror',
  10402: 'Muzyczny',
  9648: 'Tajemnica',
  10749: 'Romans',
  878: 'Sci-Fi',
  10770: 'Film TV',
  53: 'Thriller',
  10752: 'Wojenny',
  37: 'Western',
}

export const TMDB_GENRE_NAMES = Object.values(TMDB_GENRE_MAP)

export interface TmdbSearchResult {
  id: number
  title: string
  year: string
  posterUrl: string | null
  genres: string[]
  voteAverage: number
}

interface TmdbApiMovie {
  id: number
  title: string
  release_date?: string
  poster_path?: string | null
  genre_ids?: number[]
  vote_average?: number
}

interface TmdbSearchResponse {
  results: TmdbApiMovie[]
}

export function isTmdbConfigured(): boolean {
  return Boolean(API_KEY)
}

export async function searchMovies(query: string): Promise<TmdbSearchResult[]> {
  if (!API_KEY) {
    throw new Error('Brak skonfigurowanego klucza TMDB API (VITE_TMDB_API_KEY).')
  }
  const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=pl-PL&include_adult=false&query=${encodeURIComponent(query)}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`TMDB odpowiedziało błędem (${res.status}).`)
  }
  const data = (await res.json()) as TmdbSearchResponse
  return data.results.map((r) => ({
    id: r.id,
    title: r.title,
    year: r.release_date ? r.release_date.slice(0, 4) : '',
    posterUrl: r.poster_path ? `${IMAGE_BASE}${r.poster_path}` : null,
    genres: (r.genre_ids ?? []).map((gid) => TMDB_GENRE_MAP[gid]).filter((g): g is string => Boolean(g)),
    voteAverage: r.vote_average ?? 0,
  }))
}

export const TMDB_TV_GENRE_MAP: Record<number, string> = {
  10759: 'Akcja i Przygoda',
  16: 'Animacja',
  35: 'Komedia',
  80: 'Kryminał',
  99: 'Dokumentalny',
  18: 'Dramat',
  10751: 'Familijny',
  10762: 'Dla dzieci',
  9648: 'Tajemnica',
  10763: 'Wiadomości',
  10764: 'Reality show',
  10765: 'Sci-Fi i Fantasy',
  10766: 'Telenowela',
  10767: 'Talk-show',
  10768: 'Wojenny i polityczny',
  37: 'Western',
}

export interface TmdbDiscoverResult {
  id: number
  mediaType: 'movie' | 'tv'
  title: string
  year: string
  posterUrl: string | null
  genres: string[]
  voteAverage: number
}

interface TmdbApiTv {
  id: number
  name: string
  first_air_date?: string
  poster_path?: string | null
  genre_ids?: number[]
  vote_average?: number
}

interface TmdbPopularResponse<T> {
  results: T[]
}

// Losowa próbka popularnych filmów i seriali z TMDB — używana do funkcji "Losowanie"
export async function getRandomDiscoverBatch(): Promise<TmdbDiscoverResult[]> {
  if (!API_KEY) {
    throw new Error('Brak skonfigurowanego klucza TMDB API (VITE_TMDB_API_KEY).')
  }
  const moviePage = 1 + Math.floor(Math.random() * 20)
  const tvPage = 1 + Math.floor(Math.random() * 20)

  const [movieRes, tvRes] = await Promise.all([
    fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pl-PL&page=${moviePage}`),
    fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=pl-PL&page=${tvPage}`),
  ])
  if (!movieRes.ok || !tvRes.ok) {
    throw new Error('TMDB odpowiedziało błędem.')
  }

  const movieData = (await movieRes.json()) as TmdbPopularResponse<TmdbApiMovie>
  const tvData = (await tvRes.json()) as TmdbPopularResponse<TmdbApiTv>

  const movies: TmdbDiscoverResult[] = movieData.results.map((r) => ({
    id: r.id,
    mediaType: 'movie',
    title: r.title,
    year: r.release_date ? r.release_date.slice(0, 4) : '',
    posterUrl: r.poster_path ? `${IMAGE_BASE}${r.poster_path}` : null,
    genres: (r.genre_ids ?? []).map((gid) => TMDB_GENRE_MAP[gid]).filter((g): g is string => Boolean(g)),
    voteAverage: r.vote_average ?? 0,
  }))

  const shows: TmdbDiscoverResult[] = tvData.results.map((r) => ({
    id: r.id,
    mediaType: 'tv',
    title: r.name,
    year: r.first_air_date ? r.first_air_date.slice(0, 4) : '',
    posterUrl: r.poster_path ? `${IMAGE_BASE}${r.poster_path}` : null,
    genres: (r.genre_ids ?? [])
      .map((gid) => TMDB_TV_GENRE_MAP[gid] ?? TMDB_GENRE_MAP[gid])
      .filter((g): g is string => Boolean(g)),
    voteAverage: r.vote_average ?? 0,
  }))

  return [...movies, ...shows]
}

export interface TmdbMediaDetails {
  id: number
  mediaType: 'movie' | 'tv'
  title: string
  overview: string
  tagline: string
  releaseYear: string
  runtimeMinutes: number | null
  voteAverage: number
  genres: string[]
  posterUrl: string | null
  backdropUrls: string[]
}

interface TmdbApiGenre {
  id: number
  name: string
}

interface TmdbApiImage {
  file_path: string
}

interface TmdbApiMediaDetailsRaw {
  id: number
  title?: string
  name?: string
  overview?: string
  tagline?: string
  release_date?: string
  first_air_date?: string
  runtime?: number
  episode_run_time?: number[]
  vote_average?: number
  genres?: TmdbApiGenre[]
  poster_path?: string | null
  images?: { backdrops?: TmdbApiImage[] }
}

// Szczegóły filmu/serialu (opis, ocena, gatunki, kadry) — używane w popupie karty na liście.
export async function getMediaDetails(id: number, mediaType: 'movie' | 'tv'): Promise<TmdbMediaDetails> {
  if (!API_KEY) {
    throw new Error('Brak skonfigurowanego klucza TMDB API (VITE_TMDB_API_KEY).')
  }
  const url = `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&language=pl-PL&append_to_response=images&include_image_language=pl,en,null`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`TMDB odpowiedziało błędem (${res.status}).`)
  }
  const data = (await res.json()) as TmdbApiMediaDetailsRaw
  return {
    id: data.id,
    mediaType,
    title: data.title ?? data.name ?? '',
    overview: data.overview ?? '',
    tagline: data.tagline ?? '',
    releaseYear: (data.release_date ?? data.first_air_date ?? '').slice(0, 4),
    runtimeMinutes: mediaType === 'movie' ? (data.runtime ?? null) : (data.episode_run_time?.[0] ?? null),
    voteAverage: data.vote_average ?? 0,
    genres: (data.genres ?? []).map((g) => g.name),
    posterUrl: data.poster_path ? `${IMAGE_BASE}${data.poster_path}` : null,
    backdropUrls: (data.images?.backdrops ?? []).slice(0, 6).map((b) => `${BACKDROP_BASE}${b.file_path}`),
  }
}

function invertGenreMap(map: Record<number, string>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [id, name] of Object.entries(map)) out[name] = Number(id)
  return out
}

const MOVIE_GENRE_NAME_TO_ID = invertGenreMap(TMDB_GENRE_MAP)
const TV_GENRE_NAME_TO_ID = invertGenreMap(TMDB_TV_GENRE_MAP)

export type CatalogType = 'all' | 'movie' | 'tv'
export type CatalogSort = 'popularity' | 'title_asc' | 'release_desc' | 'release_asc'

export interface CatalogFilters {
  page: number
  type: CatalogType
  genre?: string
  year?: number
  sort: CatalogSort
}

export interface CatalogPage {
  items: TmdbDiscoverResult[]
  hasNextPage: boolean
}

interface TmdbDiscoverResponse<T> {
  results: T[]
  page: number
  total_pages: number
}

function sortParamFor(mediaType: 'movie' | 'tv', sort: CatalogSort): string {
  if (sort === 'title_asc') return mediaType === 'movie' ? 'title.asc' : 'name.asc'
  if (sort === 'release_desc') return mediaType === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc'
  if (sort === 'release_asc') return mediaType === 'movie' ? 'primary_release_date.asc' : 'first_air_date.asc'
  return 'popularity.desc'
}

async function discoverOne(
  mediaType: 'movie' | 'tv',
  filters: CatalogFilters,
): Promise<{ items: TmdbDiscoverResult[]; page: number; totalPages: number }> {
  const params = new URLSearchParams({
    api_key: API_KEY,
    language: 'pl-PL',
    include_adult: 'false',
    page: String(filters.page),
    sort_by: sortParamFor(mediaType, filters.sort),
  })
  if (filters.year) {
    params.set(mediaType === 'movie' ? 'primary_release_year' : 'first_air_date_year', String(filters.year))
  }
  if (filters.genre) {
    const genreId = (mediaType === 'movie' ? MOVIE_GENRE_NAME_TO_ID : TV_GENRE_NAME_TO_ID)[filters.genre]
    // Gatunek nieobecny w słowniku danego typu (np. "Horror" dla seriali) — pomijamy ten typ zamiast pokazywać niefiltrowane wyniki.
    if (!genreId) return { items: [], page: filters.page, totalPages: 0 }
    params.set('with_genres', String(genreId))
  }

  const res = await fetch(`${BASE_URL}/discover/${mediaType}?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`TMDB odpowiedziało błędem (${res.status}).`)
  }
  const data = (await res.json()) as TmdbDiscoverResponse<TmdbApiMovie | TmdbApiTv>

  const items: TmdbDiscoverResult[] = data.results.map((r) =>
    mediaType === 'movie'
      ? {
          id: r.id,
          mediaType: 'movie' as const,
          title: (r as TmdbApiMovie).title,
          year: (r as TmdbApiMovie).release_date ? (r as TmdbApiMovie).release_date!.slice(0, 4) : '',
          posterUrl: r.poster_path ? `${IMAGE_BASE}${r.poster_path}` : null,
          genres: (r.genre_ids ?? []).map((gid) => TMDB_GENRE_MAP[gid]).filter((g): g is string => Boolean(g)),
          voteAverage: r.vote_average ?? 0,
        }
      : {
          id: r.id,
          mediaType: 'tv' as const,
          title: (r as TmdbApiTv).name,
          year: (r as TmdbApiTv).first_air_date ? (r as TmdbApiTv).first_air_date!.slice(0, 4) : '',
          posterUrl: r.poster_path ? `${IMAGE_BASE}${r.poster_path}` : null,
          genres: (r.genre_ids ?? [])
            .map((gid) => TMDB_TV_GENRE_MAP[gid] ?? TMDB_GENRE_MAP[gid])
            .filter((g): g is string => Boolean(g)),
          voteAverage: r.vote_average ?? 0,
        },
  )

  return { items, page: data.page, totalPages: data.total_pages }
}

function mergeAndSort(movies: TmdbDiscoverResult[], shows: TmdbDiscoverResult[], sort: CatalogSort): TmdbDiscoverResult[] {
  if (sort === 'popularity') {
    // Obie listy są już posortowane wg popularności przez TMDB — przeplatamy je, zachowując kolejność.
    const merged: TmdbDiscoverResult[] = []
    const max = Math.max(movies.length, shows.length)
    for (let i = 0; i < max; i++) {
      if (movies[i]) merged.push(movies[i])
      if (shows[i]) merged.push(shows[i])
    }
    return merged
  }
  const bySort =
    sort === 'title_asc'
      ? (a: TmdbDiscoverResult, b: TmdbDiscoverResult) => a.title.localeCompare(b.title, 'pl')
      : sort === 'release_desc'
        ? (a: TmdbDiscoverResult, b: TmdbDiscoverResult) => b.year.localeCompare(a.year)
        : (a: TmdbDiscoverResult, b: TmdbDiscoverResult) => a.year.localeCompare(b.year)
  return [...movies, ...shows].sort(bySort)
}

// Przeglądanie katalogu TMDB (wszystkie filmy/seriale) z paginacją i filtrami — osobne od "Twojej listy".
export async function discoverCatalog(filters: CatalogFilters): Promise<CatalogPage> {
  if (!API_KEY) {
    throw new Error('Brak skonfigurowanego klucza TMDB API (VITE_TMDB_API_KEY).')
  }

  if (filters.type === 'movie') {
    const r = await discoverOne('movie', filters)
    return { items: r.items, hasNextPage: filters.page < r.totalPages }
  }
  if (filters.type === 'tv') {
    const r = await discoverOne('tv', filters)
    return { items: r.items, hasNextPage: filters.page < r.totalPages }
  }

  const [movieR, tvR] = await Promise.all([discoverOne('movie', filters), discoverOne('tv', filters)])
  return {
    items: mergeAndSort(movieR.items, tvR.items, filters.sort),
    hasNextPage: filters.page < movieR.totalPages || filters.page < tvR.totalPages,
  }
}
