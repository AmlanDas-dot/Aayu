import { 
  NutritionHero, 
  NutritionSnapshot, 
  SwapRecommendations, 
  MealPlanGrid, 
  NutritionCharts, 
  FoodCarousel, 
  NutritionSideWidgets, 
  FooterBanner 
} from "../components/Nutrition/NutritionComponents";

export function NutritionPage() {
  return (
    <div className="nutrition-page">
      <div className="nutrition-layout">
        <main className="nutrition-main">
          <NutritionHero />
          <NutritionSnapshot />
          <SwapRecommendations />
          <MealPlanGrid />
          <NutritionCharts />
          <FoodCarousel />
          <FooterBanner />
        </main>
        
        <NutritionSideWidgets />
      </div>
    </div>
  );
}

export default NutritionPage;