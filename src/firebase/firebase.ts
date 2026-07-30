import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

import { config } from "../config";

const firebaseConfig = config.firebase;

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
// Enforce session persistence (Phase 6 requirement)
setPersistence(auth, browserSessionPersistence).catch(console.error);
export const db = getFirestore(app);
export const storage = getStorage(app);
