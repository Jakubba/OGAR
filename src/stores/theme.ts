import { defineStore } from 'pinia'
import { computed, ref, watchEffect } from 'vue'

export type ThemeMode = 'dark' | 'light'

const STORAGE_KEY = 'ogar-theme'
const CONFIRM_TIMEOUT_MS = 15000

function getInitialTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(getInitialTheme())
  // Motyw zapisany na dysku; różni się od `mode` tylko w oknie potwierdzenia.
  const confirmedMode = ref<ThemeMode>(mode.value)
  const isPending = computed(() => mode.value !== confirmedMode.value)
  let revertTimer: ReturnType<typeof setTimeout> | null = null

  watchEffect(() => {
    document.documentElement.classList.toggle('dark', mode.value === 'dark')
  })

  function clearRevertTimer() {
    if (revertTimer) {
      clearTimeout(revertTimer)
      revertTimer = null
    }
  }

  function requestTheme(next: ThemeMode) {
    mode.value = next
    clearRevertTimer()
    revertTimer = setTimeout(() => revertTheme(), CONFIRM_TIMEOUT_MS)
  }

  function requestToggleTheme() {
    requestTheme(mode.value === 'dark' ? 'light' : 'dark')
  }

  function confirmTheme() {
    clearRevertTimer()
    confirmedMode.value = mode.value
    localStorage.setItem(STORAGE_KEY, mode.value)
  }

  function revertTheme() {
    clearRevertTimer()
    mode.value = confirmedMode.value
  }

  return {
    mode,
    confirmedMode,
    isPending,
    requestTheme,
    requestToggleTheme,
    confirmTheme,
    revertTheme,
  }
})
