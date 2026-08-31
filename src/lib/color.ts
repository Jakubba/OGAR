export interface Hsl {
  h: number
  s: number
  l: number
}

export function hexToHsl(hex: string): Hsl {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min

  let h = 0
  let s = 0
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }

  return { h, s: s * 100, l: l * 100 }
}

export function hslToCss(h: number, s: number, l: number): string {
  return `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`
}

const SHADE_LIGHTNESS: Record<string, number> = {
  '50': 96,
  '300': 78,
  '400': 68,
  '500': 58,
  '600': 48,
  '700': 40,
}

export const ACCENT_SHADE_KEYS = Object.keys(SHADE_LIGHTNESS)

export function buildAccentShades(hex: string): Record<string, string> {
  const { h, s } = hexToHsl(hex)
  const clampedS = Math.min(Math.max(s, 40), 90)
  const shades: Record<string, string> = {}
  for (const [shade, l] of Object.entries(SHADE_LIGHTNESS)) {
    shades[shade] = hslToCss(h, clampedS, l)
  }
  return shades
}
