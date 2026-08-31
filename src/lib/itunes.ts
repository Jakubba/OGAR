const BASE_URL = 'https://itunes.apple.com/search'

export interface ItunesSearchResult {
  id: number
  title: string
  artist: string
  album: string
  genre: string
  year: string
  artworkUrl: string | null
  previewUrl: string | null
}

interface ItunesApiTrack {
  trackId: number
  trackName: string
  artistName: string
  collectionName?: string
  primaryGenreName?: string
  releaseDate?: string
  artworkUrl100?: string
  previewUrl?: string
}

interface ItunesSearchResponse {
  resultCount: number
  results: ItunesApiTrack[]
}

export async function searchTracks(query: string, limit = 15): Promise<ItunesSearchResult[]> {
  const url = `${BASE_URL}?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${limit}&country=PL`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`iTunes odpowiedziało błędem (${res.status}).`)
  }
  const data = (await res.json()) as ItunesSearchResponse
  return data.results
    .filter((r) => r.trackId && r.trackName)
    .map((r) => ({
      id: r.trackId,
      title: r.trackName,
      artist: r.artistName,
      album: r.collectionName ?? '',
      genre: r.primaryGenreName ?? 'Inne',
      year: r.releaseDate ? r.releaseDate.slice(0, 4) : '',
      artworkUrl: r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '600x600bb') : null,
      previewUrl: r.previewUrl ?? null,
    }))
}

const DISCOVERY_TERMS = [
  'pop',
  'rock',
  'hip hop',
  'disco polo',
  'jazz',
  'lofi',
  'indie',
  'metal',
  'reggae',
  'dance',
  'r&b',
  'rap',
  'punk',
  'blues',
  'funk',
  'edm',
  'soul',
  'country',
  'alternative',
  'klasyka',
]

// Losowa próbka utworów z iTunes — używana do funkcji "Losowanie" (odkrywanie nowej muzyki spoza własnej listy)
export async function getRandomTracks(): Promise<ItunesSearchResult[]> {
  const term = DISCOVERY_TERMS[Math.floor(Math.random() * DISCOVERY_TERMS.length)]
  return searchTracks(term, 50)
}
