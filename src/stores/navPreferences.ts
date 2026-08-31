import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { ALWAYS_VISIBLE_NAV_NAMES } from '@/lib/navigation'

const STORAGE_KEY = 'ogar-hidden-nav-items'

function loadHidden(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export const useNavPreferencesStore = defineStore('navPreferences', () => {
  const hiddenItems = ref<string[]>(loadHidden())

  watch(
    hiddenItems,
    (val) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    },
    { deep: true },
  )

  function isVisible(name: string): boolean {
    if (ALWAYS_VISIBLE_NAV_NAMES.includes(name)) return true
    return !hiddenItems.value.includes(name)
  }

  function toggleVisible(name: string) {
    if (ALWAYS_VISIBLE_NAV_NAMES.includes(name)) return
    const i = hiddenItems.value.indexOf(name)
    if (i >= 0) hiddenItems.value.splice(i, 1)
    else hiddenItems.value.push(name)
  }

  return { hiddenItems, isVisible, toggleVisible }
})
