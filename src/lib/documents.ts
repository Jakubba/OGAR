export const DOCUMENT_TYPES = [
  'OC pojazdu',
  'AC pojazdu',
  'Przegląd techniczny',
  'Dowód osobisty',
  'Paszport',
  'Prawo jazdy',
  'Ubezpieczenie mieszkania',
  'Badania okresowe',
  'Szkolenie BHP',
  'PIT',
  'Karta pobytu / wiza',
  'Polisa NNW',
  'Certyfikat zawodowy',
  'Inne',
] as const

export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export type DocumentUrgency = 'expired' | 'urgent' | 'ok'

export function daysUntil(dateStr: string, today = new Date()): number {
  const target = new Date(`${dateStr}T00:00:00`)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffMs = target.getTime() - start.getTime()
  return Math.round(diffMs / 86_400_000)
}

export function documentUrgency(expiresAt: string, reminderDays: number, today = new Date()): DocumentUrgency {
  const days = daysUntil(expiresAt, today)
  if (days < 0) return 'expired'
  if (days <= reminderDays) return 'urgent'
  return 'ok'
}

export function formatDaysLabel(days: number): string {
  if (days < 0) return `Wygasło ${Math.abs(days)} dni temu`
  if (days === 0) return 'Wygasa dzisiaj'
  return `Wygasa za ${days} dni`
}
