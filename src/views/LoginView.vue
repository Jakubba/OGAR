<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { Volume2, VolumeX } from 'lucide-vue-next'

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const isLoading = ref(false)

// Stan animacji intro i dźwięku
const showIntro = ref(true)
const videoRef = ref<HTMLVideoElement | null>(null)
const isMuted = ref(false)
const needsUserInteraction = ref(false)

const authStore = useAuthStore()
const router = useRouter()

// Próba odtworzenia wideo z dźwiękiem po załadowaniu
onMounted(() => {
  if (videoRef.value) {
    // Próbujemy wyłączyć wyciszenie i odtworzyć
    videoRef.value.muted = false
    
    videoRef.value.play().then(() => {
      isMuted.value = false
    }).catch(() => {
      // Jeśli przeglądarka zablokuje autoplay z dźwiękiem,
      // odtwarzamy wyciszone wideo i prosimy o kliknięcie
      needsUserInteraction.value = true
      isMuted.value = true
      if (videoRef.value) {
        videoRef.value.muted = true
        videoRef.value.play()
      }
    })
  }
})

// Włączenie dźwięku po kliknięciu przez użytkownika
const enableSound = () => {
  if (videoRef.value) {
    videoRef.value.muted = false
    videoRef.value.play()
    isMuted.value = false
    needsUserInteraction.value = false
  }
}

const finishIntro = () => {
  showIntro.value = false
}

const handleLogin = async () => {
  try {
    errorMsg.value = ''
    isLoading.value = true
    await authStore.login(email.value, password.value)
    router.push('/')
  } catch (err: any) {
    errorMsg.value = 'Niepoprawny email lub hasło.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="h-screen h-[100dvh] w-screen overflow-hidden bg-slate-100 dark:bg-[#070b14] flex items-center justify-center font-sans relative">
    
    <Transition name="fade">
      <div 
        v-if="showIntro" 
        class="fixed inset-0 z-50 h-full w-full bg-black flex items-center justify-center overflow-hidden"
      >
        <video 
          ref="videoRef"
          src="/intro.mp4" 
          autoplay 
          muted
          playsinline
          @ended="finishIntro"
          class="h-full w-full object-cover object-center"
        ></video>

        <button 
          v-if="needsUserInteraction"
          @click="enableSound"
          class="absolute top-6 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-orange-500/90 hover:bg-orange-500 text-black font-bold border border-orange-400 rounded-xl text-xs uppercase tracking-wider backdrop-blur-md transition-all cursor-pointer shadow-lg shadow-orange-500/30 flex items-center gap-2 animate-bounce z-20"
        >
          <VolumeX class="w-4 h-4" /> Kliknij, aby włączyć dźwięk
        </button>

        <button 
          v-else
          @click="isMuted = !isMuted; if (videoRef) videoRef.muted = isMuted"
          class="absolute bottom-6 left-6 p-3 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl backdrop-blur-md transition-all cursor-pointer shadow-lg z-10"
        >
          <Volume2 v-if="!isMuted" class="w-4 h-4 text-orange-400" />
          <VolumeX v-else class="w-4 h-4 text-slate-500" />
        </button>

        <button 
          @click="finishIntro"
          class="absolute bottom-6 right-6 px-4 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl text-xs uppercase tracking-widest font-semibold backdrop-blur-md transition-all cursor-pointer shadow-lg z-10"
        >
          Pomiń Intro ➔
        </button>
      </div>
    </Transition>

    <Transition name="slide-up" appear>
      <div 
        v-if="!showIntro" 
        class="w-full max-w-md p-8 bg-white/90 dark:bg-[#0b1220]/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl relative z-10 mx-4"
      >
        <div class="absolute -top-20 -left-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="text-center mb-6 relative z-10">
          <img 
            src="/logo-1.png" 
            alt="OGAR Logo" 
            class="w-50 h-50 object-contain mx-auto mb-3 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]"
            />
          <h1 class="text-xl font-black tracking-wider text-slate-900 dark:text-white">
            OGAR <span class="text-orange-500">DASHBOARD</span>
          </h1>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-widest font-semibold">System Autoryzacji</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4 relative z-10">
          <div>
            <label class="block text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 font-semibold">Email</label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all text-sm"
              placeholder="admin@ogar.io"
            />
          </div>

          <div>
            <label class="block text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 font-semibold">Hasło</label>
            <input
              v-model="password"
              type="password"
              required
              class="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all text-sm"
              placeholder="••••••••"
            />
          </div>

          <p v-if="errorMsg" class="text-orange-600 dark:text-orange-400 text-xs font-semibold text-center bg-orange-500/10 py-1.5 border border-orange-500/20 rounded-lg">
            {{ errorMsg }}
          </p>

          <button 
            type="submit" 
            :disabled="isLoading"
            class="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black tracking-wider rounded-xl hover:opacity-90 transition-all shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50 uppercase text-xs mt-2"
          >
            {{ isLoading ? 'Uwierzytelnianie...' : 'Zaloguj do systemu' }}
          </button>
        </form>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.fade-leave-active {
  transition: opacity 0.8s ease;
}
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.96);
}
</style>
