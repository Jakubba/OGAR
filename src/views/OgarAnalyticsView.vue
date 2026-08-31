<script setup lang="ts">
import { ChartColumn } from 'lucide-vue-next'
import ComingSoonView from '@/components/layout/ComingSoonView.vue'
</script>

<template>
  <ComingSoonView
    title="Ogar Analytics"
    subtitle="Statystyki oglądania"
    :icon="ChartColumn"
    description="Tu pojawią się szczegółowe statystyki godzin oglądania, ulubionych gatunków i premier."
  />
</template>
