import { addDoc, updateDoc, deleteDoc } from "@/firebase/firestoreLogger";
import { collections, Medication, MedicationLog } from "@/firebase/collections";
import { getDocs, doc, query, where, orderBy } from "firebase/firestore";

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

// --- From reminderService ---
export const calculateNextDose = (medication: Medication): string | null => {
  if (medication.status !== 'ACTIVE' || !medication.specificTimes || medication.specificTimes.length === 0) {
    return null;
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  const sortedTimes = [...medication.specificTimes].sort();
  
  for (const timeStr of sortedTimes) {
    const [h, m] = timeStr.split(':').map(Number);
    if (h > currentHour || (h === currentHour && m > currentMinute)) {
      const nextDate = new Date();
      nextDate.setHours(h, m, 0, 0);
      return nextDate.toISOString();
    }
  }
  
  const [firstH, firstM] = sortedTimes[0].split(':').map(Number);
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1);
  nextDate.setHours(firstH, firstM, 0, 0);
  
  return nextDate.toISOString();
};

export interface DailySchedule {
  time: string;
  medication: Medication;
  status: 'PENDING' | 'TAKEN' | 'MISSED' | 'UPCOMING';
}

export const generateTodaySchedule = (medications: Medication[]): DailySchedule[] => {
  const schedule: DailySchedule[] = [];
  const now = new Date();
  const currentHour = now.getHours();
  
  const activeMeds = medications.filter(m => m.status === 'ACTIVE');
  
  for (const med of activeMeds) {
    for (const time of (med.specificTimes || [])) {
      const [h] = time.split(':').map(Number);
      
      let status: 'PENDING' | 'TAKEN' | 'MISSED' | 'UPCOMING' = 'UPCOMING';
      
      if (h < currentHour - 1) {
        status = 'MISSED';
      } else if (h === currentHour || h === currentHour - 1) {
        status = 'PENDING';
      }
      
      if (med.lastTaken) {
        const lastTakenDate = new Date(med.lastTaken);
        if (lastTakenDate.toDateString() === now.toDateString() && lastTakenDate.getHours() >= h) {
          status = 'TAKEN';
        }
      }
      
      schedule.push({ time, medication: med, status });
    }
  }
  
  return schedule.sort((a, b) => a.time.localeCompare(b.time));
};

// --- From adherenceService ---
export const logMedicationDose = async (log: Omit<MedicationLog, "id">, currentMedication: Medication): Promise<string> => {
  try {
    const docRef = await addDoc(collections.medicationLogs, log);
    
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

