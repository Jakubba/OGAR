<script setup lang="ts">
import { Camera, Plus, Trash2 } from 'lucide-vue-next'

defineProps<{
  newProduct: { name: string; store: string; aisle: string; category: string; price: number }
  photoPreview: string | null
  formError: string
  saving: boolean
  showHeading?: boolean
}>()
const emit = defineEmits<{ 'photo-selected': [event: Event]; 'clear-photo': []; submit: [] }>()
</script>

<template>
  <div>
    <h3 v-if="showHeading" class="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
      <Plus class="w-3.5 h-3.5" /> Stwórz nowy produkt
    </h3>

    <label
      class="relative aspect-square w-full border border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 mb-3 cursor-pointer hover:border-orange-500/40 hover:text-orange-600 dark:hover:text-orange-400 transition-colors overflow-hidden bg-slate-50 dark:bg-slate-900/50"
    >
      <input
        type="file"
        accept="image/*"
        capture="environment"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        @change="emit('photo-selected', $event)"
      />
      <template v-if="photoPreview">
        <img :src="photoPreview" alt="Podgląd zdjęcia produktu" class="w-full h-full object-contain" />
        <button
          type="button"
          @click.prevent.stop="emit('clear-photo')"
          class="absolute top-1.5 right-1.5 z-10 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
        >
          <Trash2 class="w-3 h-3" />
        </button>
      </template>
      <template v-else>
        <Camera class="w-5 h-5 mb-1" />
        <span class="text-[10px]">Dodaj zdjęcie lub zrób zdjęcie</span>
      </template>
    </label>

    <p v-if="formError" class="text-[11px] text-rose-600 dark:text-rose-400 mb-3">{{ formError }}</p>

    <div class="space-y-3">
      <div>
        <label class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nazwa produktu</label>
        <input v-model="newProduct.name" type="text" placeholder="np. Płatki Owsiane 500g" class="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500/50" />
      </div>
      <div>
        <label class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Lokalizacja / Sklep</label>
        <input v-model="newProduct.store" type="text" placeholder="Wybierz sklep" class="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500/50" />
      </div>
      <div>
        <label class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Alejka / Sekcja (opcjonalnie)</label>
        <input v-model="newProduct.aisle" type="text" placeholder="Wybierz alejkę" class="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500/50" />
      </div>
      <div>
        <label class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Kategoria</label>
        <input v-model="newProduct.category" type="text" placeholder="Wybierz kategorię" class="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500/50" />
      </div>
      <div>
        <label class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Orientacyjna cena</label>
        <input v-model.number="newProduct.price" type="number" step="0.01" min="0" class="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500/50" />
      </div>

      <button
        type="button"
        @click="emit('submit')"
        :disabled="saving"
        class="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black text-sm font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ saving ? 'Zapisywanie...' : 'Stwórz produkt' }}
      </button>
    </div>
  </div>
</template>
