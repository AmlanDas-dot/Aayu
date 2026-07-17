import { collections, MedicationLog, Medication } from "@/firebase/collections";
import { addDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { updateMedication } from "./medicationService";

export const logMedicationDose = async (log: Omit<MedicationLog, "id">, currentMedication: Medication): Promise<string> => {
  try {
    const docRef = await addDoc(collections.medicationLogs, log);
    
    // Calculate new adherence percentage (simple calculation based on total expected vs taken)
    // For MVP, we can just update the lastTaken and maybe increment a counter, or we can fetch logs and recalculate.
    // We will do a simple fetch all logs for this medication and calculate.
    
    const q = query(
      collections.medicationLogs,
      where("medicationId", "==", log.medicationId)
    );
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(d => d.data() as MedicationLog);
    
    const totalDoses = logs.length;
    const takenDoses = logs.filter(l => l.status === 'TAKEN').length;
    const adherence = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;
    
    await updateMedication(log.medicationId, {
      lastTaken: log.status === 'TAKEN' ? log.takenAt : currentMedication.lastTaken,
      adherencePercentage: adherence,
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Failed to log medication dose:", error);
    throw error;
  }
};

export const getMedicationLogs = async (memberId: string, startDate?: string, endDate?: string): Promise<MedicationLog[]> => {
  try {
    // Basic query for MVP. For time ranges we need compound indexes in Firestore.
    const q = query(
      collections.medicationLogs,
      where("memberId", "==", memberId),
      orderBy("takenAt", "desc")
    );
    const snapshot = await getDocs(q);
    let logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicationLog));
    
    if (startDate) {
      logs = logs.filter(l => l.takenAt >= startDate);
    }
    if (endDate) {
      logs = logs.filter(l => l.takenAt <= endDate);
    }
    
    return logs;
  } catch (error) {
    console.error("Failed to fetch medication logs:", error);
    throw error;
  }
};
