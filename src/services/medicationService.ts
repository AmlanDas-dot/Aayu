import { collections, Medication } from "@/firebase/collections";
import { addDoc, getDocs, doc, query, where, orderBy, updateDoc, deleteDoc } from "firebase/firestore";

export const getMedications = async (familyId: string, memberId?: string): Promise<Medication[]> => {
  try {
    let q = query(
      collections.medications,
      where("familyId", "==", familyId),
      orderBy("createdAt", "desc")
    );
    
    if (memberId && memberId !== 'all') {
      q = query(
        collections.medications,
        where("familyId", "==", familyId),
        where("memberId", "==", memberId),
        orderBy("createdAt", "desc")
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Medication));
  } catch (error) {
    console.error("Failed to fetch medications:", error);
    throw error;
  }
};

export const createMedication = async (medication: Omit<Medication, "id">): Promise<string> => {
  try {
    const docRef = await addDoc(collections.medications, medication);
    return docRef.id;
  } catch (error) {
    console.error("Failed to create medication:", error);
    throw error;
  }
};

export const updateMedication = async (medicationId: string, updates: Partial<Medication>): Promise<void> => {
  try {
    const docRef = doc(collections.medications, medicationId);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Failed to update medication:", error);
    throw error;
  }
};

export const deleteMedication = async (medicationId: string): Promise<void> => {
  try {
    const docRef = doc(collections.medications, medicationId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Failed to delete medication:", error);
    throw error;
  }
};
