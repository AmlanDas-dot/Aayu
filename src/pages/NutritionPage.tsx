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
  getDailyGoals,
  getLoggedMeals,
  getLoggedWater,
  getLatestWeeklyPlan,
  generateWeeklyPlan,
  type NutritionUserProfile 
} from "@/services/nutritionService";
import { type NutritionProfile, type NutritionSwap } from "@/features/nutrition/types";


export function NutritionPage() {
  const { currentUser } = useAuth();
  const { selectedMember } = useHealthContext();
  
  const [profileType, setProfileType] = useState<"default" | "pregnant" | "child">("default");
  
  const [userNutriProfile, setUserNutriProfile] = useState<NutritionUserProfile | null>(null);
  const [dailyPlan, setDailyPlan] = useState<NutritionProfile | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!currentUser?.uid) return;
      const uid = currentUser.uid;
      let fetchedProfile = await getNutritionUserProfile(uid);
      
      // Auto-create defaults if none exists
      if (!fetchedProfile) {
        await createNutritionProfile(uid, {});
        fetchedProfile = await getNutritionUserProfile(uid);
      }
      
      if (fetchedProfile) {
        setUserNutriProfile(fetchedProfile);
        
        // Fetch all components for dynamic computation
        const goals = await getDailyGoals(uid);
        const meals = await getLoggedMeals(uid);
        const water = await getLoggedWater(uid);
        let weeklyMeals = await getLatestWeeklyPlan(uid);
        
        if (!weeklyMeals || weeklyMeals.length === 0) {
          weeklyMeals = await generateWeeklyPlan(uid, fetchedProfile);
        }
        
        if (goals) {
          // Compute totals
          let totalCals = 0;
          let totalProt = 0;
          let totalCarbs = 0;
          let totalFat = 0;
          
          meals.forEach(m => {
            totalCals += m.calories || 0;
            totalProt += m.protein || 0;
            totalCarbs += m.carbs || 0;
            totalFat += m.fat || 0;
          });
          
          const calPct = Math.min(100, Math.round((totalCals / goals.calories) * 100)) || 0;
          const protPct = Math.min(100, Math.round((totalProt / goals.protein) * 100)) || 0;
          
          // Dummy logic for Iron
          const totalIron = 10; 
          const targetIron = 18;
          const ironPct = Math.round((totalIron / targetIron) * 100);
          
          // Calculate arbitrary dynamic score based on adherence
          const score = Math.max(0, 100 - Math.abs(100 - calPct));
          
          const swaps: NutritionSwap[] = [
             { from: { icon: "🍪", name: "Cookies", note: "High sugar" }, to: { icon: "🍎", name: "Apple", note: "Natural sugar & fiber" } }
          ];

          const plan: NutritionProfile = {
            score,
            calories: { val: totalCals.toString(), max: goals.calories, pct: calPct, remaining: Math.max(0, goals.calories - totalCals).toString() },
            protein: { val: totalProt.toString(), max: goals.protein, pct: protPct },
            iron: { val: totalIron.toString(), max: targetIron, pct: ironPct },
            swaps,
            mealPlan: weeklyMeals,
            topNutrients: [
              { name: "Carbs", current: `${totalCarbs}g`, target: `${goals.carbs}g`, pct: Math.min(100, Math.round((totalCarbs / goals.carbs) * 100)), color: "blue" },
              { name: "Fat", current: `${totalFat}g`, target: `${goals.fat}g`, pct: Math.min(100, Math.round((totalFat / goals.fat) * 100)), color: "red" },
              { name: "Water", current: `${water}ml`, target: `${goals.water}ml`, pct: Math.min(100, Math.round((water / goals.water) * 100)), color: "teal" }
            ],
            tip: `Focus on ${fetchedProfile.primaryGoal}. You've had ${water}ml of water!`
          };
          
          setDailyPlan(plan);
        }
      }
    } catch (e) {
      console.error("Failed to load nutrition profile:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleStartOnboarding = () => setShowOnboarding(true);

  const handleCompleteOnboarding = async (formData: any) => {
    if (!currentUser?.uid) return;
    await createNutritionProfile(currentUser.uid, formData);
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
              Failed to load profile.
              <br/><br/>
              <button onClick={handleStartOnboarding} style={{ padding: '8px 16px', background: '#0d9488', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Set Up Profile</button>
            </div>
          )}

          {!showOnboarding && userNutriProfile && <FoodCarousel />}
          <FooterBanner />
        </main>
        
        <NutritionSideWidgets profileType={profileType} setProfileType={setProfileType} onBudgetChange={() => fetchData()} />
      </div>
    </div>
  );
}

export default NutritionPage;