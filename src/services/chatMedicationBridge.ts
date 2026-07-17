import { getMedications } from "./medicationService";

export const buildMedicationContextForChat = async (familyId: string, memberId: string): Promise<string> => {
  try {
    const meds = await getMedications(familyId, memberId);
    
    if (!meds || meds.length === 0) {
      return "The patient is not currently tracking any active medications.";
    }
    
    const activeMeds = meds.filter(m => m.status === 'ACTIVE');
    const pastMeds = meds.filter(m => m.status === 'COMPLETED' || m.status === 'STOPPED');
    
    let context = `MEDICATION HISTORY:\n`;
    
    if (activeMeds.length > 0) {
      context += `Active Medications:\n`;
      activeMeds.forEach(m => {
        context += `- ${m.medicineName} (${m.dosage} ${m.strength || ''}): ${m.frequency}, Times: ${m.specificTimes?.join(', ') || 'N/A'}, Duration: ${m.duration}.\n`;
        if (m.instructions) context += `  Instructions: ${m.instructions}\n`;
        context += `  Adherence: ${m.adherencePercentage}%\n`;
      });
    } else {
      context += `Active Medications: None.\n`;
    }
    
    if (pastMeds.length > 0) {
      context += `\nPast/Stopped Medications:\n`;
      pastMeds.forEach(m => {
        context += `- ${m.medicineName} (Status: ${m.status})\n`;
      });
    }
    
    return context;
  } catch (error) {
    console.error("Failed to build medication context:", error);
    return "Error retrieving medication history.";
  }
};
