import { useState, useEffect } from "react";
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
import { getNutritionProfile } from "../services/api";

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