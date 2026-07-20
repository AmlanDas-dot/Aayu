import { db } from "@/firebase/firebase";
import { collection, doc, getDoc, getDocs, setDoc, addDoc, query, orderBy, serverTimestamp, where, Timestamp } from "firebase/firestore";
import { sendChatMessage, sendImageChatMessage } from "./api";
import { type NutritionProfile, type NutritionMeal, type NutritionSwap } from "@/features/nutrition/types";

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

export interface LoggedMeal {
  id?: string;
  mealType: string;
  foodName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  healthiness: string;
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
  
  // Initialize some goals
  await setDoc(doc(db, `users/${uid}/nutrition/goals/daily`), {
    calories: 2000,
    protein: 60,
    water: 2500, // ml
    updatedAt: new Date().toISOString()
  });
};

export const generateDailyPlan = async (profile: NutritionUserProfile): Promise<NutritionProfile> => {
  // We'll generate a personalized plan using Gemini
  let meals: NutritionMeal[] = [
    { meal: "Breakfast", name: "Oats & Fruits", icon: "🥣", price: 40, note: "High fiber" },
    { meal: "Lunch", name: "Dal & Roti", icon: "🍛", price: 80, note: "Protein rich" },
    { meal: "Dinner", name: "Salad & Paneer", icon: "🥗", price: 120, note: "Light dinner" }
  ];
  
  let swaps: NutritionSwap[] = [
    { from: { icon: "🍪", name: "Cookies", note: "High sugar" }, to: { icon: "🍎", name: "Apple", note: "Natural sugar & fiber" } }
  ];

  try {
    const prompt = `Generate a 1-day nutrition plan for a ${profile.age}yo ${profile.gender}, goal: ${profile.primaryGoal}, diet: ${profile.dietPreference}.
    Conditions: ${profile.medicalConditions.join(",") || "None"}. Recovery: ${profile.behavioralRecovery.join(",") || "None"}.
    Provide a JSON response with:
    {"meals": [{"meal": "Breakfast", "name": "...", "icon": "...", "price": 50, "note": "..."}], "swaps": [{"from": {"icon": "...", "name": "...", "note": "..."}, "to": {"icon": "...", "name": "...", "note": "..."}}]}`;

    const chatRes = await sendChatMessage({ message: prompt, top_k: 1, language: "en" });
    const match = chatRes.response.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.meals) meals = parsed.meals;
      if (parsed.swaps) swaps = parsed.swaps;
    }
  } catch (error) {
    console.error("AI Generation failed, using fallbacks.", error);
  }

  // Construct and return the full profile matching the UI interface
  return {
    score: 85,
    calories: { val: "1800", max: 2000, pct: 90, remaining: "200" },
    protein: { val: "55", max: 60, pct: 91 },
    iron: { val: "12", max: 15, pct: 80 },
    swaps,
    mealPlan: meals,
    topNutrients: [
      { name: "Vitamin C", current: "60mg", target: "75mg", pct: 80, color: "blue" },
      { name: "Calcium", current: "800mg", target: "1000mg", pct: 80, color: "teal" }
    ],
    tip: `Focus on ${profile.primaryGoal}. Hydrate well!`
  };
};

export const getLoggedMeals = async (uid: string): Promise<LoggedMeal[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const q = query(
    collection(db, `users/${uid}/nutrition/meals`), 
    where("timestamp", ">=", Timestamp.fromDate(today)),
    orderBy("timestamp", "asc")
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as LoggedMeal));
};

export const logMeal = async (uid: string, meal: Partial<LoggedMeal>) => {
  await addDoc(collection(db, `users/${uid}/nutrition/meals`), {
    ...meal,
    timestamp: serverTimestamp()
  });
};

export const analyzeFoodImage = async (file: File): Promise<any> => {
  try {
    const prompt = "Analyze this food image. Return a JSON object with: {'foodName': '...', 'calories': 100, 'protein': 10, 'carbs': 20, 'fat': 5, 'fiber': 2, 'healthiness': 'High|Medium|Low'}";
    const result = await sendImageChatMessage(file, prompt);
    
    // Attempt to extract JSON from answer
    const match = result.answer.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return null;
  } catch (error) {
    console.error("Failed to analyze image:", error);
    throw error;
  }
};
