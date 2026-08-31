<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { Check, Moon, RotateCcw, Sun } from 'lucide-vue-next'

const themeStore = useThemeStore()
const secondsLeft = ref(15)
let interval: ReturnType<typeof setInterval> | null = null

const stopCountdown = () => {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
}

const startCountdown = () => {
  stopCountdown()
  secondsLeft.value = 15
  interval = setInterval(() => {
    secondsLeft.value -= 1
    if (secondsLeft.value <= 0) stopCountdown()
  }, 1000)
}

watch(
  () => themeStore.isPending,
  (pending) => (pending ? startCountdown() : stopCountdown()),
)

onUnmounted(stopCountdown)
</script>

<template>
  <Transition name="theme-confirm">
    <div
      v-if="themeStore.isPending"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[min(440px,90vw)] bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/50 p-4 flex items-center gap-3"
    >
      <div
        class="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0"
      >
        <Moon v-if="themeStore.mode === 'dark'" class="w-4 h-4" />
        <Sun v-else class="w-4 h-4" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">
          Zmieniono motyw na {{ themeStore.mode === 'dark' ? 'ciemny' : 'jasny' }}. Zachować zmiany?
        </p>
        <p class="text-[10px] text-slate-500">
          Bez potwierdzenia wróci poprzedni motyw za {{ secondsLeft }}s
        </p>
      </div>
      <button
        @click="themeStore.revertTheme()"
        title="Przywróć poprzedni motyw"
        class="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
      >
        <RotateCcw class="w-4 h-4" />
      </button>
      <button
        @click="themeStore.confirmTheme()"
        title="Zachowaj zmiany"
        class="px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black rounded-xl hover:opacity-90 transition-all shadow-lg shadow-orange-500/20 cursor-pointer flex items-center gap-1.5 text-xs uppercase tracking-wider shrink-0"
      >
        <Check class="w-3.5 h-3.5" /> Zachowaj
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.theme-confirm-enter-active,
.theme-confirm-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.theme-confirm-enter-from,
.theme-confirm-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
