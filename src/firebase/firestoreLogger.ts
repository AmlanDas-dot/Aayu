import {
  setDoc as fSetDoc,
  addDoc as fAddDoc,
  updateDoc as fUpdateDoc,
  deleteDoc as fDeleteDoc,
  DocumentReference,
  CollectionReference,
  UpdateData,
  WithFieldValue,
  DocumentData,
  SetOptions,
  runTransaction as fRunTransaction,
  writeBatch as fWriteBatch,
  Transaction,
  WriteBatch
} from "firebase/firestore";

import { auth, db } from "./firebase";
import { logAuditEvent, AuditAction, ResourceType } from "@/services/AuditService";

const getResourceTypeFromPath = (path: string): ResourceType => {
  if (path.includes("medicalRecords")) return "MEDICAL_RECORD";
  if (path.includes("users")) return "PATIENT_PROFILE";
  if (path.includes("settings")) return "SYSTEM_SETTING";
  return "UNKNOWN";
};

const logOperation = (operation: string, path: string) => {
  const uid = auth.currentUser?.uid || 'unauthenticated';
  console.log(`[Firestore Write] User: ${uid}, Operation: ${operation}, Path: ${path}`);
  
  // Exclude audit_logs themselves from circular logging
  if (!path.includes("audit_logs")) {
    let action: AuditAction = "ACCESS_WRITE";
    if (operation === "deleteDoc") action = "ACCESS_DELETE";
    
    logAuditEvent(action, getResourceTypeFromPath(path), path, { operation }).catch(e => {
      console.error("Failed to log audit event:", e);
    });
  }
};

export const setDoc = async <AppModelType, DbModelType extends DocumentData>(
  reference: DocumentReference<AppModelType, DbModelType>,
  data: WithFieldValue<AppModelType>,
  options?: SetOptions
): Promise<void> => {
  logOperation("setDoc", reference.path);
  if (options) {
    return fSetDoc(reference, data, options as any);
  }
  return fSetDoc(reference, data);
};

export const addDoc = async <AppModelType, DbModelType extends DocumentData>(
  reference: CollectionReference<AppModelType, DbModelType>,
  data: WithFieldValue<AppModelType>
): Promise<DocumentReference<AppModelType, DbModelType>> => {
  logOperation("addDoc", reference.path);
  return fAddDoc(reference, data);
};

export const updateDoc = async <AppModelType, DbModelType extends DocumentData>(
  reference: DocumentReference<AppModelType, DbModelType>,
  data: UpdateData<DbModelType>
): Promise<void> => {
  logOperation("updateDoc", reference.path);
  return fUpdateDoc(reference, data as any);
};

export const deleteDoc = async <AppModelType, DbModelType extends DocumentData>(
  reference: DocumentReference<AppModelType, DbModelType>
): Promise<void> => {
  logOperation("deleteDoc", reference.path);
  return fDeleteDoc(reference);
};

export const runTransaction = async <T>(
  updateFunction: (transaction: Transaction) => Promise<T>
): Promise<T> => {
  console.log(`[Firestore Write] User: ${auth.currentUser?.uid || 'unauthenticated'}, Operation: runTransaction`);
  return fRunTransaction(db, updateFunction);
};

export const writeBatch = (): WriteBatch => {
  console.log(`[Firestore Write] User: ${auth.currentUser?.uid || 'unauthenticated'}, Operation: writeBatch initialized`);
  return fWriteBatch(db);
};
