<script setup lang="ts">
import { BellRing } from 'lucide-vue-next'
import ComingSoonView from '@/components/layout/ComingSoonView.vue'
</script>

<template>
  <ComingSoonView
    title="Systems Status"
    subtitle="Monitoring stanu systemu"
    :icon="BellRing"
    description="Tu pojawi się status usług, kolejek i integracji OGAR w czasie rzeczywistym."
  />
</template>
