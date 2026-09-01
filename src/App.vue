<script setup lang="ts">
import { RouterView } from 'vue-router'
import ThemeConfirmDialog from '@/components/ThemeConfirmDialog.vue'
import { useAccentColorStore } from '@/stores/accentColor'
import { useSecondaryAccentColorStore } from '@/stores/secondaryAccentColor'

useAccentColorStore()
useSecondaryAccentColorStore()
</script>

<template>
  <RouterView />
  <ThemeConfirmDialog />
</template>