import { useState, useEffect } from "react";
import { NutritionHero } from "@/features/nutrition/components/NutritionHero";
import { NutritionSnapshot } from "@/features/nutrition/components/NutritionSnapshot";
import { SwapRecommendations } from "@/features/nutrition/components/SwapRecommendations";
import { MealPlanGrid } from "@/features/nutrition/components/MealPlanGrid";
import { NutritionCharts } from "@/features/nutrition/components/NutritionCharts";
import { FoodCarousel } from "@/features/nutrition/components/FoodCarousel";
import { NutritionSideWidgets } from "@/features/nutrition/components/NutritionSideWidgets";
import { FooterBanner } from "@/features/nutrition/components/FooterBanner";
import { getNutritionProfile } from "@/services/api";

export function NutritionPage() {
  const [profileType, setProfileType] = useState<"default" | "pregnant" | "child">("default");
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const data = await getNutritionProfile(profileType);
        if (active) setProfileData(data);
      } catch (e) {
        console.error("Failed to load nutrition profile:", e);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProfile();
    return () => { active = false; };
  }, [profileType]);

  return (
    <div className="nutrition-page">
      <div className="nutrition-layout">
        <main className="nutrition-main">
          <NutritionHero />
          
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              Loading nutrition profile...
            </div>
          ) : profileData ? (
            <>
              <NutritionSnapshot profile={profileData} />
              <SwapRecommendations profile={profileData} />
              <MealPlanGrid profile={profileData} />
              <NutritionCharts profile={profileData} />
            </>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
              Failed to load profile data from the server.
            </div>
          )}

          <FoodCarousel />
          <FooterBanner />
        </main>
        
        <NutritionSideWidgets profileType={profileType} setProfileType={setProfileType} />
      </div>
    </div>
  );
}

export default NutritionPage;