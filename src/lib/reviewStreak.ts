export interface StreakStats {
  current: number
  longest: number
  todayCount: number
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * `days` maps a "YYYY-MM-DD" key to how many reviews happened that day.
 * The current streak still counts as "alive" on a day with 0 reviews so far,
 * since that day isn't over yet — it only breaks once a full day is skipped.
 */
export function computeStreakStats(days: Record<string, number>, now: Date = new Date()): StreakStats {
  const todayKey = toDateKey(now)
  const todayCount = days[todayKey] ?? 0

  const cursor = new Date(now)
  if (todayCount === 0) cursor.setDate(cursor.getDate() - 1)
  let current = 0
  while ((days[toDateKey(cursor)] ?? 0) > 0) {
    current++
    cursor.setDate(cursor.getDate() - 1)
  }

  const activeDays = Object.keys(days)
    .filter((key) => (days[key] ?? 0) > 0)
    .sort()

  let longest = 0
  let run = 0
  let prevDate: Date | null = null
  for (const key of activeDays) {
    const [y, m, d] = key.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    run = prevDate && Math.round((date.getTime() - prevDate.getTime()) / 86400000) === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
    prevDate = date
  }
  longest = Math.max(longest, current)

  return { current, longest, todayCount }
}
