import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

export const FIREBASE_NODE_PATH = "smartmanhole/nodes";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
};

const isConfigured = Object.values(firebaseConfig).every(Boolean);

export const firebaseReady = isConfigured;

export const database = isConfigured
  ? getDatabase(initializeApp(firebaseConfig))
  : null;
