import nutritionData from "../data/nutrition.json";

export interface FoodNutrition {
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving_size: string;
  rich_in: string[];
  good_for: string[];
  avoid_if: string[];
}

const foods: FoodNutrition[] = nutritionData as FoodNutrition[];

/** Search by name (exact then substring). */
export function getFoodNutrition(foodName: string): FoodNutrition | undefined {
  if (!foodName) return undefined;
  const target = foodName.toLowerCase().trim();
  let match = foods.find((f) => f.name.toLowerCase() === target);
  if (match) return match;
  return foods.find(
    (f) =>
      f.name.toLowerCase().includes(target) ||
      target.includes(f.name.toLowerCase())
  );
}

/** All foods for a given category. */
export function getFoodsByCategory(category: string): FoodNutrition[] {
  if (!category) return [];
  const target = category.toLowerCase().trim();
  return foods.filter((f) => f.category.toLowerCase() === target);
}

/** All food items. */
export function getAllFoods(): FoodNutrition[] {
  return foods;
}

/** High-protein foods (≥5g), sorted descending. */
export function suggestHighProteinFoods(): FoodNutrition[] {
  return foods
    .filter((f) => f.protein >= 5)
    .sort((a, b) => b.protein - a.protein);
}

/** Low-calorie foods (≤100 kcal), sorted ascending. */
export function suggestLowCalorieFoods(): FoodNutrition[] {
  return foods
    .filter((f) => f.calories <= 100)
    .sort((a, b) => a.calories - b.calories);
}

/** Weight-loss friendly foods — high fibre, low calorie. */
export function suggestWeightLossFoods(): FoodNutrition[] {
  return foods
    .filter(
      (f) =>
        f.fiber >= 1.5 &&
        f.calories <= 120 &&
        !f.good_for.map((c) => c.toLowerCase()).includes("weight gain")
    )
    .sort((a, b) => b.fiber - a.fiber);
}

/** Weight-gain foods — high calorie and protein. */
export function suggestWeightGainFoods(): FoodNutrition[] {
  return foods
    .filter((f) => f.calories >= 110 && (f.protein >= 2.5 || f.fat >= 3))
    .sort((a, b) => b.calories - a.calories);
}

/**
 * Find foods beneficial for a health condition or nutrient need.
 * e.g., "anemia", "diabetes", "vitamin C", "calcium"
 */
export function getFoodsForCondition(condition: string): FoodNutrition[] {
  if (!condition) return [];
  const target = condition.toLowerCase().trim();
  return foods.filter((f) => {
    const matchesGoodFor = f.good_for.some((v) => v.toLowerCase().includes(target));
    const matchesRichIn = f.rich_in.some((v) => v.toLowerCase().includes(target));
    const matchesCategory = f.category.toLowerCase().includes(target);
    const shouldAvoid = f.avoid_if.some((v) => v.toLowerCase().includes(target));
    return (matchesGoodFor || matchesRichIn || matchesCategory) && !shouldAvoid;
  });
}
