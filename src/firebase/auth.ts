import { setDoc, updateDoc, deleteDoc } from "./firestoreLogger";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendEmailVerification,
  deleteUser as firebaseDeleteUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { auth, db, storage } from "./firebase";
import {
  DEFAULT_ROLE,
  DEFAULT_USER_STATUS,
  normalizeSignupRole,
  normalizeStatus,
  SignupUserRole,
  UserStatus,
} from "@/rbac/permissions";


const googleProvider = new GoogleAuthProvider();

export const handleUserAuth = async (
  user: User,
  selectedRole: SignupUserRole = DEFAULT_ROLE,
  selectedStatus: UserStatus = DEFAULT_USER_STATUS
) => {
  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);

  const now = new Date().toISOString();
  const role = normalizeSignupRole(selectedRole);
  const status = normalizeStatus(selectedStatus);

  if (!docSnap.exists()) {
    // First time login
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName || "New User",
      email: user.email || "",
      role,
      status,
      photoURL: user.photoURL || null,
      language: "en", // Default
      createdAt: now,
      lastLogin: now,
      onboardingCompleted: false,
    });
  } else {
    // Returning user
    const profile = docSnap.data();
    await updateDoc(userRef, {
      lastLogin: now,
      ...(profile.role ? {} : { role: DEFAULT_ROLE }),
      ...(profile.status ? {} : { status: DEFAULT_USER_STATUS }),
    });
  }
};

export const loginWithGoogle = async (
  selectedRole: SignupUserRole = DEFAULT_ROLE,
  selectedStatus: UserStatus = DEFAULT_USER_STATUS
) => {
  const result = await signInWithPopup(auth, googleProvider);
  await handleUserAuth(result.user, selectedRole, selectedStatus);
  return result;
};

export const signupWithEmail = async (
  email: string,
  pass: string,
  name: string,
  selectedRole: SignupUserRole = DEFAULT_ROLE,
  selectedStatus: UserStatus = DEFAULT_USER_STATUS
) => {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  
  // Set display name locally (optional, but handled in handleUserAuth usually)
  const userRef = doc(db, "users", result.user.uid);
  const now = new Date().toISOString();
  const role = normalizeSignupRole(selectedRole);
  const status = normalizeStatus(selectedStatus);
  await setDoc(userRef, {
    uid: result.user.uid,
    name,
    email,
    role,
    status,
    photoURL: null,
    language: "en",
    createdAt: now,
    lastLogin: now,
    onboardingCompleted: false,
  });
  return result;
};

export const loginWithEmail = async (email: string, pass: string) => {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  await handleUserAuth(result.user);
  return result;
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

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

export const deleteAccount = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user.");

  const uid = user.uid;

  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (e: any) {
      console.error("Error setting up reCAPTCHA", e);
  }

  try {
    const avatarRef = ref(storage, `users/${uid}/profile/avatar`);
    await deleteObject(avatarRef);
  } catch (e: any) {
    console.warn("Avatar might not exist or error deleting avatar:", e);
  }

  await firebaseDeleteUser(user);
};

