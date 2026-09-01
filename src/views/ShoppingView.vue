<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
  ShoppingCart,
  Plus,
  Trash2,
  Search,
  Filter,
  MapPin,
  Camera,
  ChevronDown,
  EllipsisVertical,
  Square,
  SquareCheckBig,
  X,
  Minus,
  Upload,
  Download,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useShoppingListsStore, type ShoppingItem, type Aisle, type ShoppingList } from '@/stores/shoppingLists'
import { resizeImageToDataUrl } from '@/lib/image'
import { resolveProductPhoto } from '@/lib/productImages'
import type { Product } from '@/stores/products'
import NewProductForm from '@/components/shopping/NewProductForm.vue'

const authStore = useAuthStore()
const productsStore = useProductsStore()
const listsStore = useShoppingListsStore()

watch(
  () => authStore.user?.uid,
  () => {
    productsStore.watch()
    listsStore.watch()
  },
  { immediate: true },
)

onUnmounted(() => {
  productsStore.stopWatching()
  listsStore.stopWatching()
  window.removeEventListener('keydown', onLightboxKeydown)
})

const lightboxProduct = ref<Product | null>(null)

function openLightbox(product: Product) {
  lightboxProduct.value = product
  touchRecentProduct(product.id)
}

function closeLightbox() {
  lightboxProduct.value = null
}

function onLightboxKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeLightbox()
}

const RECENT_PRODUCTS_KEY = 'ogar_recent_product_ids'
const MAX_RECENT_PRODUCTS = 15

function loadRecentProductIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_PRODUCTS_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

const recentProductIds = ref<string[]>(loadRecentProductIds())

function touchRecentProduct(productId: string) {
  recentProductIds.value = [productId, ...recentProductIds.value.filter((id) => id !== productId)].slice(
    0,
    MAX_RECENT_PRODUCTS,
  )
  localStorage.setItem(RECENT_PRODUCTS_KEY, JSON.stringify(recentProductIds.value))
}

const recentProducts = computed(() => {
  const byId = new Map(productsStore.products.map((p) => [p.id, p]))
  const viewed = recentProductIds.value.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p))
  const viewedIds = new Set(viewed.map((p) => p.id))
  const rest = productsStore.products.filter((p) => !viewedIds.has(p.id))
  return [...viewed, ...rest].slice(0, MAX_RECENT_PRODUCTS)
})

onMounted(() => {
  window.addEventListener('keydown', onLightboxKeydown)
})

const selectedListId = ref<string | null>(null)
watch(
  () => listsStore.lists,
  (lists) => {
    if (!selectedListId.value || !lists.some((l) => l.id === selectedListId.value)) {
      selectedListId.value = lists[0]?.id ?? null
    }
  },
  { immediate: true },
)

const activeList = computed<ShoppingList | undefined>(() =>
  listsStore.lists.find((l) => l.id === selectedListId.value),
)

const listActionError = ref('')

async function runListAction(action: () => Promise<unknown>) {
  try {
    listActionError.value = ''
    await action()
  } catch (err) {
    listActionError.value = err instanceof Error ? err.message : 'Nie udało się zapisać zmiany w Firebase.'
    console.error('[ShoppingView] list action failed:', err)
  }
}

function listProgress(list: ShoppingList) {
  const items = list.aisles.flatMap((a) => a.items)
  if (items.length === 0) return { done: 0, total: 0, pct: 0 }
  const done = items.filter((i) => i.checked).length
  return { done, total: items.length, pct: Math.round((done / items.length) * 100) }
}

const cartItems = computed(() => activeList.value?.aisles.flatMap((a) => a.items).filter((i) => i.checked) ?? [])
const cartTotal = computed(() => cartItems.value.reduce((sum, i) => sum + i.price * i.quantity, 0))

function toggleItem(item: ShoppingItem) {
  if (!activeList.value) return
  runListAction(() => listsStore.toggleItem(activeList.value!, item.id))
}

function changeItemQuantity(item: ShoppingItem, delta: number) {
  if (!activeList.value) return
  runListAction(() => listsStore.setItemQuantity(activeList.value!, item.id, item.quantity + delta))
}

function removeItem(_aisle: Aisle, item: ShoppingItem) {
  if (!activeList.value) return
  runListAction(() => listsStore.removeItem(activeList.value!, item.id))
}

const showNewListForm = ref(false)
const newList = reactive({ name: '', store: '' })

async function createList() {
  if (!newList.name.trim()) return
  await runListAction(async () => {
    const id = await listsStore.createList(newList.name, newList.store)
    selectedListId.value = id
    newList.name = ''
    newList.store = ''
    showNewListForm.value = false
  })
}

function deleteList(list: ShoppingList) {
  if (!window.confirm(`Usunąć listę „${list.name}”? Tej operacji nie można cofnąć.`)) return
  runListAction(() => listsStore.deleteList(list.id))
}

const catalogSearch = ref('')
const filteredCatalog = computed(() =>
  productsStore.products.filter((p) => p.name.toLowerCase().includes(catalogSearch.value.toLowerCase())),
)

function addFromCatalog(product: (typeof productsStore.products)[number]) {
  if (!activeList.value) return
  touchRecentProduct(product.id)
  runListAction(() =>
    listsStore.addItem(activeList.value!, {
      productId: product.id,
      name: product.name,
      unit: 'szt.',
      aisle: product.aisle || 'Bez alejki',
      store: product.store,
      price: product.price,
      photoUrl: product.photoUrl,
    }),
  )
}

const newProduct = reactive({
  name: '',
  store: '',
  aisle: '',
  category: '',
  price: 0,
})

const newProductPhotoFile = ref<File | null>(null)
const newProductPhotoPreview = ref<string | null>(null)
const productFormError = ref('')
const productFormSaving = ref(false)
const showMobileNewProduct = ref(false)

function onPhotoSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  newProductPhotoFile.value = file
  if (newProductPhotoPreview.value) URL.revokeObjectURL(newProductPhotoPreview.value)
  newProductPhotoPreview.value = URL.createObjectURL(file)
}

function clearPhoto() {
  newProductPhotoFile.value = null
  if (newProductPhotoPreview.value) URL.revokeObjectURL(newProductPhotoPreview.value)
  newProductPhotoPreview.value = null
}

async function createProduct() {
  if (productFormSaving.value) return
  if (!newProduct.name.trim()) {
    productFormError.value = 'Podaj nazwę produktu.'
    return
  }
  productFormError.value = ''
  productFormSaving.value = true
  try {
    let photoUrl: string | undefined
    if (newProductPhotoFile.value) {
      photoUrl = await resizeImageToDataUrl(newProductPhotoFile.value)
    }
    const productId = await productsStore.addProduct({ ...newProduct, ...(photoUrl ? { photoUrl } : {}) })
    touchRecentProduct(productId)
    newProduct.name = ''
    newProduct.store = ''
    newProduct.aisle = ''
    newProduct.category = ''
    newProduct.price = 0
    clearPhoto()
  } catch (err) {
    productFormError.value =
      err instanceof Error ? err.message : 'Nie udało się zapisać produktu w Firebase.'
    console.error('[ShoppingView] createProduct failed:', err)
  } finally {
    productFormSaving.value = false
  }
}

interface ImportedProductJson {
  name?: unknown
  store?: unknown
  aisle?: unknown
  category?: unknown
  price?: unknown
  photoUrl?: unknown
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function priceOf(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

const productImportInput = ref<HTMLInputElement | null>(null)
const productImporting = ref(false)
const productImportError = ref('')
const productImportSuccess = ref('')
const productExportError = ref('')

function triggerProductImport() {
  productImportError.value = ''
  productImportSuccess.value = ''
  productImportInput.value?.click()
}

async function handleProductImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  productImporting.value = true
  productImportError.value = ''
  productImportSuccess.value = ''
  try {
    const raw = await file.text()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      throw new Error('Plik JSON musi zawierać tablicę produktów, np. [ { "name": "...", ... } ].')
    }

    const items = (parsed as ImportedProductJson[])
      .map((entry) => ({
        name: textOf(entry.name).trim(),
        store: textOf(entry.store),
        aisle: textOf(entry.aisle),
        category: textOf(entry.category),
        price: priceOf(entry.price),
        ...(textOf(entry.photoUrl) ? { photoUrl: textOf(entry.photoUrl) } : {}),
      }))
      .filter((item) => item.name.length > 0)

    if (items.length === 0) {
      throw new Error('Nie znaleziono żadnych poprawnych produktów (pole "name" jest wymagane).')
    }

    await productsStore.importProducts(items)
    productImportSuccess.value = `Zaimportowano ${items.length} produktów.`
  } catch (err) {
    productImportError.value = err instanceof Error ? err.message : 'Nie udało się zaimportować pliku.'
  } finally {
    productImporting.value = false
  }
}

function exportProductsCatalog() {
  productExportError.value = ''
  if (productsStore.products.length === 0) {
    productExportError.value = 'Baza produktów jest pusta.'
    return
  }

  const data = productsStore.products.map((p) => ({
    name: p.name,
    store: p.store,
    aisle: p.aisle,
    category: p.category,
    price: p.price,
    ...(p.photoUrl ? { photoUrl: p.photoUrl } : {}),
  }))

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'baza-produktow.json'
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="flex items-center gap-3 mb-8">
      <ShoppingCart class="w-7 h-7 text-orange-600 dark:text-orange-400" />
      <div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-wide uppercase">Zakupy &amp; Baza Produktów</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">Smart Shopping List</p>
      </div>
    </div>

    <div
      v-if="productsStore.error || listsStore.error || listActionError"
      class="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-sm text-rose-700 dark:text-rose-300"
    >
      Błąd synchronizacji z Firebase: {{ productsStore.error || listsStore.error || listActionError }}. Sprawdź, czy w konsoli
      Firebase istnieje baza Firestore i czy reguły bezpieczeństwa pozwalają zalogowanemu użytkownikowi na zapis pod
      <code>users/&#123;uid&#125;</code>.
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[280px_1fr_320px] gap-6 items-start">
      <!-- Moje listy -->
      <div class="space-y-6">
        <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Moje listy zakupów</h3>
          </div>
          <button
            @click="showNewListForm = !showNewListForm"
            class="w-full mb-3 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer"
          >
            <Plus class="w-4 h-4" /> Nowa Lista
          </button>

          <div v-if="showNewListForm" class="space-y-2 mb-3 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <input
              v-model="newList.name"
              type="text"
              placeholder="Nazwa listy"
              class="w-full px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
            />
            <input
              v-model="newList.store"
              type="text"
              placeholder="Sklep"
              class="w-full px-3 py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
            />
            <button
              @click="createList"
              class="w-full py-2 rounded-lg bg-orange-500/10 border border-orange-500/40 text-orange-600 dark:text-orange-400 text-xs font-bold hover:bg-orange-500/20 cursor-pointer"
            >
              Zapisz listę
            </button>
          </div>

          <div class="space-y-2">
            <p v-if="listsStore.lists.length === 0" class="text-xs text-slate-500 text-center py-3">Brak list zakupów.</p>
            <div
              v-for="list in listsStore.lists"
              :key="list.id"
              @click="selectedListId = list.id"
              :class="[
                'relative w-full text-left p-3 rounded-xl border transition-all cursor-pointer',
                selectedListId === list.id
                  ? 'bg-orange-500/10 border-orange-500/50'
                  : 'bg-slate-100 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700',
              ]"
            >
              <button
                @click.stop="deleteList(list)"
                class="absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                title="Usuń listę"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
              <div class="flex justify-between items-center mb-1 pr-6">
                <span class="text-sm font-semibold text-slate-900 dark:text-white truncate">{{ list.name }}</span>
              </div>
              <p :class="['text-[10px] font-semibold mb-2', list.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500']">
                {{ list.status === 'active' ? 'Aktywna' : 'Archiwalna' }}
              </p>
              <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                <span>{{ listProgress(list).done }} / {{ listProgress(list).total }} produktów</span>
                <span>{{ listProgress(list).pct }}%</span>
              </div>
              <div class="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-orange-500 to-amber-400" :style="{ width: `${listProgress(list).pct}%` }" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeList" class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4">
          <h3 class="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">Podsumowanie listy</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-500 dark:text-slate-400">W koszyku:</span>
              <span class="font-semibold text-slate-900 dark:text-white">{{ cartTotal.toFixed(2) }} zł</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Aktywna lista -->
      <div class="space-y-6">
        <div v-if="!activeList" class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-10 text-center text-sm text-slate-500">
          Stwórz swoją pierwszą listę zakupów, żeby zacząć dodawać produkty.
        </div>
        <div v-else class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5">
          <div class="flex items-center justify-between gap-2 mb-1">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide min-w-0">Aktywna lista: {{ activeList.name }}</h3>
            <button class="p-1.5 shrink-0 text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">
              <EllipsisVertical class="w-4 h-4" />
            </button>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2 mb-5 text-xs text-slate-500 dark:text-slate-400">
            <button class="flex items-center gap-1 shrink-0 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
              Sortuj wg alejek <ChevronDown class="w-3.5 h-3.5" />
            </button>
            <span class="flex items-center gap-1 min-w-0 max-w-full"><MapPin class="w-3.5 h-3.5 shrink-0" /> <span class="truncate">{{ activeList.store }}</span></span>
          </div>

          <div v-if="activeList.aisles.every((a) => a.items.length === 0)" class="text-center py-10 text-sm text-slate-500">
            Ta lista nie ma jeszcze żadnych produktów.
          </div>

          <div v-for="aisle in activeList.aisles" :key="aisle.name" class="mb-5 last:mb-0">
            <template v-if="aisle.items.length">
              <div class="flex items-center gap-2 mb-2 min-w-0">
                <span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <h4 class="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide truncate">{{ aisle.name }}</h4>
              </div>
              <div class="space-y-2">
                <div
                  v-for="item in aisle.items"
                  :key="item.id"
                  class="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/60"
                >
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <button @click="toggleItem(item)" class="shrink-0 text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer">
                      <SquareCheckBig v-if="item.checked" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <Square v-else class="w-5 h-5" />
                    </button>
                    <img
                      v-if="resolveProductPhoto(item.photoUrl)"
                      :src="resolveProductPhoto(item.photoUrl)"
                      :alt="item.name"
                      class="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                    <div class="flex-1 min-w-0">
                      <p :class="['text-sm font-medium truncate', item.checked ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200']">
                        {{ item.name }}
                      </p>
                      <p class="text-[11px] text-slate-500 truncate">
                        {{ [item.store, item.aisle].filter(Boolean).join(' · ') || 'Bez lokalizacji' }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center justify-between gap-3 w-full sm:w-auto">
                    <div class="flex items-center gap-1.5 shrink-0">
                      <button
                        @click="changeItemQuantity(item, -1)"
                        :disabled="item.quantity <= 1"
                        class="w-6 h-6 flex items-center justify-center rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Minus class="w-3 h-3" />
                      </button>
                      <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 w-14 text-center">
                        {{ item.quantity }} {{ item.unit }}
                      </span>
                      <button
                        @click="changeItemQuantity(item, 1)"
                        class="w-6 h-6 flex items-center justify-center rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <Plus class="w-3 h-3" />
                      </button>
                    </div>
                    <span :class="['text-sm font-semibold w-16 text-right shrink-0', item.checked ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white']">
                      {{ (item.price * item.quantity).toFixed(2) }} zł
                    </span>
                    <button @click="removeItem(aisle, item)" class="shrink-0 text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4 flex items-center gap-2">
            <ShoppingCart class="w-4 h-4 text-orange-600 dark:text-orange-400" /> W koszyku ({{ cartItems.length }})
          </h3>
          <div v-if="cartItems.length === 0" class="text-sm text-slate-500 text-center py-4">Koszyk jest pusty.</div>
          <div v-else class="space-y-3">
            <div v-for="item in cartItems" :key="item.id" class="flex items-center justify-between gap-2 text-sm">
              <div class="min-w-0 flex-1">
                <p class="font-medium text-slate-800 dark:text-slate-200 truncate">{{ item.name }}</p>
                <p class="text-[11px] text-slate-500 truncate">{{ item.aisle }} · {{ item.quantity }} {{ item.unit }}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="font-semibold text-slate-900 dark:text-white">{{ (item.price * item.quantity).toFixed(2) }} zł</span>
                <SquareCheckBig class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div class="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800 text-sm">
              <span class="text-slate-500 dark:text-slate-400 mr-2">Suma:</span>
              <span class="font-bold text-orange-600 dark:text-orange-400">{{ cartTotal.toFixed(2) }} zł</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Katalog produktów -->
      <div class="space-y-6">
        <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4">
          <h3 class="text-sm sm:text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">Katalog produktów</h3>
          <div class="relative mb-3">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              v-model="catalogSearch"
              type="text"
              placeholder="Szukaj produktów..."
              class="w-full pl-9 pr-9 py-3 sm:py-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm sm:text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
            />
            <Filter class="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>

          <input ref="productImportInput" type="file" accept="application/json,.json" class="hidden" @change="handleProductImportFile" />
          <div class="grid grid-cols-2 gap-2 mb-3">
            <button
              @click="triggerProductImport"
              :disabled="productImporting"
              class="py-3 sm:py-2 rounded-xl bg-orange-500/10 border border-orange-500/40 text-orange-600 dark:text-orange-400 text-xs sm:text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-orange-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload class="w-4 h-4 sm:w-3.5 sm:h-3.5" /> {{ productImporting ? 'Importowanie...' : 'Importuj JSON' }}
            </button>
            <button
              @click="exportProductsCatalog"
              :disabled="productsStore.products.length === 0"
              class="py-3 sm:py-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs sm:text-[11px] font-bold flex items-center justify-center gap-1.5 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download class="w-4 h-4 sm:w-3.5 sm:h-3.5" /> Eksportuj JSON
            </button>
          </div>
          <p v-if="productImportError" class="text-xs sm:text-[11px] text-rose-600 dark:text-rose-400 mb-3">{{ productImportError }}</p>
          <p v-if="productImportSuccess" class="text-xs sm:text-[11px] text-emerald-600 dark:text-emerald-400 mb-3">{{ productImportSuccess }}</p>
          <p v-if="productExportError" class="text-xs sm:text-[11px] text-rose-600 dark:text-rose-400 mb-3">{{ productExportError }}</p>

          <div class="space-y-2">
            <div
              v-for="product in filteredCatalog"
              :key="product.id"
              class="flex items-center gap-3 p-3 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/60"
            >
              <img
                v-if="resolveProductPhoto(product.photoUrl)"
                :src="resolveProductPhoto(product.photoUrl)"
                :alt="product.name"
                @click="openLightbox(product)"
                class="w-14 h-14 sm:w-10 sm:h-10 rounded-lg object-cover shrink-0 cursor-zoom-in"
              />
              <div v-else class="w-14 h-14 sm:w-10 sm:h-10 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm sm:text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{{ product.name }}</p>
                <p class="text-xs sm:text-[10px] text-slate-500 truncate">{{ [product.store, product.aisle].filter(Boolean).join(' - ') || 'Bez lokalizacji' }}</p>
                <p class="text-xs sm:text-[10px] text-slate-500 dark:text-slate-400">{{ product.price.toFixed(2) }} zł</p>
              </div>
              <button
                @click="addFromCatalog(product)"
                :disabled="!activeList"
                class="shrink-0 flex items-center justify-center gap-1 p-3 sm:px-2.5 sm:py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/40 text-orange-600 dark:text-orange-400 text-[11px] font-bold hover:bg-orange-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus class="w-[18px] h-[18px] sm:w-3 sm:h-3" />
                <span class="hidden sm:inline">Dodaj</span>
              </button>
            </div>
            <p v-if="filteredCatalog.length === 0" class="text-sm sm:text-xs text-slate-500 text-center py-3">Brak wyników.</p>
          </div>
        </div>

        <div class="hidden lg:block bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4">
          <NewProductForm
            :new-product="newProduct"
            :photo-preview="newProductPhotoPreview"
            :form-error="productFormError"
            :saving="productFormSaving"
            show-heading
            @photo-selected="onPhotoSelected"
            @clear-photo="clearPhoto"
            @submit="createProduct"
          />
        </div>
      </div>
    </div>

    <!-- Pływający przycisk "Nowy produkt" — tylko na mobile/tablet, nad dolną nawigacją -->
    <button
      type="button"
      @click="showMobileNewProduct = true"
      class="lg:hidden fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] z-40 w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-[0_0_50px_10px_color-mix(in_srgb,var(--color-amber-500)_45%,transparent)] flex items-center justify-center hover:brightness-110 hover:shadow-[0_0_60px_14px_color-mix(in_srgb,var(--color-amber-500)_55%,transparent)] transition-all cursor-pointer"
      title="Stwórz nowy produkt"
    >
      <Plus class="w-6 h-6" />
    </button>

    <Teleport to="body">
      <div v-if="showMobileNewProduct" class="lg:hidden fixed inset-0 z-50 bg-white dark:bg-[#0b1220] overflow-y-auto">
        <div class="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0b1220]/95 backdrop-blur-xl">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
            <Plus class="w-4 h-4" /> Stwórz nowy produkt
          </h3>
          <button
            type="button"
            @click="showMobileNewProduct = false"
            class="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
            title="Zamknij"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-4">
          <NewProductForm
            :new-product="newProduct"
            :photo-preview="newProductPhotoPreview"
            :form-error="productFormError"
            :saving="productFormSaving"
            @photo-selected="onPhotoSelected"
            @clear-photo="clearPhoto"
            @submit="
              async () => {
                await createProduct()
                if (!productFormError) showMobileNewProduct = false
              }
            "
          />
        </div>
      </div>
    </Teleport>

    <div v-if="recentProducts.length" class="mt-6 bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4">
      <h3 class="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">
        Ostatnio dodane / oglądane produkty
      </h3>
      <div class="flex gap-3 overflow-x-auto pb-1">
        <div
          v-for="product in recentProducts"
          :key="product.id"
          class="relative shrink-0 w-[calc(50%-0.375rem)] sm:w-24 rounded-xl border border-slate-200/70 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-900/50 p-2 hover:border-orange-500/40 transition-colors"
        >
          <button
            @click="openLightbox(product)"
            class="block w-full aspect-square rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 mb-1.5 cursor-zoom-in"
          >
            <img v-if="resolveProductPhoto(product.photoUrl)" :src="resolveProductPhoto(product.photoUrl)" :alt="product.name" class="w-full h-full object-cover" />
          </button>
          <p class="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{{ product.name }}</p>
          <p class="text-[10px] text-slate-500 mb-1.5">{{ product.price.toFixed(2) }} zł</p>
          <button
            @click="addFromCatalog(product)"
            :disabled="!activeList"
            class="w-full py-1 rounded-lg bg-orange-500/10 border border-orange-500/40 text-orange-600 dark:text-orange-400 text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-orange-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus class="w-3 h-3" /> Dodaj
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="lightboxProduct"
      @click="closeLightbox"
      class="fixed inset-0 z-50 bg-slate-400/40 dark:bg-slate-950/50 backdrop-blur-xl backdrop-saturate-150 flex flex-col items-center justify-center p-4 sm:p-8"
    >
      <button
        @click.stop="closeLightbox"
        class="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-black/20 dark:hover:bg-white/20 cursor-pointer"
      >
        <X class="w-6 h-6" />
      </button>
      <div class="flex flex-col items-center h-[80vh] max-w-2xl w-full">
        <img
          :src="resolveProductPhoto(lightboxProduct.photoUrl)"
          :alt="lightboxProduct.name"
          @click.stop
          class="flex-1 min-h-0 max-w-full object-contain rounded-xl"
        />
        <div
          @click.stop
          class="mt-4 w-full max-w-md bg-white/95 dark:bg-[#0b1220]/95 rounded-2xl p-5 text-center shrink-0"
        >
          <p class="text-base font-bold text-slate-900 dark:text-white">{{ lightboxProduct.name }}</p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {{ [lightboxProduct.store, lightboxProduct.aisle].filter(Boolean).join(' - ') || 'Bez lokalizacji' }}
          </p>
          <p class="text-base font-semibold text-orange-600 dark:text-orange-400 mt-1">{{ lightboxProduct.price.toFixed(2) }} zł</p>
        </div>
      </div>
    </div>
  </div>
</template>
