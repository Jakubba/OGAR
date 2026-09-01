import { computed, onMounted, onUnmounted, ref, watch, type ComputedRef, type Ref } from 'vue'

const MOBILE_QUERY = '(min-width: 640px)'
const INITIAL_COUNT = 5
const FIRST_STEP = 10
const NEXT_STEP = 5

export function useIsMobile() {
  const isMobile = ref(false)
  let mq: MediaQueryList | null = null

  const update = () => {
    isMobile.value = mq ? !mq.matches : false
  }

  onMounted(() => {
    mq = window.matchMedia(MOBILE_QUERY)
    update()
    mq.addEventListener('change', update)
  })

  onUnmounted(() => {
    mq?.removeEventListener('change', update)
  })

  return isMobile
}

/**
 * On mobile: reveals `initial` items, then `firstStep` more on the first "show more" click,
 * then `nextStep` more on each subsequent click. On tablet/desktop, shows everything.
 * Defaults match the original 5 / +10 / +5 pattern.
 */
export function useMobileReveal<T>(
  items: Ref<T[]> | ComputedRef<T[]>,
  options?: { initial?: number; firstStep?: number; nextStep?: number },
) {
  const initial = options?.initial ?? INITIAL_COUNT
  const firstStep = options?.firstStep ?? FIRST_STEP
  const nextStep = options?.nextStep ?? NEXT_STEP

  const isMobile = useIsMobile()
  const visibleCount = ref(initial)

  watch(items, () => {
    visibleCount.value = initial
  })

  const displayedItems = computed(() => (isMobile.value ? items.value.slice(0, visibleCount.value) : items.value))
  const canShowMore = computed(() => isMobile.value && visibleCount.value < items.value.length)

  function showMore() {
    visibleCount.value += visibleCount.value === initial ? firstStep : nextStep
  }

  return { isMobile, displayedItems, canShowMore, showMore }
}
