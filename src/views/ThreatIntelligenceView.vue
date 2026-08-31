<script setup lang="ts">
import { ShieldAlert } from 'lucide-vue-next'
import ComingSoonView from '@/components/layout/ComingSoonView.vue'
</script>

<template>
  <ComingSoonView
    title="Threat Intelligence"
    subtitle="Bezpieczeństwo i ostrzeżenia"
    :icon="ShieldAlert"
    description="Tu pojawią się alerty bezpieczeństwa i analiza zagrożeń dotyczących Twoich kont i danych."
  />
</template>
