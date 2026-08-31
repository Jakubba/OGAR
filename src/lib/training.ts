import type { Weekday } from '@/data/exercises'

const WEEKDAY_BY_JS_DAY: Weekday[] = ['nd', 'pon', 'wt', 'sr', 'czw', 'pt', 'sob']

export function todayWeekday(date = new Date()): Weekday {
  return WEEKDAY_BY_JS_DAY[date.getDay()]
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function estimateKcal(met: number, weightKg: number, activeSeconds: number): number {
  if (!met || !weightKg || !activeSeconds) return 0
  return Math.round(met * weightKg * (activeSeconds / 3600))
}

export function computeStreak(dateKeys: Set<string>, today = new Date()): number {
  let cursor = new Date(today)
  if (!dateKeys.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }
  let streak = 0
  while (dateKeys.has(toDateKey(cursor))) {
    streak++
    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function computeRegularityPct(dateKeys: string[], windowDays = 30, today = new Date()): number {
  const unique = new Set(dateKeys)
  let count = 0
  const cursor = new Date(today)
  for (let i = 0; i < windowDays; i++) {
    if (unique.has(toDateKey(cursor))) count++
    cursor.setDate(cursor.getDate() - 1)
  }
  return Math.round((count / windowDays) * 100)
}

export interface SessionTotals {
  completedSets: number
  volumeKg: number
  durationSeconds: number
}

export interface SessionDelta {
  completedSetsDelta: number
  volumeKgDelta: number
  durationSecondsDelta: number
}

export function buildDeltaVsPrevious(current: SessionTotals, previous: SessionTotals | null): SessionDelta | null {
  if (!previous) return null
  return {
    completedSetsDelta: current.completedSets - previous.completedSets,
    volumeKgDelta: Math.round((current.volumeKg - previous.volumeKg) * 10) / 10,
    durationSecondsDelta: current.durationSeconds - previous.durationSeconds,
  }
}
