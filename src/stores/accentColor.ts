import { defineStore } from 'pinia'
import { ref, watchEffect } from 'vue'
import { ACCENT_SHADE_KEYS, buildAccentShades } from '@/lib/color'

const STORAGE_KEY = 'ogar-accent-color'
export const DEFAULT_ACCENT_COLOR = '#f97316'

function loadColor(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export const useAccentColorStore = defineStore('accentColor', () => {
  const color = ref<string | null>(loadColor())

  watchEffect(() => {
    const root = document.documentElement
    if (!color.value) {
      ACCENT_SHADE_KEYS.forEach((shade) => root.style.removeProperty(`--color-orange-${shade}`))
      return
    }
    const shades = buildAccentShades(color.value)
    for (const [shade, value] of Object.entries(shades)) {
      root.style.setProperty(`--color-orange-${shade}`, value)
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
