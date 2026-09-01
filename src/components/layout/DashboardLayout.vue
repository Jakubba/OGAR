<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useRouter } from 'vue-router'
import { Search, Settings, Bell, User, LogOut, ChevronDown, Moon, Sun, Menu, X } from 'lucide-vue-next'
import AppSidebar from './AppSidebar.vue'
import MobileBottomNav from './MobileBottomNav.vue'

const sidebarOpen = ref(false)

const authStore = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()

const mobileSearchOpen = ref(false)
const mobileSearchQuery = ref('')
const mobileSearchInput = ref<HTMLInputElement | null>(null)

const openMobileSearch = async () => {
  mobileSearchOpen.value = true
  await nextTick()
  mobileSearchInput.value?.focus()
}

const closeMobileSearch = () => {
  mobileSearchOpen.value = false
  mobileSearchQuery.value = ''
}

watch(
  () => router.currentRoute.value.fullPath,
  () => {
    sidebarOpen.value = false
    closeMobileSearch()
  },
)

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const goToSettings = () => router.push({ name: 'settings' })

const showUserMenu = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const onClickOutside = (event: MouseEvent) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    showUserMenu.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div class="flex h-screen bg-slate-100 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
    <div class="fixed top-0 left-1/4 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />
    <div class="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

    <div
      v-if="sidebarOpen"
      @click="sidebarOpen = false"
      class="fixed inset-0 bg-black/50 z-30 lg:hidden"
    />

    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <main class="flex-1 min-w-0 overflow-y-auto relative z-10 flex flex-col">
      <header
        class="h-16 lg:h-20 border-b border-slate-200/70 dark:border-slate-800/60 bg-white/70 dark:bg-[#070b14]/60 backdrop-blur-md px-3 sm:px-5 lg:px-8 flex items-center justify-between gap-2 sm:gap-3 sticky top-0 z-30 shrink-0"
      >
        <button
          @click="sidebarOpen = true"
          class="hidden p-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/30 transition-all cursor-pointer shrink-0"
          title="Otwórz menu"
        >
          <Menu class="w-4 h-4" />
        </button>

        <div class="relative w-full max-w-md hidden sm:block">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Szukaj w dashboardzie..."
            class="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-all"
          />
        </div>

        <button
          v-if="!mobileSearchOpen"
          @click="openMobileSearch"
          class="p-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/30 transition-all cursor-pointer sm:hidden shrink-0"
          title="Szukaj"
        >
          <Search class="w-4 h-4" />
        </button>

        <div v-else class="relative flex-1 min-w-0 sm:hidden">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input
            ref="mobileSearchInput"
            v-model="mobileSearchQuery"
            type="text"
            placeholder="Szukaj w dashboardzie..."
            class="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-all"
            @keyup.escape="closeMobileSearch"
          />
          <button
            @click="closeMobileSearch"
            title="Zamknij wyszukiwanie"
            class="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 rounded-lg transition-colors cursor-pointer"
          >
            <X class="w-[18px] h-[18px]" />
          </button>
        </div>

        <div v-if="!mobileSearchOpen" class="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-auto">
          <button
            @click="goToSettings"
            class="p-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/30 transition-all cursor-pointer hidden sm:inline-flex"
            title="Ustawienia"
          >
            <Settings class="w-4 h-4" />
          </button>

          <button
            class="p-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/30 transition-all cursor-pointer relative hidden sm:inline-flex"
            title="Powiadomienia"
          >
            <Bell class="w-4 h-4" />
            <span
              class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-orange-500 text-black text-[10px] font-bold rounded-full"
            >
              2
            </span>
          </button>

          <div ref="userMenuRef" class="relative flex items-center gap-2 sm:pl-2 sm:border-l border-slate-200 dark:border-slate-800">
            <button
              @click="showUserMenu = !showUserMenu"
              class="flex items-center gap-2 cursor-pointer"
            >
              <div class="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-600 dark:text-orange-400 overflow-hidden shrink-0">
                <img
                  v-if="authStore.user?.photoURL"
                  :src="authStore.user.photoURL"
                  alt="Zdjęcie profilowe"
                  class="w-full h-full object-cover"
                />
                <User v-else class="w-4 h-4" />
              </div>
              <div class="text-left hidden md:block">
                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  {{ authStore.user?.email ?? 'Monter Ramen' }}
                </p>
                <p class="text-[10px] text-slate-500">Local user</p>
              </div>
              <ChevronDown class="w-3.5 h-3.5 text-slate-500 ml-1 hidden md:block" />
            </button>
            <button
              @click="handleLogout"
              title="Wyloguj się"
              class="ml-1 p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer hidden sm:inline-flex"
            >
              <LogOut class="w-3.5 h-3.5" />
            </button>

            <div
              v-if="showUserMenu"
              class="absolute top-full right-0 mt-2 w-64 sm:w-56 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/40 py-1.5 z-50"
            >
              <button
                @click="showUserMenu = false; goToSettings()"
                class="w-full flex items-center gap-3 sm:gap-2.5 px-4 py-3 sm:px-3.5 sm:py-2.5 text-sm sm:text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <Settings class="w-5 h-5 sm:w-3.5 sm:h-3.5" /> Ustawienia profilu
              </button>
              <button
                @click="showUserMenu = false; themeStore.requestToggleTheme()"
                class="w-full flex items-center gap-3 sm:gap-2.5 px-4 py-3 sm:px-3.5 sm:py-2.5 text-sm sm:text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <Moon v-if="themeStore.mode === 'dark'" class="w-5 h-5 sm:w-3.5 sm:h-3.5" />
                <Sun v-else class="w-5 h-5 sm:w-3.5 sm:h-3.5" />
                Motyw: {{ themeStore.mode === 'dark' ? 'Ciemny' : 'Jasny' }}
              </button>
              <div class="my-1 border-t border-slate-200 dark:border-slate-800" />
              <button
                @click="showUserMenu = false; handleLogout()"
                class="w-full flex items-center gap-3 sm:gap-2.5 px-4 py-3 sm:px-3.5 sm:py-2.5 text-sm sm:text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut class="w-5 h-5 sm:w-3.5 sm:h-3.5" /> Wyloguj się
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <RouterView />
      </div>
    </main>

    <MobileBottomNav @open-menu="sidebarOpen = true" />
  </div>
</template>
