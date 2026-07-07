export const NUTRITION_PROFILES = {
  default: {
    score: 72,
    calories: { val: "1,650", max: 2000, pct: 82, remaining: "350 kcal" },
    protein: { val: "56", max: 60, pct: 69 },
    iron: { val: "12", max: 18, pct: 71 },
    swaps: [
      { from: { icon: "🍟", name: "Chips", note: "(High in fat)" }, to: { icon: "🌽", name: "Roasted Chana", note: "(Rich in protein & fibre)" } },
      { from: { icon: "🧃", name: "Sugary Drinks", note: "(High sugar)" }, to: { icon: "🥛", name: "Buttermilk", note: "(Good for gut & hydration)" } },
      { from: { icon: "🥬", name: "Leafy Greens", note: "Dairy" }, to: { icon: "🌽", name: "Roasted Chana", note: "Rich in protein & fibre" } },
    ],
    mealPlan: [
      { meal: "Breakfast", name: "Poha + Milk", icon: "🍚", price: 20, note: "Energy-rich start" },
      { meal: "Mid-Morning", name: "Guava", icon: "🍈", price: 10, note: "Rich in Vitamin C" },
      { meal: "Lunch", name: "Rice + Dal + Seasonal Salad", icon: "🥗", price: 35, note: "Balanced & filling" },
      { meal: "Evening Snack", name: "Roasted Chana + Banana", icon: "🍌", price: 15, note: "Keeps you active" },
      { meal: "Dinner", name: "2 Rotis + Mixed Vegetables", icon: "🫓", price: 20, note: "Light & nutritious" },
    ],
    topNutrients: [
      { name: "Protein", current: "51g", target: "60g", pct: 85, color: "#0d9488" },
      { name: "Iron", current: "10mg", target: "18mg", pct: 55, color: "#f59e0b" },
      { name: "Calcium", current: "450mg", target: "1000mg", pct: 45, color: "#3b82f6" },
      { name: "Fibre", current: "14g", target: "25g", pct: 56, color: "#10b981" },
    ],
    tip: "💡 Eat more iron-rich foods like leafy greens, dates and millets."
  },
  pregnant: {
    score: 65,
    calories: { val: "2,100", max: 2500, pct: 84, remaining: "400 kcal" },
    protein: { val: "68", max: 75, pct: 90 },
    iron: { val: "15", max: 27, pct: 55 },
    swaps: [
      { from: { icon: "☕", name: "Tea/Coffee with meals", note: "(Blocks iron)" }, to: { icon: "🍋", name: "Lemon Water", note: "(Boosts iron absorption)" } },
      { from: { icon: "🍚", name: "White Rice", note: "(Low nutrient)" }, to: { icon: "🌾", name: "Ragi/Millets", note: "(High Calcium & Iron)" } },
    ],
    mealPlan: [
      { meal: "Breakfast", name: "Ragi Dosa + Egg", icon: "🥞", price: 25, note: "High protein & calcium" },
      { meal: "Mid-Morning", name: "Amla + Dates", icon: "🫐", price: 15, note: "Iron + Vitamin C combo" },
      { meal: "Lunch", name: "Rice + Spinach Dal", icon: "🍛", price: 40, note: "Folic acid rich" },
      { meal: "Evening Snack", name: "Sprouted Moong Salad", icon: "🥗", price: 15, note: "Easy to digest" },
      { meal: "Dinner", name: "Rotis + Paneer/Soybean", icon: "🫓", price: 30, note: "Protein rich" },
    ],
    topNutrients: [
      { name: "Protein", current: "68g", target: "75g", pct: 90, color: "#0d9488" },
      { name: "Iron", current: "15mg", target: "27mg", pct: 55, color: "#ef4444" },
      { name: "Calcium", current: "800mg", target: "1000mg", pct: 80, color: "#3b82f6" },
      { name: "Folic Acid", current: "400mcg", target: "600mcg", pct: 66, color: "#10b981" },
    ],
    tip: "💡 Iron is crucial right now! Pair your iron supplements with vitamin C (like lemon juice) and avoid tea/coffee with meals."
  },
  child: {
    score: 80,
    calories: { val: "1,200", max: 1400, pct: 85, remaining: "200 kcal" },
    protein: { val: "30", max: 35, pct: 85 },
    iron: { val: "8", max: 10, pct: 80 },
    swaps: [
      { from: { icon: "🍬", name: "Candies/Chocolates", note: "(Empty calories)" }, to: { icon: "🥜", name: "Peanut Chikki", note: "(Protein & Iron rich)" } },
      { from: { icon: "🍞", name: "White Bread", note: "(Low fibre)" }, to: { icon: "🌾", name: "Dalia/Oats", note: "(Complex carbs)" } },
    ],
    mealPlan: [
      { meal: "Breakfast", name: "Milk + Upma", icon: "🥣", price: 20, note: "Energy for the day" },
      { meal: "Mid-Morning", name: "Apple/Banana", icon: "🍎", price: 10, note: "Natural sugars" },
      { meal: "Lunch", name: "Khichdi + Curd", icon: "🍛", price: 25, note: "Easy to digest" },
      { meal: "Evening Snack", name: "Boiled Egg/Chana", icon: "🥚", price: 10, note: "Muscle growth" },
      { meal: "Dinner", name: "Roti + Dal + Veggies", icon: "🫓", price: 25, note: "Balanced nutrition" },
    ],
    topNutrients: [
      { name: "Protein", current: "30g", target: "35g", pct: 85, color: "#0d9488" },
      { name: "Iron", current: "8mg", target: "10mg", pct: 80, color: "#f59e0b" },
      { name: "Calcium", current: "500mg", target: "600mg", pct: 83, color: "#3b82f6" },
      { name: "Vitamin A", current: "300mcg", target: "400mcg", pct: 75, color: "#10b981" },
    ],
    tip: "💡 Growing kids need protein and calcium. Ensure 2 servings of dairy/eggs/pulses daily!"
  }
};
