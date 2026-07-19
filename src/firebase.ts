import { getApp, getApps, initializeApp } from "firebase/app"
import { GoogleAuthProvider, getAuth } from "firebase/auth"

const firebaseEnv = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
} as const

const missingEnvKeys = Object.entries(firebaseEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missingEnvKeys.length > 0) {
  throw new Error(
    `Missing Firebase env vars: ${missingEnvKeys.join(", ")}. Create a .env.local file from .env.example.`,
  )
}

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseEnv)

export const firebaseAuth = getAuth(firebaseApp)
export const googleAuthProvider = new GoogleAuthProvider()
