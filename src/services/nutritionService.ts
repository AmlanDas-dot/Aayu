import { setDoc, addDoc } from "@/firebase/firestoreLogger";
import { db } from "@/firebase/firebase";
import { collection, doc, getDoc, getDocs, query, orderBy, serverTimestamp, where, Timestamp } from "firebase/firestore";
import { sendChatMessage } from "./api";
import { type NutritionMeal } from "@/features/nutrition/types";

export interface NutritionUserProfile {
  uid: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  targetWeight: number;
  activityLevel: string;
  dietPreference: string;
  foodAllergies: string;
  medicalConditions: string[];
  behavioralRecovery: string[];
  primaryGoal: string;
  createdAt: string;
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number; // ml
  updatedAt: string;
}

export interface LoggedMeal {
  id?: string;
  mealType: string;
  foodName: string; // Used as summary or manual entry name
  foods?: Array<{
    name: string;
    portion: string;
    confidence: number;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  }>;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  confidence?: number;
  healthiness: string;
  timestamp: any;
}

export interface WaterLog {
  id?: string;
  amount: number;
  timestamp: any;
}

export const getNutritionUserProfile = async (uid: string): Promise<NutritionUserProfile | null> => {
  try {
    const docRef = doc(db, `users/${uid}/nutrition/profile`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as NutritionUserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching nutrition profile:", error);
    return null;
  }
};

export const getDailyGoals = async (uid: string): Promise<DailyGoals | null> => {
  try {
    const docRef = doc(db, `users/${uid}/nutrition/profile/goals/daily`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as DailyGoals;
    }
    return null;
  } catch (error) {
    console.error("Error fetching daily goals:", error);
    return null;
  }
};

const calculateGoals = (data: Partial<NutritionUserProfile>): DailyGoals => {
  // Simple Mifflin-St Jeor Equation for BMR
  const weight = data.weight || 70;
  const height = data.height || 170;
  const age = data.age || 30;
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  bmr = data.gender === "Female" ? bmr - 161 : bmr + 5;
  
  let multiplier = 1.2;
  if (data.activityLevel === "Lightly Active") multiplier = 1.375;
  if (data.activityLevel === "Moderate") multiplier = 1.55;
  if (data.activityLevel === "Very Active") multiplier = 1.725;
  
  let targetCalories = Math.round(bmr * multiplier);
  if (data.primaryGoal === "Weight Loss") targetCalories -= 500;
  if (data.primaryGoal === "Weight Gain" || data.primaryGoal === "Muscle Gain") targetCalories += 300;

  // Macros (40% carbs, 30% protein, 30% fat generally, tweakable)
  const protein = Math.round((targetCalories * 0.3) / 4);
  const carbs = Math.round((targetCalories * 0.4) / 4);
  const fat = Math.round((targetCalories * 0.3) / 9);
  const water = 2500 + (data.activityLevel === "Very Active" ? 500 : 0);

  return {
    calories: targetCalories,
    protein,
    carbs,
    fat,
    water,
    updatedAt: new Date().toISOString()
  };
};

export const createNutritionProfile = async (uid: string, data: Partial<NutritionUserProfile>): Promise<void> => {
  const profileRef = doc(db, `users/${uid}/nutrition/profile`);
  
  const newProfile: NutritionUserProfile = {
    uid,
    age: data.age || 30,
    gender: data.gender || "Not Specified",
    height: data.height || 170,
    weight: data.weight || 70,
    targetWeight: data.targetWeight || 70,
    activityLevel: data.activityLevel || "Moderate",
    dietPreference: data.dietPreference || "Vegetarian",
    foodAllergies: data.foodAllergies || "None",
    medicalConditions: data.medicalConditions || [],
    behavioralRecovery: data.behavioralRecovery || [],
    primaryGoal: data.primaryGoal || "Healthy Eating",
    createdAt: new Date().toISOString()
  };

  await setDoc(profileRef, newProfile);
  
  const goals = calculateGoals(newProfile);
  await setDoc(doc(db, `users/${uid}/nutrition/profile/goals/daily`), goals);
};

export const logMeal = async (uid: string, meal: Partial<LoggedMeal>) => {
  await addDoc(collection(db, `users/${uid}/nutrition/profile/meals`), {
    ...meal,
    timestamp: serverTimestamp()
  });
};

export const logWater = async (uid: string, amount: number = 250) => {
  await addDoc(collection(db, `users/${uid}/nutrition/profile/waterLogs`), {
    amount,
    timestamp: serverTimestamp()
  });
};

export const getLoggedMeals = async (uid: string): Promise<LoggedMeal[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const q = query(
    collection(db, `users/${uid}/nutrition/profile/meals`), 
    where("timestamp", ">=", Timestamp.fromDate(today)),
    orderBy("timestamp", "asc")
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as LoggedMeal));
};

export const getLoggedWater = async (uid: string): Promise<number> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const q = query(
    collection(db, `users/${uid}/nutrition/profile/waterLogs`), 
    where("timestamp", ">=", Timestamp.fromDate(today))
  );
  
  const snap = await getDocs(q);
  let total = 0;
  snap.docs.forEach(doc => {
    total += doc.data().amount || 0;
  });
  return total;
};

export const generateWeeklyPlan = async (uid: string, profile: NutritionUserProfile, budget: string = 'Standard'): Promise<any> => {
  let meals: NutritionMeal[] = [];
  try {
    const prompt = `Generate a 1-day sample meal plan for a ${profile.age}yo ${profile.gender}, goal: ${profile.primaryGoal}, diet: ${profile.dietPreference}, budget tier: ${budget}.
    Conditions: ${profile.medicalConditions.join(",") || "None"}. Recovery: ${profile.behavioralRecovery.join(",") || "None"}.
    Provide a JSON response with:
    {"meals": [{"meal": "Breakfast", "name": "...", "icon": "...", "price": 50, "note": "..."}]}`;

    const chatRes = await sendChatMessage({ message: prompt, top_k: 1, language: "en" });
    const match = chatRes.response.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.meals) meals = parsed.meals;
    }
  } catch (error) {
    console.error("AI Weekly Plan Generation failed:", error);
    // Fallback
    meals = [
      { meal: "Breakfast", name: "Oats & Fruits", icon: "🥣", price: 40, note: "High fiber" },
      { meal: "Lunch", name: "Dal & Roti", icon: "🍛", price: 80, note: "Protein rich" },
      { meal: "Dinner", name: "Salad & Paneer", icon: "🥗", price: 120, note: "Light dinner" }
    ];
  }

  // Save to weeklyPlans
  const planData = {
    budget,
    meals,
    generatedAt: serverTimestamp()
  };
  await addDoc(collection(db, `users/${uid}/nutrition/profile/weeklyPlans`), planData);

  return meals;
};

export const getLatestWeeklyPlan = async (uid: string): Promise<NutritionMeal[]> => {
  const q = query(
    collection(db, `users/${uid}/nutrition/profile/weeklyPlans`),
    orderBy("generatedAt", "desc")
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return snap.docs[0].data().meals as NutritionMeal[];
  }
  return [];
};

export const analyzeFoodImage = async (file: File): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append("image", file);
    const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
    
    const res = await fetch(`${API_BASE}/nutrition/analyze-food`, {
      method: "POST",
      body: formData,
    });
    
    if (!res.ok) {
      throw new Error(`Failed to analyze food image: ${res.statusText}`);
    }
    
    const data = await res.json();
    return data; // Returns { foods: [], totalCalories: ... }
  } catch (error: any) {
    console.error("Failed to analyze image offline:", error);
    
    // Fallback if backend is not running
    console.warn("Using fallback offline analysis.");
    return {
      foods: [{
        name: "Mock Offline Apple",
        portion: "1 medium",
        confidence: 0.9,
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
        fiber: 4.4
      }],
      totalCalories: 95,
      totalProtein: 1,
      totalCarbs: 25,
      totalFat: 0
    };
  }
};
