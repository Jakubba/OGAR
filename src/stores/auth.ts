import { defineStore } from 'pinia'
import { ref, triggerRef } from 'vue'
import { auth, storage } from '@/lib/firebase'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from 'firebase/auth'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)

  let resolveReady: () => void
  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve
  })

  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
    loading.value = false
    resolveReady()
  })

  async function login(email: string, pass: string) {
    await signInWithEmailAndPassword(auth, email, pass)
  }

  async function logout() {
    await signOut(auth)
  }

  async function reauthenticate(currentPassword: string) {
    if (!user.value?.email) throw new Error('Brak zalogowanego użytkownika')
    const credential = EmailAuthProvider.credential(user.value.email, currentPassword)
    await reauthenticateWithCredential(user.value, credential)
  }

  async function changeDisplayName(displayName: string) {
    if (!user.value) throw new Error('Brak zalogowanego użytkownika')
    await updateProfile(user.value, { displayName })
    triggerRef(user)
  }

  async function changeEmail(newEmail: string, currentPassword: string) {
    if (!user.value) throw new Error('Brak zalogowanego użytkownika')
    await reauthenticate(currentPassword)
    await updateEmail(user.value, newEmail)
    triggerRef(user)
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    if (!user.value) throw new Error('Brak zalogowanego użytkownika')
    await reauthenticate(currentPassword)
    await updatePassword(user.value, newPassword)
  }

  async function changePhoto(file: File) {
    if (!user.value) throw new Error('Brak zalogowanego użytkownika')
    const avatarRef = storageRef(storage, `avatars/${user.value.uid}`)
    await uploadBytes(avatarRef, file)
    const photoURL = await getDownloadURL(avatarRef)
    await updateProfile(user.value, { photoURL })
    triggerRef(user)
    return photoURL
  }

  async function setPhotoFromUrl(photoURL: string) {
    if (!user.value) throw new Error('Brak zalogowanego użytkownika')
    await updateProfile(user.value, { photoURL })
    triggerRef(user)
  }

  async function resetPhoto() {
    if (!user.value) throw new Error('Brak zalogowanego użytkownika')
    await updateProfile(user.value, { photoURL: null })
    triggerRef(user)
  }

  return {
    user,
    loading,
    ready,
    login,
    logout,
    changeDisplayName,
    changeEmail,
    changePassword,
    changePhoto,
    setPhotoFromUrl,
    resetPhoto,
  }
})