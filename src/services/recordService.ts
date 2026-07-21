import { setDoc, addDoc, updateDoc, deleteDoc } from "@/firebase/firestoreLogger";
import { db } from "@/firebase/firebase";
import { collection, doc, getDocs, getDoc, query, where } from "firebase/firestore";
import { MedicalRecord } from "@/firebase/collections";

const RECORDS_COLLECTION = "medicalRecords";

export const generateRecordId = () => {
  return doc(collection(db, RECORDS_COLLECTION)).id;
};

export const createMedicalRecord = async (record: Omit<MedicalRecord, "id">, explicitId?: string): Promise<string> => {
  const docRef = explicitId ? doc(db, RECORDS_COLLECTION, explicitId) : doc(collection(db, RECORDS_COLLECTION));
  await setDoc(docRef, { ...record, id: docRef.id });
  return docRef.id;
};

export const getMedicalRecords = async (familyId: string, memberId?: string): Promise<MedicalRecord[]> => {
  let q;
  if (memberId) {
    q = query(
      collection(db, RECORDS_COLLECTION),
      where("familyId", "==", familyId),
      where("memberId", "==", memberId)
    );
  } else {
    q = query(
      collection(db, RECORDS_COLLECTION),
      where("familyId", "==", familyId)
    );
  }
  
  // Note: Ordering might require a composite index in Firestore.
  // We'll sort locally to prevent index requirement errors during initial dev.
  const snapshot = await getDocs(q);
  const records = snapshot.docs.map(doc => doc.data() as MedicalRecord);
  
  return records.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
};

export const getMedicalRecordById = async (id: string): Promise<MedicalRecord | null> => {
  const docRef = doc(db, RECORDS_COLLECTION, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return snapshot.data() as MedicalRecord;
};

export const deleteMedicalRecord = async (id: string): Promise<void> => {
  const docRef = doc(db, RECORDS_COLLECTION, id);
  await deleteDoc(docRef);
};

export const updateMedicalRecord = async (id: string, updates: Partial<MedicalRecord>): Promise<void> => {
  const docRef = doc(db, RECORDS_COLLECTION, id);
  await updateDoc(docRef, updates);
};

export const checkDuplicateRecord = async (familyId: string, memberId: string, fileName: string, fileType: string): Promise<MedicalRecord | null> => {
  const q = query(
    collection(db, RECORDS_COLLECTION),
    where("familyId", "==", familyId),
    where("memberId", "==", memberId)
  );
  
  const snapshot = await getDocs(q);
  for (const doc of snapshot.docs) {
    const data = doc.data() as MedicalRecord;
    // We try to match by exact file name (url contains name), or other metadata.
    // In our new schema we don't have file object, we have fileURL, title, fileType.
    if (data.title === fileName && data.fileType === fileType) {
      return data;
    }
  }
  return null;
};

