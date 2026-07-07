import { useState } from "react";
import { NutritionHero } from "@/features/nutrition/components/NutritionHero";
import { NutritionSnapshot } from "@/features/nutrition/components/NutritionSnapshot";
import { SwapRecommendations } from "@/features/nutrition/components/SwapRecommendations";
import { MealPlanGrid } from "@/features/nutrition/components/MealPlanGrid";
import { NutritionCharts } from "@/features/nutrition/components/NutritionCharts";
import { FoodCarousel } from "@/features/nutrition/components/FoodCarousel";
import { NutritionSideWidgets } from "@/features/nutrition/components/NutritionSideWidgets";
import { FooterBanner } from "@/features/nutrition/components/FooterBanner";
import { NUTRITION_PROFILES } from "@/features/nutrition/components/NutritionProfiles";

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