import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'

export interface Product {
  id: string
  name: string
  store: string
  aisle: string
  category: string
  price: number
  photoUrl?: string
}

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref('')
  let unsubscribe: Unsubscribe | null = null

  function watch() {
    unsubscribe?.()
    products.value = []
    error.value = ''
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    const q = query(
      collection(db, 'users', authStore.user.uid, 'products'),
      orderBy('createdAt', 'desc'),
    )
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        products.value = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }))
        loading.value = false
      },
      (err) => {
        loading.value = false
        error.value = err.message
        console.error('[products] błąd nasłuchu Firestore:', err)
      },
    )
  }

  function stopWatching() {
    unsubscribe?.()
    unsubscribe = null
  }

  async function addProduct(data: Omit<Product, 'id'>) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    const ref = await addDoc(collection(db, 'users', authStore.user.uid, 'products'), {
      ...data,
      createdAt: serverTimestamp(),
    })
    return ref.id
  }

  async function removeProduct(id: string) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    await deleteDoc(doc(db, 'users', authStore.user.uid, 'products', id))
  }

  async function importProducts(items: Omit<Product, 'id'>[]) {
    for (const item of items) {
      await addProduct(item)
    }
  }

  return { products, loading, error, watch, stopWatching, addProduct, removeProduct, importProducts }
})
