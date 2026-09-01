<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { PawPrint, X } from 'lucide-vue-next'
import { NAV_ITEMS } from '@/lib/navigation'
import { useNavPreferencesStore } from '@/stores/navPreferences'
import { useEnglishSetsStore } from '@/stores/englishSets'

defineProps<{ open?: boolean }>()
const emit = defineEmits<{ close: [] }>()

const navPrefsStore = useNavPreferencesStore()
const navItems = computed(() => NAV_ITEMS.filter((item) => navPrefsStore.isVisible(item.name)))
const englishSetsStore = useEnglishSetsStore()

const route = useRoute()

interface FooterBadge {
  title: string
  subtitle: string
  extra?: string
  progress?: number
}

const footerBadges: Record<string, FooterBadge> = {
  shopping: { title: 'Tropiciel Sklepowy', subtitle: 'Aktywny' },
}

const footerBadge = computed<FooterBadge>(() => {
  if (route.name === 'ogar-english') {
    const level = englishSetsStore.levelStats
    return {
      title: level.title,
      subtitle: `Poziom ${level.level}`,
      extra: `${level.xpIntoLevel} / ${level.xpForNextLevel} XP`,
      progress: level.progressPct,
    }
  }
  return footerBadges[route.name as string] ?? { title: 'Tropiciel OGAR', subtitle: 'Aktywny' }
})
</script>

<template>
  <aside
    :class="[
      'w-full sm:w-64 bg-white/95 dark:bg-[#0a101d]/95 lg:bg-white/80 lg:dark:bg-[#0a101d]/80 backdrop-blur-xl border-r border-slate-200/70 dark:border-slate-800/60 flex flex-col z-40 shrink-0 overflow-hidden',
      'fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
      open ? 'translate-x-0' : '-translate-x-full',
    ]"
  >
    <div class="shrink-0">
      <div class="p-6 border-b border-slate-200/70 dark:border-slate-800/60 flex flex-col items-center text-center gap-2 relative">
        <button
          @click="emit('close')"
          class="absolute top-1 right-1 w-11 h-11 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer lg:hidden"
          title="Zamknij menu"
        >
          <X class="w-5 h-5" />
        </button>
        <img src="/logo-1.png" alt="OGAR" class="w-20 h-20 object-contain" />
        <div>
          <h1 class="font-extrabold tracking-wider text-base text-slate-900 dark:text-white leading-tight">OGAR</h1>
          <p class="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Dashboard</p>
        </div>
      </div>
    </div>

    <nav class="flex-1 min-h-0 overflow-y-auto p-4 space-y-1.5">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.path"
          @click="emit('close')"
          :class="[
            'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
            route.name === item.name
              ? 'bg-gradient-to-r from-orange-500/20 to-transparent border-l-4 border-orange-500 text-orange-600 dark:text-orange-400 font-semibold shadow-lg shadow-orange-500/5'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40 border-l-4 border-transparent',
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          <span class="flex-1 leading-tight min-w-0">
            {{ item.label }}
            <span v-if="item.sublabel" class="block text-[10px] font-normal opacity-70">({{ item.sublabel }})</span>
            <span v-if="item.description" class="block text-[9px] font-normal normal-case tracking-normal opacity-60 truncate">
              {{ item.description }}
            </span>
          </span>
          <span
            v-if="item.badge"
            class="text-[9px] font-bold bg-orange-500 text-black px-1.5 py-0.5 rounded-md tracking-wide"
          >
            {{ item.badge }}
          </span>
        </RouterLink>
    </nav>

    <div class="shrink-0 p-4 border-t border-slate-200/70 dark:border-slate-800/60">
      <div class="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
            <PawPrint class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{{ footerBadge.title }}</p>
            <p class="text-[10px] text-orange-600/90 dark:text-orange-400/80 font-medium">{{ footerBadge.subtitle }}</p>
          </div>
        </div>
        <div v-if="footerBadge.extra" class="mt-2">
          <div class="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div class="h-full bg-gradient-to-r from-orange-500 to-amber-400" :style="{ width: `${footerBadge.progress}%` }" />
          </div>
          <p class="text-[10px] text-slate-500 mt-1">{{ footerBadge.extra }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>
