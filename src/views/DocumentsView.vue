<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch as vueWatch } from 'vue'
import { AlertTriangle, FileText, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useDocumentsStore, type DocumentRecord } from '@/stores/documents'
import { DOCUMENT_TYPES, daysUntil, documentUrgency, formatDaysLabel } from '@/lib/documents'

const authStore = useAuthStore()
const documentsStore = useDocumentsStore()

vueWatch(
  () => authStore.user?.uid,
  () => documentsStore.watch(),
  { immediate: true },
)
onUnmounted(() => documentsStore.stopWatching())

const showForm = ref(false)
const editingId = ref<string | null>(null)
const formError = ref('')
const saving = ref(false)

const form = reactive({
  name: '',
  type: DOCUMENT_TYPES[0] as string,
  expiresAt: '',
  reminderDays: 30,
  note: '',
})

function resetForm() {
  form.name = ''
  form.type = DOCUMENT_TYPES[0]
  form.expiresAt = ''
  form.reminderDays = 30
  form.note = ''
  formError.value = ''
  editingId.value = null
}

function openAddForm() {
  resetForm()
  showForm.value = true
}

function openEditForm(doc: DocumentRecord) {
  editingId.value = doc.id
  form.name = doc.name
  form.type = doc.type
  form.expiresAt = doc.expiresAt
  form.reminderDays = doc.reminderDays
  form.note = doc.note ?? ''
  formError.value = ''
  showForm.value = true
}

async function saveDocument() {
  if (saving.value) return
  if (!form.name.trim()) {
    formError.value = 'Podaj nazwę dokumentu.'
    return
  }
  if (!form.expiresAt) {
    formError.value = 'Podaj datę ważności.'
    return
  }
  formError.value = ''
  saving.value = true
  try {
    const data = {
      name: form.name.trim(),
      type: form.type,
      expiresAt: form.expiresAt,
      reminderDays: form.reminderDays,
      ...(form.note.trim() ? { note: form.note.trim() } : {}),
    }
    if (editingId.value) {
      await documentsStore.updateDocumentRecord(editingId.value, data)
    } else {
      await documentsStore.addDocumentRecord(data)
    }
    resetForm()
    showForm.value = false
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Nie udało się zapisać dokumentu.'
  } finally {
    saving.value = false
  }
}

function deleteDocument(doc: DocumentRecord) {
  if (!window.confirm(`Usunąć „${doc.name}”?`)) return
  documentsStore.deleteDocumentRecord(doc.id).catch((err) => {
    formError.value = err instanceof Error ? err.message : 'Nie udało się usunąć dokumentu.'
  })
}

const urgencyStyles: Record<string, string> = {
  expired: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
  urgent: 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400',
  ok: 'bg-slate-100 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800/60 text-slate-500 dark:text-slate-400',
}

const sortedDocuments = computed(() => documentsStore.documents)
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl">
    <div class="flex items-center gap-3">
      <FileText class="w-7 h-7 text-orange-600 dark:text-orange-400" />
      <div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-wide uppercase">Dokumenty</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">Terminy ważności OC, AC, przeglądów i innych dokumentów</p>
      </div>
    </div>

    <div v-if="documentsStore.alerts.length" class="bg-white/90 dark:bg-[#0b1220]/80 border border-orange-500/30 rounded-2xl p-4 sm:p-5 space-y-2">
      <h3 class="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide flex items-center gap-2 mb-3">
        <AlertTriangle class="w-4 h-4" /> Wymaga uwagi
      </h3>
      <div
        v-for="doc in documentsStore.alerts"
        :key="doc.id"
        :class="['flex items-center justify-between gap-3 px-3 py-2 rounded-xl border text-sm', urgencyStyles[documentUrgency(doc.expiresAt, doc.reminderDays)]]"
      >
        <span class="font-semibold min-w-0 truncate">{{ doc.name }}</span>
        <span class="text-xs font-bold shrink-0">{{ formatDaysLabel(daysUntil(doc.expiresAt)) }}</span>
      </div>
    </div>

    <div class="bg-white/90 dark:bg-[#0b1220]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Wszystkie dokumenty</h3>
        <button
          type="button"
          @click="openAddForm"
          class="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 text-black hover:bg-orange-400 transition-colors w-full sm:w-auto"
        >
          <Plus class="w-3.5 h-3.5" /> Dodaj dokument
        </button>
      </div>

      <div v-if="showForm" class="mb-5 p-4 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="sm:col-span-2">
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Nazwa</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="np. OC - Toyota Corolla"
            class="mt-1 w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          />
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Typ</label>
          <select v-model="form.type" class="mt-1 w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none">
            <option v-for="t in DOCUMENT_TYPES" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Data ważności</label>
          <input
            v-model="form.expiresAt"
            type="date"
            class="mt-1 w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          />
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Przypomnij ile dni wcześniej</label>
          <input
            v-model.number="form.reminderDays"
            type="number"
            min="1"
            max="180"
            class="mt-1 w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          />
        </div>
        <div>
          <label class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Notatka (opcjonalnie)</label>
          <input
            v-model="form.note"
            type="text"
            placeholder="np. numer polisy"
            class="mt-1 w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          />
        </div>
        <p v-if="formError" class="sm:col-span-2 text-xs text-red-500">{{ formError }}</p>
        <div class="sm:col-span-2 flex flex-wrap items-center gap-2">
          <button type="button" @click="saveDocument" :disabled="saving" class="px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500 text-black hover:bg-orange-400 transition-colors disabled:opacity-50">
            {{ editingId ? 'Zapisz zmiany' : 'Dodaj' }}
          </button>
          <button type="button" @click="showForm = false; resetForm()" class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            Anuluj
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="doc in sortedDocuments"
          :key="doc.id"
          :class="['rounded-xl border p-4 flex flex-col gap-2', urgencyStyles[documentUrgency(doc.expiresAt, doc.reminderDays)]]"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{{ doc.name }}</h4>
              <p class="text-[10px] uppercase tracking-wide opacity-80 truncate">{{ doc.type }}</p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button type="button" @click="openEditForm(doc)" class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors" title="Edytuj">
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button type="button" @click="deleteDocument(doc)" class="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors" title="Usuń">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p class="text-xs font-semibold">{{ formatDaysLabel(daysUntil(doc.expiresAt)) }}</p>
          <p class="text-[10px] opacity-70">Ważny do {{ doc.expiresAt }}</p>
          <p v-if="doc.note" class="text-xs opacity-80 mt-1 break-words">{{ doc.note }}</p>
        </div>

        <div v-if="!sortedDocuments.length" class="sm:col-span-2 lg:col-span-3 text-center py-10 text-sm text-slate-500">
          Nie masz jeszcze żadnych dokumentów — dodaj pierwszy powyżej.
        </div>
      </div>
    </div>
  </div>
</template>
