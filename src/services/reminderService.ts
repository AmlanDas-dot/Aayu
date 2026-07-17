import { Medication } from "@/firebase/collections";

// Helper to determine the next dose time for a given medication
export const calculateNextDose = (medication: Medication): string | null => {
  if (medication.status !== 'ACTIVE' || !medication.specificTimes || medication.specificTimes.length === 0) {
    return null;
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Sort times just in case
  const sortedTimes = [...medication.specificTimes].sort();
  
  for (const timeStr of sortedTimes) {
    const [h, m] = timeStr.split(':').map(Number);
    if (h > currentHour || (h === currentHour && m > currentMinute)) {
      // Found the next time today
      const nextDate = new Date();
      nextDate.setHours(h, m, 0, 0);
      return nextDate.toISOString();
    }
  }
  
  // If no more times today, the next dose is the first time tomorrow
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
      
      // Simple status estimation for UI (In a real app, this correlates with MedicationLogs for exactly today)
      if (h < currentHour - 1) {
        status = 'MISSED'; // Just a guess without logs
      } else if (h === currentHour || h === currentHour - 1) {
        status = 'PENDING';
      }
      
      // If it was taken today after this scheduled time
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
