import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendEmailVerification,
  deleteUser as firebaseDeleteUser,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth, db, storage } from "@/firebase/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";

export const reauthenticate = async (currentPassword: string) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("No authenticated user with an email found.");

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
};

export const changePassword = async (newPassword: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user.");

  await updatePassword(user, newPassword);
};

export const verifyEmail = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user.");

  await sendEmailVerification(user);
};

export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

export const deleteAccount = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user.");

  const uid = user.uid;

  // 1. Delete user profile doc from Firestore
  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (err) {
    console.error("Error deleting user doc:", err);
  }

  // 2. Delete avatar from Storage (if it exists)
  try {
    const avatarRef = ref(storage, `users/${uid}/profile/avatar`);
    await deleteObject(avatarRef);
  } catch (err) {
    console.warn("Avatar might not exist or error deleting avatar:", err);
  }

  // 3. Delete auth user
  await firebaseDeleteUser(user);
};
