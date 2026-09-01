<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ArrowLeft, Check, RotateCcw, X } from 'lucide-vue-next'
import { ANIMALS, ANIMAL_TEST_QUESTIONS, computeAnimalResult, type AnimalId } from '@/data/animalTest'

const emit = defineEmits<{
  close: []
  apply: [animalId: AnimalId]
}>()

const currentIndex = ref(0)
const answers = reactive<Record<string, string>>({})
const result = ref<AnimalId | null>(null)
const advancing = ref(false)

const currentQuestion = computed(() => ANIMAL_TEST_QUESTIONS[currentIndex.value])
const isLastQuestion = computed(() => currentIndex.value === ANIMAL_TEST_QUESTIONS.length - 1)
const progress = computed(() => Math.round(((currentIndex.value + 1) / ANIMAL_TEST_QUESTIONS.length) * 100))

function selectOption(optionId: string) {
  if (advancing.value) return
  answers[currentQuestion.value.id] = optionId
  advancing.value = true
  window.setTimeout(() => {
    if (isLastQuestion.value) {
      result.value = computeAnimalResult(answers)
    } else {
      currentIndex.value += 1
    }
    advancing.value = false
  }, 350)
}

function goBack() {
  if (currentIndex.value === 0 || advancing.value) return
  currentIndex.value -= 1
}

function restartTest() {
  currentIndex.value = 0
  result.value = null
  for (const key of Object.keys(answers)) delete answers[key]
}

function closeModal() {
  emit('close')
}

function applyResult() {
  if (!result.value) return
  emit('apply', result.value)
}

const resultProfile = computed(() => (result.value ? ANIMALS[result.value] : null))
</script>

<template>
  <Teleport to="body">
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="closeModal">
    <div class="w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain rounded-3xl bg-white dark:bg-[#0b1220] shadow-2xl border border-slate-200 dark:border-slate-800">
      <div class="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 class="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">
          {{ resultProfile ? 'Twój wynik' : 'Jakim jesteś zwierzęciem?' }}
        </h3>
        <button type="button" @click="closeModal" class="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Ekran wyniku -->
      <div v-if="resultProfile" class="p-4 sm:p-6 text-center">
        <div class="mx-auto w-28 h-28 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center overflow-hidden mb-4">
          <img :src="resultProfile.image" :alt="resultProfile.label" class="w-full h-full object-contain" />
        </div>
        <p class="text-2xl font-black text-slate-900 dark:text-white mb-3">
          {{ resultProfile.emoji }} {{ resultProfile.title }}
        </p>
        <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-left mb-4">
          {{ resultProfile.description }}
        </p>
        <div class="text-left space-y-2 mb-4">
          <p class="text-xs text-slate-700 dark:text-slate-300">
            <span class="font-bold text-emerald-600 dark:text-emerald-400">Twoje mocne strony:</span>
            {{ resultProfile.strengths }}
          </p>
          <p class="text-xs text-slate-700 dark:text-slate-300">
            <span class="font-bold text-orange-600 dark:text-orange-400">Twoja słabsza strona:</span>
            {{ resultProfile.weakness }}
          </p>
        </div>
        <p class="text-sm italic text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-4">
          Twoje leśne motto:<br />
          „{{ resultProfile.motto }}”
        </p>

        <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            @click="restartTest"
            class="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw class="w-3.5 h-3.5" /> Powtórz test
          </button>
          <button
            type="button"
            @click="applyResult"
            class="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black tracking-wider rounded-xl hover:opacity-90 transition-all shadow-lg shadow-orange-500/20 cursor-pointer uppercase text-xs flex items-center gap-1.5"
          >
            <Check class="w-3.5 h-3.5" /> Ustaw jako avatar
          </button>
        </div>
      </div>

      <!-- Ekran pytania -->
      <div v-else class="p-4 sm:p-6">
        <div class="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-1">
          <div class="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all" :style="{ width: `${progress}%` }" />
        </div>
        <p class="text-[10px] text-slate-400 dark:text-slate-500 mb-5">
          Pytanie {{ currentIndex + 1 }} z {{ ANIMAL_TEST_QUESTIONS.length }}
        </p>

        <p class="text-base font-bold text-slate-900 dark:text-white mb-4">{{ currentQuestion.text }}</p>

        <div class="space-y-2">
          <button
            v-for="option in currentQuestion.options"
            :key="option.id"
            type="button"
            @click="selectOption(option.id)"
            :disabled="advancing"
            :class="[
              'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all cursor-pointer disabled:cursor-default',
              answers[currentQuestion.id] === option.id
                ? 'border-orange-500 bg-orange-500/10 text-slate-900 dark:text-white font-semibold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-orange-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/40',
            ]"
          >
            <span class="font-bold mr-1.5 uppercase">{{ option.id }}.</span>{{ option.label }}
          </button>
        </div>

        <p class="mt-4 text-center text-[10px] text-slate-400 dark:text-slate-500">
          Kliknij odpowiedź, aby przejść do {{ isLastQuestion ? 'wyniku' : 'kolejnego pytania' }}.
        </p>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            @click="goBack"
            :disabled="currentIndex === 0 || advancing"
            class="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <ArrowLeft class="w-3.5 h-3.5" /> Wstecz
          </button>
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <X class="w-3.5 h-3.5" /> Anuluj test
          </button>
        </div>
      </div>
    </div>
  </div>
  </Teleport>
</template>
