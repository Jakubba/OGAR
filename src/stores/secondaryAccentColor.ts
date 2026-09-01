import { defineStore } from 'pinia'
import { ref, watchEffect } from 'vue'
import { ACCENT_SHADE_KEYS, buildAccentShades } from '@/lib/color'

const STORAGE_KEY = 'ogar-secondary-accent-color'
export const DEFAULT_SECONDARY_ACCENT_COLOR = '#f59e0b'

function loadColor(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export const useSecondaryAccentColorStore = defineStore('secondaryAccentColor', () => {
  const color = ref<string | null>(loadColor())

  watchEffect(() => {
    const root = document.documentElement
    if (!color.value) {
      ACCENT_SHADE_KEYS.forEach((shade) => root.style.removeProperty(`--color-amber-${shade}`))
      return
    }
    const shades = buildAccentShades(color.value)
    for (const [shade, value] of Object.entries(shades)) {
      root.style.setProperty(`--color-amber-${shade}`, value)
    }
  })

  function setColor(hex: string) {
    color.value = hex
    localStorage.setItem(STORAGE_KEY, hex)
  }

  function resetColor() {
    color.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return { color, setColor, resetColor }
})
