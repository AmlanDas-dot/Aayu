import { setDoc, addDoc, updateDoc } from "@/firebase/firestoreLogger";
import { db } from "@/firebase/firebase";
import { collection, doc, getDoc, getDocs, query, orderBy, serverTimestamp, limit, where } from "firebase/firestore";
import { sendChatMessage } from "./api";
import { isDemoSession } from "@/utils/demoMode";

// Types
export interface RecoveryProfile {
  uid: string;
  type: string;
  duration: string;
  frequency: string;
  lastUse: string;
  motivation: string;
  primaryTrigger: string;
  stressLevel: number;
  sleep: string;
  medicalConditions: string;
  supportSystem: string;
  goal: string;
  score: number;
  startDate: string;
  lastRelapse: string | null;
  cravings: number;
  resisted: number;
  relapses: number;
  status: "Not Started" | "Active" | "Relapsed" | "Recovered";
}

export interface RecoveryJournal {
  id?: string;
  entry: string;
  mood: number;
  sentiment: string;
  aiInsight: string;
  riskLevel: string;
  timestamp: string;
}

export interface RecoveryMission {
  id: string;
  text: string;
  category: "Physical" | "Mental" | "Habit";
  completed: boolean;
  date: string;
}

export interface RecoveryHabit {
  id: string;
  label: string;
  days: number;
  lastUpdated: string;
  icon: string;
  bg: string;
}

export const getRecoveryProfile = async (uid: string): Promise<RecoveryProfile | null> => {
  if (isDemoSession()) {
    return {
      uid,
      type: "Tobacco",
      duration: "8 months",
      frequency: "Daily cravings, no recent use",
      lastUse: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      motivation: "Breathe easier and stay present for family.",
      primaryTrigger: "Evening stress",
      stressLevel: 4,
      sleep: "Improving",
      medicalConditions: "Mild asthma",
      supportSystem: "Family and ASHA follow-ups",
      goal: "Stay tobacco-free for 90 days",
      score: 74,
      startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      lastRelapse: null,
      cravings: 3,
      resisted: 18,
      relapses: 1,
      status: "Active",
    };
  }

  try {
    const docRef = doc(db, `users/${uid}/recovery/profile`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as RecoveryProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching recovery profile:", error);
    return null;
  }
};

export const startRecoveryJourney = async (uid: string, data: Partial<RecoveryProfile>): Promise<void> => {
  if (isDemoSession()) return;

  const profileRef = doc(db, `users/${uid}/recovery/profile`);
  
  const initialProfile: RecoveryProfile = {
    uid,
    type: data.type || "Other",
    duration: data.duration || "",
    frequency: data.frequency || "",
    lastUse: data.lastUse || new Date().toISOString(),
    motivation: data.motivation || "",
    primaryTrigger: data.primaryTrigger || "",
    stressLevel: data.stressLevel || 5,
    sleep: data.sleep || "",
    medicalConditions: data.medicalConditions || "",
    supportSystem: data.supportSystem || "",
    goal: data.goal || "",
    score: 10,
    startDate: new Date().toISOString(),
    lastRelapse: null,
    cravings: 0,
    resisted: 0,
    relapses: 0,
    status: "Active"
  };

  await setDoc(profileRef, initialProfile);

  // Generate initial missions
  await generateDailyMissions(uid);
  
  // Generate initial habits
  const habitsRef = collection(db, `users/${uid}/recovery/profile/habits`);
  await setDoc(doc(habitsRef, "habit-1"), { id: "habit-1", label: "Smoke-Free", days: 1, lastUpdated: new Date().toISOString(), icon: "Flame", bg: "#fef2f2" });
  await setDoc(doc(habitsRef, "habit-2"), { id: "habit-2", label: "Hydration", days: 1, lastUpdated: new Date().toISOString(), icon: "Droplets", bg: "#f0f9ff" });
};

export const getRecoveryMissions = async (uid: string): Promise<RecoveryMission[]> => {
  if (isDemoSession()) {
    const today = new Date().toISOString().split('T')[0];
    return [
      { id: `demo-m1-${today}`, text: "Take a 15-minute evening walk", category: "Physical", completed: true, date: today },
      { id: `demo-m2-${today}`, text: "Log one craving trigger", category: "Mental", completed: false, date: today },
      { id: `demo-m3-${today}`, text: "Drink water before tea break", category: "Habit", completed: false, date: today },
    ];
  }

  const today = new Date().toISOString().split('T')[0];
  const q = query(collection(db, `users/${uid}/recovery/profile/missions`), where("date", "==", today));
  const snap = await getDocs(q);
  
  if (snap.empty) {
    await generateDailyMissions(uid);
    return getRecoveryMissions(uid);
  }

  return snap.docs.map(d => d.data() as RecoveryMission);
};

export const generateDailyMissions = async (uid: string) => {
  if (isDemoSession()) return;

  const today = new Date().toISOString().split('T')[0];
  const missionsRef = collection(db, `users/${uid}/recovery/profile/missions`);
  
  const missions: RecoveryMission[] = [
    { id: `m1-${today}`, text: "Drink 2 liters of water", category: "Habit", completed: false, date: today },
    { id: `m2-${today}`, text: "Write a journal entry about your triggers today", category: "Mental", completed: false, date: today },
    { id: `m3-${today}`, text: "Take a 15-minute walk outside", category: "Physical", completed: false, date: today }
  ];

  for (const m of missions) {
    await setDoc(doc(missionsRef, m.id), m);
  }
};

export const toggleMissionStatus = async (uid: string, missionId: string, currentStatus: boolean) => {
  if (isDemoSession()) return;

  const docRef = doc(db, `users/${uid}/recovery/profile/missions/${missionId}`);
  await updateDoc(docRef, { completed: !currentStatus });
};

export const getRecoveryHabits = async (uid: string): Promise<RecoveryHabit[]> => {
  if (isDemoSession()) {
    return [
      { id: "habit-1", label: "Tobacco-free", days: 21, lastUpdated: new Date().toISOString(), icon: "Flame", bg: "#fef2f2" },
      { id: "habit-2", label: "Hydration", days: 12, lastUpdated: new Date().toISOString(), icon: "Droplets", bg: "#f0f9ff" },
      { id: "habit-3", label: "Morning breathing", days: 8, lastUpdated: new Date().toISOString(), icon: "Wind", bg: "#ecfeff" },
    ];
  }

  const snap = await getDocs(collection(db, `users/${uid}/recovery/profile/habits`));
  return snap.docs.map(d => d.data() as RecoveryHabit);
};

export const logJournalAndMood = async (uid: string, mood: number, journal: string): Promise<any> => {
  if (isDemoSession()) {
    return {
      sentiment: mood > 55 ? "positive" : "neutral",
      ai_insight: "Good job naming the trigger. Try replacing the evening cue with a short walk and water.",
      risk_level: mood < 35 ? "Medium" : "Low",
    };
  }

  try {
    // 1. Get AI insight
    let sentiment = "neutral";
    let aiInsight = "Thank you for sharing your thoughts.";
    let riskLevel = "Low";

    try {
      const prompt = `Act as a deeply empathetic and non-judgmental behavioral health AI.
      
      User's Context:
      - Mood Score: ${mood}/100 (where 0 is very bad, 100 is excellent)
      - Journal Entry: "${journal}"
      
      CRITICAL RULES:
      1. Validate their feelings first in your insight.
      2. Keep the insight to a short, encouraging 2 sentences.
      3. Do NOT diagnose or sound clinical.
      4. Respond ONLY with a valid JSON object matching this exact schema:
      {
        "sentiment": "positive" | "neutral" | "negative",
        "insight": "string",
        "riskLevel": "Low" | "Medium" | "High"
      }
      5. Do not include markdown code blocks.`;
      const chatRes = await sendChatMessage({ message: prompt, top_k: 1, language: "en" });
      
      // Parse JSON from chatRes.response
      const match = chatRes.response.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        sentiment = parsed.sentiment || "neutral";
        aiInsight = parsed.insight || aiInsight;
        riskLevel = parsed.riskLevel || "Low";
      }
    } catch (aiErr) {
      console.warn("AI parsing failed, using fallbacks.", aiErr);
    }

    // 2. Save Mood
    await addDoc(collection(db, `users/${uid}/recovery/profile/moods`), {
      score: mood,
      timestamp: serverTimestamp()
    });

    // 3. Save Journal
    const journalData = {
      entry: journal,
      mood,
      sentiment,
      aiInsight,
      riskLevel,
      timestamp: new Date().toISOString()
    };
    await addDoc(collection(db, `users/${uid}/recovery/profile/journals`), journalData);
    
    // 4. Update Profile Score slightly if positive mood
    const profile = await getRecoveryProfile(uid);
    if (profile) {
      const newScore = Math.min(100, profile.score + (mood > 50 ? 2 : 0));
      await updateDoc(doc(db, `users/${uid}/recovery/profile`), { score: newScore });
    }

    return { sentiment, ai_insight: aiInsight, risk_level: riskLevel };
  } catch (error) {
    console.error("Journal log failed:", error);
    throw error;
  }
};

export const logRelapse = async (uid: string) => {
  if (isDemoSession()) return;

  const profile = await getRecoveryProfile(uid);
  if (!profile) return;

  const newScore = Math.max(0, profile.score - 15);
  await updateDoc(doc(db, `users/${uid}/recovery/profile`), {
    score: newScore,
    relapses: profile.relapses + 1,
    lastRelapse: new Date().toISOString(),
    status: "Relapsed"
  });
};

export const getRecoveryTrends = async (uid: string) => {
  if (isDemoSession()) {
    return [
      { day: "Day 1", mood: 52, score: 58 },
      { day: "Day 2", mood: 57, score: 62 },
      { day: "Day 3", mood: 61, score: 66 },
      { day: "Day 4", mood: 68, score: 70 },
      { day: "Day 5", mood: 64, score: 71 },
      { day: "Day 6", mood: 73, score: 74 },
      { day: "Today", mood: 76, score: 76 },
    ];
  }

  const q = query(collection(db, `users/${uid}/recovery/profile/moods`), orderBy("timestamp", "asc"), limit(7));
  const snap = await getDocs(q);
  
  const trends: any[] = [];
  snap.docs.forEach((docSnap, i) => {
    const data = docSnap.data();
    trends.push({
      day: `Day ${i + 1}`,
      mood: data.score,
      score: 50 + (i * 5) // Proxy historical score for demo
    });
  });
  
  return trends;
};

