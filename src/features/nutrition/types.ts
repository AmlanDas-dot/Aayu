export interface NutritionSwapItem {
  icon: string;
  name: string;
  note: string;
}

export interface NutritionSwap {
  from: NutritionSwapItem;
  to: NutritionSwapItem;
}

export interface NutritionMeal {
  meal: string;
  name: string;
  icon: string;
  price: number;
  note: string;
}

export interface NutritionNutrient {
  name: string;
  current: string;
  target: string;
  pct: number;
  color: string;
}

export interface NutritionProfile {
  score: number;
  calories: { val: string; max: number; pct: number; remaining: string };
  protein: { val: string; max: number; pct: number };
  iron: { val: string; max: number; pct: number };
  swaps: NutritionSwap[];
  mealPlan: NutritionMeal[];
  topNutrients: NutritionNutrient[];
  tip: string;
}
