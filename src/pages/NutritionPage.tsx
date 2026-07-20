import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthContext } from "@/hooks/useHealthContext";
import { NutritionHero } from "@/features/nutrition/components/NutritionHero";
import { NutritionSnapshot } from "@/features/nutrition/components/NutritionSnapshot";
import { SwapRecommendations } from "@/features/nutrition/components/SwapRecommendations";
import { MealPlanGrid } from "@/features/nutrition/components/MealPlanGrid";
import { NutritionCharts } from "@/features/nutrition/components/NutritionCharts";
import { FoodCarousel } from "@/features/nutrition/components/FoodCarousel";
import { NutritionSideWidgets } from "@/features/nutrition/components/NutritionSideWidgets";
import { FooterBanner } from "@/features/nutrition/components/FooterBanner";
import { NutritionOnboarding } from "@/features/nutrition/components/NutritionOnboarding";
import { NutritionLogWidget } from "@/features/nutrition/components/NutritionLogWidget";

import { 
  getNutritionUserProfile, 
  createNutritionProfile, 
  generateDailyPlan, 
  type NutritionUserProfile 
} from "@/services/nutritionService";
import { type NutritionProfile } from "@/features/nutrition/types";
import { Apple } from "lucide-react";

export function NutritionPage() {
  const { userProfile } = useAuth();
  const { selectedMember } = useHealthContext();
  
  const [profileType, setProfileType] = useState<"default" | "pregnant" | "child">("default");
  
  const [userNutriProfile, setUserNutriProfile] = useState<NutritionUserProfile | null>(null);
  const [dailyPlan, setDailyPlan] = useState<NutritionProfile | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const uid = userProfile?.uid || 'demo-user';
      const fetchedProfile = await getNutritionUserProfile(uid);
      
      if (fetchedProfile) {
        setUserNutriProfile(fetchedProfile);
        const plan = await generateDailyPlan(fetchedProfile);
        setDailyPlan(plan);
      } else {
        setUserNutriProfile(null);
      }
    } catch (e) {
      console.error("Failed to load nutrition profile:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  const handleStartOnboarding = () => setShowOnboarding(true);

  const handleCompleteOnboarding = async (formData: any) => {
    await createNutritionProfile(userProfile?.uid || 'demo-user', formData);
    setShowOnboarding(false);
    fetchData();
  };

  return (
    <div className="nutrition-page">
      <div className="nutrition-layout">
        <main className="nutrition-main">
          {selectedMember ? (
            <div style={{ padding: '16px 24px', background: '#e0f2fe', color: '#0369a1', fontWeight: 600, borderBottom: '1px solid #bae6fd' }}>
              Nutrition Recommendations for {selectedMember.name}
            </div>
          ) : (
             <div style={{ padding: '16px 24px', background: '#fef9c3', color: '#854d0e', fontWeight: 600, borderBottom: '1px solid #fef08a' }}>
              Viewing General Household Nutrition (Select a member in Family for personalized plans)
            </div>
          )}
          
          <NutritionHero />
          
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              Loading AI Nutrition Assistant...
            </div>
          ) : !userNutriProfile && !showOnboarding ? (
            <div style={{ padding: '40px', background: '#f8fafc', margin: '24px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <Apple size={48} color="#0d9488" style={{ margin: '0 auto 16px auto' }} />
              <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '24px' }}>Let's build your nutrition profile</h2>
              <p style={{ margin: '0 0 24px 0', color: '#64748b' }}>Personalized meal plans, AI tracking, and health integration await.</p>
              <button onClick={handleStartOnboarding} style={{ padding: '12px 24px', background: '#0d9488', color: 'white', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                Start Nutrition Onboarding
              </button>
            </div>
          ) : showOnboarding ? (
            <NutritionOnboarding onComplete={handleCompleteOnboarding} onCancel={() => setShowOnboarding(false)} />
          ) : userNutriProfile && dailyPlan ? (
            <>
              <NutritionSnapshot profile={dailyPlan} />
              <SwapRecommendations profile={dailyPlan} />
              <MealPlanGrid profile={dailyPlan} />
              <NutritionCharts profile={dailyPlan} />
              <NutritionLogWidget onLog={fetchData} />
            </>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
              Failed to generate plan.
            </div>
          )}

          {!showOnboarding && userNutriProfile && <FoodCarousel />}
          <FooterBanner />
        </main>
        
        <NutritionSideWidgets profileType={profileType} setProfileType={setProfileType} />
      </div>
    </div>
  );
}

export default NutritionPage;