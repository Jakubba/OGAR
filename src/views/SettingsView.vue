<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useAccentColorStore, DEFAULT_ACCENT_COLOR } from '@/stores/accentColor'
import { useSecondaryAccentColorStore, DEFAULT_SECONDARY_ACCENT_COLOR } from '@/stores/secondaryAccentColor'
import { useNavPreferencesStore } from '@/stores/navPreferences'
import { NAV_ITEMS, ALWAYS_VISIBLE_NAV_NAMES } from '@/lib/navigation'
import { Settings, User, Moon, Sun, KeyRound, Mail, Loader2, LayoutList, Wand2 } from 'lucide-vue-next'
import { ANIMALS, type AnimalId } from '@/data/animalTest'
import AnimalTestModal from '@/components/settings/AnimalTestModal.vue'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const accentColorStore = useAccentColorStore()
const secondaryAccentColorStore = useSecondaryAccentColorStore()
const navPrefsStore = useNavPreferencesStore()

const ACCENT_PRESETS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#ef4444', '#14b8a6']
const accentColorInput = computed({
  get: () => accentColorStore.color ?? DEFAULT_ACCENT_COLOR,
  set: (value: string) => accentColorStore.setColor(value),
})

const SECONDARY_ACCENT_PRESETS = ['#f59e0b', '#22c55e', '#a855f7', '#ec4899']
const secondaryAccentColorInput = computed({
  get: () => secondaryAccentColorStore.color ?? DEFAULT_SECONDARY_ACCENT_COLOR,
  set: (value: string) => secondaryAccentColorStore.setColor(value),
})

const hideableNavItems = computed(() => NAV_ITEMS.filter((item) => !ALWAYS_VISIBLE_NAV_NAMES.includes(item.name)))

const photoPreview = computed(() => authStore.user?.photoURL ?? null)

const displayName = ref(authStore.user?.displayName ?? '')
const profileState = ref<{ loading: boolean; error: string; success: string }>({
  loading: false,
  error: '',
  success: '',
})

const photoState = ref<{ loading: boolean; error: string; success: string }>({
  loading: false,
  error: '',
  success: '',
})

const email = ref(authStore.user?.email ?? '')
const emailPassword = ref('')
const emailState = ref<{ loading: boolean; error: string; success: string }>({
  loading: false,
  error: '',
  success: '',
})

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordState = ref<{ loading: boolean; error: string; success: string }>({
  loading: false,
  error: '',
  success: '',
})

const showAnimalTest = ref(false)
const openAnimalTest = () => (showAnimalTest.value = true)
const closeAnimalTest = () => (showAnimalTest.value = false)

const applyAnimalResult = async (animalId: AnimalId) => {
  photoState.value = { loading: true, error: '', success: '' }
  try {
    await authStore.setPhotoFromUrl(ANIMALS[animalId].image)
    photoState.value = {
      loading: false,
      error: '',
      success: `Ustawiono avatar: ${ANIMALS[animalId].label}.`,
    }
  } catch {
    photoState.value = { loading: false, error: 'Nie udało się ustawić avatara. Spróbuj ponownie.', success: '' }
  } finally {
    showAnimalTest.value = false
  }
}

const resetPhoto = async () => {
  photoState.value = { loading: true, error: '', success: '' }
  try {
    await authStore.resetPhoto()
    photoState.value = { loading: false, error: '', success: 'Przywrócono domyślną ikonę.' }
  } catch {
    photoState.value = { loading: false, error: 'Nie udało się zresetować avatara. Spróbuj ponownie.', success: '' }
  }
}

const saveDisplayName = async () => {
  profileState.value = { loading: true, error: '', success: '' }
  try {
    await authStore.changeDisplayName(displayName.value)
    profileState.value = { loading: false, error: '', success: 'Nazwa wyświetlana została zapisana.' }
  } catch {
    profileState.value = { loading: false, error: 'Nie udało się zapisać nazwy.', success: '' }
  }
}

const saveEmail = async () => {
  emailState.value = { loading: true, error: '', success: '' }
  try {
    await authStore.changeEmail(email.value, emailPassword.value)
    emailState.value = { loading: false, error: '', success: 'Login (e-mail) został zmieniony.' }
    emailPassword.value = ''
  } catch {
    emailState.value = {
      loading: false,
      error: 'Nie udało się zmienić loginu — sprawdź hasło i poprawność adresu e-mail.',
      success: '',
    }
  }
}

const savePassword = async () => {
  passwordState.value = { loading: true, error: '', success: '' }
  if (newPassword.value.length < 6) {
    passwordState.value = { loading: false, error: 'Nowe hasło musi mieć min. 6 znaków.', success: '' }
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordState.value = { loading: false, error: 'Podane hasła nie są identyczne.', success: '' }
    return
  }
  try {
    await authStore.changePassword(currentPassword.value, newPassword.value)
    passwordState.value = { loading: false, error: '', success: 'Hasło zostało zmienione.' }
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch {
    passwordState.value = { loading: false, error: 'Nie udało się zmienić hasła — sprawdź aktualne hasło.', success: '' }
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-3xl space-y-6">
    <div class="flex items-center gap-3 mb-2">
      <Settings class="w-7 h-7 text-orange-600 dark:text-orange-400" />
      <div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-wide uppercase">Ustawienia</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">Zarządzaj swoim profilem, kontem i wyglądem aplikacji</p>
      </div>
    </div>

    <!-- Profil / zdjęcie -->
    <section class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6">
      <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
        <User class="w-4 h-4 text-orange-600 dark:text-orange-400" /> Profil
      </h3>

      <div class="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-4 mb-5">
        <div class="relative shrink-0">
          <div
            class="w-24 h-24 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-600 dark:text-orange-400 overflow-hidden"
          >
            <img v-if="photoPreview" :src="photoPreview" alt="Zdjęcie profilowe" class="w-full h-full object-cover" />
            <User v-else class="w-10 h-10" />
          </div>
          <button
            @click="openAnimalTest"
            :disabled="photoState.loading"
            title="Zrób test i wylosuj zwierzę jako avatar"
            class="absolute -bottom-1 -right-1 w-11 h-11 sm:w-7 sm:h-7 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/50 transition-all cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="photoState.loading" class="w-[18px] h-[18px] sm:w-3.5 sm:h-3.5 animate-spin" />
            <Wand2 v-else class="w-[18px] h-[18px] sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 break-words">{{ authStore.user?.email }}</p>
          <p class="text-[11px] text-slate-500">Kliknij ikonę różdżki, aby zrobić test i wylosować zwierzę jako avatar.</p>
          <button
            v-if="photoPreview"
            type="button"
            @click="resetPhoto"
            :disabled="photoState.loading"
            class="mt-1 text-[11px] font-semibold text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 underline underline-offset-2 cursor-pointer disabled:opacity-50"
          >
            Usuń zdjęcie i wróć do domyślnej ikony
          </button>
        </div>
      </div>

      <AnimalTestModal v-if="showAnimalTest" @close="closeAnimalTest" @apply="applyAnimalResult" />

      <p v-if="photoState.error" class="text-orange-600 dark:text-orange-400 text-xs font-semibold bg-orange-500/10 py-1.5 px-2 border border-orange-500/20 rounded-lg mb-3">
        {{ photoState.error }}
      </p>
      <p v-if="photoState.success" class="text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-500/10 py-1.5 px-2 border border-emerald-500/20 rounded-lg mb-3">
        {{ photoState.success }}
      </p>

      <form @submit.prevent="saveDisplayName" class="flex flex-col sm:flex-row sm:items-end gap-3">
        <div class="flex-1">
          <label class="block text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 font-semibold">Nazwa wyświetlana</label>
          <input
            v-model="displayName"
            type="text"
            placeholder="np. Monter Ramen"
            class="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all text-sm"
          />
        </div>
        <button
          type="submit"
          :disabled="profileState.loading"
          class="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black tracking-wider rounded-xl hover:opacity-90 transition-all shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50 uppercase text-xs"
        >
          Zapisz
        </button>
      </form>
      <p v-if="profileState.error" class="text-orange-600 dark:text-orange-400 text-xs font-semibold bg-orange-500/10 py-1.5 px-2 border border-orange-500/20 rounded-lg mt-3">
        {{ profileState.error }}
      </p>
      <p v-if="profileState.success" class="text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-500/10 py-1.5 px-2 border border-emerald-500/20 rounded-lg mt-3">
        {{ profileState.success }}
      </p>
    </section>

    <!-- Login / e-mail -->
    <section class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6">
      <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Mail class="w-4 h-4 text-orange-600 dark:text-orange-400" /> Login (e-mail)
      </h3>
      <form @submit.prevent="saveEmail" class="space-y-3">
        <div>
          <label class="block text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 font-semibold">Nowy adres e-mail</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all text-sm"
          />
        </div>
        <div>
          <label class="block text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 font-semibold">Aktualne hasło (potwierdzenie)</label>
          <input
            v-model="emailPassword"
            type="password"
            required
            placeholder="••••••••"
            class="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all text-sm"
          />
        </div>
        <p v-if="emailState.error" class="text-orange-600 dark:text-orange-400 text-xs font-semibold bg-orange-500/10 py-1.5 px-2 border border-orange-500/20 rounded-lg">
          {{ emailState.error }}
        </p>
        <p v-if="emailState.success" class="text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-500/10 py-1.5 px-2 border border-emerald-500/20 rounded-lg">
          {{ emailState.success }}
        </p>
        <button
          type="submit"
          :disabled="emailState.loading"
          class="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black tracking-wider rounded-xl hover:opacity-90 transition-all shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50 uppercase text-xs"
        >
          Zmień login
        </button>
      </form>
    </section>

    <!-- Hasło -->
    <section class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6">
      <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
        <KeyRound class="w-4 h-4 text-orange-600 dark:text-orange-400" /> Hasło
      </h3>
      <form @submit.prevent="savePassword" class="space-y-3">
        <div>
          <label class="block text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 font-semibold">Aktualne hasło</label>
          <input
            v-model="currentPassword"
            type="password"
            required
            placeholder="••••••••"
            class="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all text-sm"
          />
        </div>
        <div>
          <label class="block text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 font-semibold">Nowe hasło</label>
          <input
            v-model="newPassword"
            type="password"
            required
            placeholder="min. 6 znaków"
            class="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all text-sm"
          />
        </div>
        <div>
          <label class="block text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 font-semibold">Powtórz nowe hasło</label>
          <input
            v-model="confirmPassword"
            type="password"
            required
            placeholder="••••••••"
            class="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all text-sm"
          />
        </div>
        <p v-if="passwordState.error" class="text-orange-600 dark:text-orange-400 text-xs font-semibold bg-orange-500/10 py-1.5 px-2 border border-orange-500/20 rounded-lg">
          {{ passwordState.error }}
        </p>
        <p v-if="passwordState.success" class="text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-500/10 py-1.5 px-2 border border-emerald-500/20 rounded-lg">
          {{ passwordState.success }}
        </p>
        <button
          type="submit"
          :disabled="passwordState.loading"
          class="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black tracking-wider rounded-xl hover:opacity-90 transition-all shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50 uppercase text-xs"
        >
          Zmień hasło
        </button>
      </form>
    </section>

    <!-- Wygląd -->
    <section class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6">
      <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Sun class="w-4 h-4 text-orange-600 dark:text-orange-400" /> Wygląd
      </h3>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">Motyw kolorystyczny</p>
          <p class="text-[11px] text-slate-500">Przełącz między ciemnym i jasnym motywem interfejsu</p>
        </div>
        <button
          @click="themeStore.requestToggleTheme()"
          class="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/30 transition-all cursor-pointer text-xs font-semibold uppercase tracking-wider shrink-0"
        >
          <Moon v-if="themeStore.mode === 'dark'" class="w-4 h-4" />
          <Sun v-else class="w-4 h-4" />
          {{ themeStore.mode === 'dark' ? 'Ciemny' : 'Jasny' }}
        </button>
      </div>

      <div class="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800">
        <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Kolor akcentu</p>
        <p class="text-[11px] text-slate-500 mb-3">Zastępuje pomarańczowy akcent w całej aplikacji — przyciski, aktywne zakładki, podświetlenia.</p>
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="preset in ACCENT_PRESETS"
            :key="preset"
            type="button"
            @click="accentColorStore.setColor(preset)"
            :style="{ backgroundColor: preset }"
            :class="[
              'w-8 h-8 rounded-full border-2 transition-all cursor-pointer',
              accentColorStore.color === preset ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent',
            ]"
            :title="preset"
          />
          <label class="w-8 h-8 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 cursor-pointer relative">
            <input v-model="accentColorInput" type="color" class="absolute -top-1 -left-1 w-10 h-10 cursor-pointer" />
          </label>
          <button
            type="button"
            @click="accentColorStore.resetColor()"
            class="ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors"
          >
            Domyślny
          </button>
        </div>
      </div>

      <div class="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800">
        <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Drugi kolor (gradient przycisków)</p>
        <p class="text-[11px] text-slate-500 mb-3">Zastępuje bursztynowy koniec gradientu na przyciskach — razem z kolorem akcentu tworzy pełne przejście kolorów.</p>
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="preset in SECONDARY_ACCENT_PRESETS"
            :key="preset"
            type="button"
            @click="secondaryAccentColorStore.setColor(preset)"
            :style="{ backgroundColor: preset }"
            :class="[
              'w-8 h-8 rounded-full border-2 transition-all cursor-pointer',
              secondaryAccentColorStore.color === preset ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent',
            ]"
            :title="preset"
          />
          <label class="w-8 h-8 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 cursor-pointer relative">
            <input v-model="secondaryAccentColorInput" type="color" class="absolute -top-1 -left-1 w-10 h-10 cursor-pointer" />
          </label>
          <button
            type="button"
            @click="secondaryAccentColorStore.resetColor()"
            class="ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors"
          >
            Domyślny
          </button>
        </div>
      </div>
    </section>

    <!-- Widoczne zakładki -->
    <section class="bg-white/90 dark:bg-[#0b1220]/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6">
      <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-2">
        <LayoutList class="w-4 h-4 text-orange-600 dark:text-orange-400" /> Widoczne zakładki
      </h3>
      <p class="text-[11px] text-slate-500 mb-4">Wybierz, które zakładki mają być widoczne w menu po lewej.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-2">
        <label
          v-for="item in hideableNavItems"
          :key="item.name"
          class="flex items-center gap-3 px-3.5 py-3 sm:px-3 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/60 cursor-pointer"
        >
          <input
            type="checkbox"
            :checked="navPrefsStore.isVisible(item.name)"
            @change="navPrefsStore.toggleVisible(item.name)"
            class="w-[18px] h-[18px] sm:w-4 sm:h-4 rounded accent-orange-500 shrink-0"
          />
          <component :is="item.icon" class="w-5 h-5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
          <span class="text-sm font-medium sm:font-normal text-slate-700 dark:text-slate-300 truncate">{{ item.label }}</span>
        </label>
      </div>
    </section>
  </div>
</template>
