import { updateDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { UserProfile, Settings } from "@/firebase/collections";

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, data);
};

export const updateUserPreferences = async (uid: string, data: Partial<Settings>) => {
  const settingsRef = doc(db, "settings", uid);
  // Using setDoc with merge to create it if it doesn't exist yet
  await setDoc(settingsRef, data, { merge: true });
};
