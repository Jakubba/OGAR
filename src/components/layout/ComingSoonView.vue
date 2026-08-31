<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  icon: unknown
  description: string
}>()
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-3xl">
    <div class="flex items-center gap-3 mb-8">
      <component :is="icon" class="w-7 h-7 text-orange-600 dark:text-orange-400" />
      <div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-wide uppercase">{{ title }}</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">{{ subtitle }}</p>
      </div>
    </div>

    <div class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
      <component :is="icon" class="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
      <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Moduł w budowie</h3>
      <p class="text-sm text-slate-500 max-w-md mx-auto">{{ description }}</p>
    </div>
  </div>
</template>
