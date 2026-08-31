export interface LevelStats {
  level: number
  title: string
  xp: number
  xpIntoLevel: number
  xpForNextLevel: number
  progressPct: number
}

const XP_PER_REVIEW = 10
const XP_PER_MASTERED_WORD = 25
/** XP needed to go from level N to N+1 grows linearly by this step. */
const XP_STEP_PER_LEVEL = 300

const RANKS: { minLevel: number; title: string }[] = [
  { minLevel: 1, title: 'Szczeniak' },
  { minLevel: 5, title: 'Tropiciel' },
  { minLevel: 10, title: 'Hunter' },
  { minLevel: 15, title: 'Weteran Tropu' },
  { minLevel: 20, title: 'Legenda Ogara' },
]

export function computeXp(totalReviews: number, masteredCount: number): number {
  return totalReviews * XP_PER_REVIEW + masteredCount * XP_PER_MASTERED_WORD
}

function xpNeededForLevel(level: number): number {
  return level * XP_STEP_PER_LEVEL
}

export function computeLevelStats(xp: number): LevelStats {
  let level = 1
  let xpConsumed = 0
  while (xp - xpConsumed >= xpNeededForLevel(level)) {
    xpConsumed += xpNeededForLevel(level)
    level++
  }

  const xpForNextLevel = xpNeededForLevel(level)
  const xpIntoLevel = xp - xpConsumed
  const progressPct = Math.round((xpIntoLevel / xpForNextLevel) * 100)
  const title = [...RANKS].reverse().find((rank) => level >= rank.minLevel)?.title ?? RANKS[0].title

  return { level, title, xp, xpIntoLevel, xpForNextLevel, progressPct }
}
