<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Menu } from 'lucide-vue-next'
import { NAV_ITEMS } from '@/lib/navigation'
import { useNavPreferencesStore } from '@/stores/navPreferences'

const emit = defineEmits<{ openMenu: [] }>()

const PRIMARY_NAV_NAMES = ['overview', 'movies-series', 'music', 'shopping']

const navPrefsStore = useNavPreferencesStore()
const route = useRoute()

const primaryItems = computed(() =>
  PRIMARY_NAV_NAMES.map((name) => NAV_ITEMS.find((item) => item.name === name)).filter(
    (item): item is (typeof NAV_ITEMS)[number] => !!item && navPrefsStore.isVisible(item.name),
  ),
)
</script>

<template>
  <nav
    class="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-white/95 dark:bg-[#0a101d]/95 backdrop-blur-xl border-t border-slate-200/70 dark:border-slate-800/60 pb-[env(safe-area-inset-bottom)]"
  >
    <div class="grid h-16" :style="{ gridTemplateColumns: `repeat(${primaryItems.length + 1}, minmax(0, 1fr))` }">
      <RouterLink
        v-for="item in primaryItems"
        :key="item.name"
        :to="item.path"
        :class="[
          'flex flex-col items-center justify-center gap-1 min-w-0 px-1 text-[10px] font-medium transition-colors',
          route.name === item.name
            ? 'text-orange-600 dark:text-orange-400'
            : 'text-slate-500 dark:text-slate-400',
        ]"
      >
        <component :is="item.icon" class="w-5 h-5 shrink-0" />
        <span class="truncate max-w-full">{{ item.label }}</span>
      </RouterLink>

      <button
        type="button"
        @click="emit('openMenu')"
        class="flex flex-col items-center justify-center gap-1 min-w-0 px-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 cursor-pointer"
      >
        <Menu class="w-5 h-5 shrink-0" />
        <span class="truncate max-w-full">Więcej</span>
      </button>
    </div>
  </nav>
</template>
