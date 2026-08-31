import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth'
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

export interface ShoppingItem {
  id: string
  productId?: string
  name: string
  quantity: number
  unit: string
  aisle: string
  store: string
  price: number
  photoUrl?: string
  checked: boolean
}

export interface Aisle {
  name: string
  items: ShoppingItem[]
}

export interface ShoppingList {
  id: string
  name: string
  store: string
  status: 'active' | 'archived'
  aisles: Aisle[]
}

export const useShoppingListsStore = defineStore('shoppingLists', () => {
  const lists = ref<ShoppingList[]>([])
  const loading = ref(false)
  const error = ref('')
  let unsubscribe: Unsubscribe | null = null

  function watch() {
    unsubscribe?.()
    lists.value = []
    error.value = ''
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    const q = query(
      collection(db, 'users', authStore.user.uid, 'lists'),
      orderBy('createdAt', 'desc'),
    )
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        lists.value = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ShoppingList, 'id'>) }))
        loading.value = false
      },
      (err) => {
        loading.value = false
        error.value = err.message
        console.error('[shoppingLists] błąd nasłuchu Firestore:', err)
      },
    )
  }

  function stopWatching() {
    unsubscribe?.()
    unsubscribe = null
  }

  function listDocRef(listId: string) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    return doc(db, 'users', authStore.user.uid, 'lists', listId)
  }

  async function createList(name: string, store: string) {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('Brak zalogowanego użytkownika')
    const ref = await addDoc(collection(db, 'users', authStore.user.uid, 'lists'), {
      name,
      store,
      status: 'active' as const,
      aisles: [] as Aisle[],
      createdAt: serverTimestamp(),
    })
    return ref.id
  }

  async function deleteList(listId: string) {
    await deleteDoc(listDocRef(listId))
  }

  async function saveAisles(listId: string, aisles: Aisle[]) {
    await updateDoc(listDocRef(listId), { aisles })
  }

  function addItem(
    list: ShoppingList,
    item: Omit<ShoppingItem, 'id' | 'quantity' | 'checked'>,
    quantity = 1,
  ) {
    const aisles = list.aisles.map((a) => ({ ...a, items: [...a.items] }))
    const matches = (i: ShoppingItem) => (item.productId ? i.productId === item.productId : i.name === item.name)

    for (const aisle of aisles) {
      const existing = aisle.items.find(matches)
      if (existing) {
        existing.quantity += quantity
        return saveAisles(list.id, aisles)
      }
    }

    const aisleName = item.aisle || 'Bez alejki'
    let target = aisles.find((a) => a.name === aisleName)
    if (!target) {
      target = { name: aisleName, items: [] }
      aisles.push(target)
    }
    target.items.push({ ...item, id: crypto.randomUUID(), quantity, checked: false })
    return saveAisles(list.id, aisles)
  }

  function toggleItem(list: ShoppingList, itemId: string) {
    const aisles = list.aisles.map((a) => ({
      ...a,
      items: a.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)),
    }))
    return saveAisles(list.id, aisles)
  }

  function setItemQuantity(list: ShoppingList, itemId: string, quantity: number) {
    const aisles = list.aisles.map((a) => ({
      ...a,
      items: a.items.map((i) => (i.id === itemId ? { ...i, quantity: Math.max(1, quantity) } : i)),
    }))
    return saveAisles(list.id, aisles)
  }

  function removeItem(list: ShoppingList, itemId: string) {
    const aisles = list.aisles.map((a) => ({ ...a, items: a.items.filter((i) => i.id !== itemId) }))
    return saveAisles(list.id, aisles)
  }

  return {
    lists,
    loading,
    error,
    watch,
    stopWatching,
    createList,
    deleteList,
    addItem,
    toggleItem,
    setItemQuantity,
    removeItem,
  }
})
