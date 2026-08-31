import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth'
import { documentUrgency, type DocumentType } from '@/lib/documents'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'

export interface DocumentRecord {
  id: string
  name: string
  type: DocumentType | string
  expiresAt: string
  reminderDays: number
  note?: string
}

export const useDocumentsStore = defineStore('documents', () => {
  const documents = ref<DocumentRecord[]>([])
  const loading = ref(false)
  const error = ref('')
  let unsubscribe: Unsubscribe | null = null

  function watch() {
    unsubscribe?.()
    documents.value = []
    error.value = ''
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    const q = query(
      collection(db, 'users', authStore.user.uid, 'documents'),
      orderBy('expiresAt', 'asc'),
    )
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        documents.value = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DocumentRecord, 'id'>) }))
        loading.value = false
      },
      (err) => {
        loading.value = false
        error.value = err.message
        console.error('[documents] błąd nasłuchu Firestore:', err)
      },
    )
  }

  function stopWatching() {
    unsubscribe?.()
    unsubscribe = null
  }

  async function addDocumentRecord(data: Omit<DocumentRecord, 'id'>) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    await addDoc(collection(db, 'users', authStore.user.uid, 'documents'), {
      ...data,
      createdAt: serverTimestamp(),
    })
  }

  async function updateDocumentRecord(id: string, patch: Partial<Omit<DocumentRecord, 'id'>>) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    await updateDoc(doc(db, 'users', authStore.user.uid, 'documents', id), patch)
  }

  async function deleteDocumentRecord(id: string) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    await deleteDoc(doc(db, 'users', authStore.user.uid, 'documents', id))
  }

  const alerts = computed(() =>
    documents.value
      .filter((d) => documentUrgency(d.expiresAt, d.reminderDays) !== 'ok')
      .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt)),
  )

  return {
    documents,
    loading,
    error,
    watch,
    stopWatching,
    addDocumentRecord,
    updateDocumentRecord,
    deleteDocumentRecord,
    alerts,
  }
})
