import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth/web-extension";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDO3iQwvUnS4W3_F4zr2Uq9oVTgNvtAHak",
  authDomain: "ogar-39a7f.firebaseapp.com",
  projectId: "ogar-39a7f",
  storageBucket: "ogar-39a7f.firebasestorage.app",
  messagingSenderId: "235622934421",
  appId: "1:235622934421:web:0181c753724510f67b389c",
  measurementId: "G-DJEDLZYTKS"

};

const app = initializeApp(firebaseConfig)

export const analytics = getAnalytics(app)
export const auth = getAuth(app)
export const storage = getStorage(app)
export const db = getFirestore(app)