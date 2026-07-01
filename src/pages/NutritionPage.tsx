import { useState } from "react";
import { 
  NutritionHero, 
  NutritionSnapshot, 
  SwapRecommendations, 
  MealPlanGrid, 
  NutritionCharts, 
  FoodCarousel, 
  NutritionSideWidgets, 
  FooterBanner,
  NutritionProfileFinder,
  NUTRITION_PROFILES
} from "../components/Nutrition/NutritionComponents";

export function NutritionPage() {
  const [profileType, setProfileType] = useState<"default" | "pregnant" | "child">("default");
  const profileData = NUTRITION_PROFILES[profileType];

  return (
    <div className="nutrition-page">
      <div className="nutrition-layout">
        <main className="nutrition-main">
          <NutritionHero />
          <NutritionSnapshot profile={profileData} />
          <SwapRecommendations profile={profileData} />
          <MealPlanGrid profile={profileData} />
          <NutritionCharts profile={profileData} />
          <FoodCarousel />
          <FooterBanner />
        </main>
        
        <NutritionSideWidgets profileType={profileType} setProfileType={setProfileType} />
      </div>
    </div>
  );
}

export default NutritionPage;