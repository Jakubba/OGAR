<script setup lang="ts">
import { FolderHeart } from 'lucide-vue-next'
import ComingSoonView from '@/components/layout/ComingSoonView.vue'
</script>

<template>
  <ComingSoonView
    title="My Collections"
    subtitle="Księga Łowów"
    :icon="FolderHeart"
    description="Tu pojawi się Twoja kolekcja obejrzanych filmów i seriali oraz osobiste listy do obejrzenia."
  />
</template>
