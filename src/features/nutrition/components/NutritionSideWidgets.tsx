import { useState } from 'react';
import { NutritionProfileFinder } from "./NutritionProfileFinder";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { generateWeeklyPlan, getNutritionUserProfile } from '@/services/nutritionService';
import { Loader2 } from 'lucide-react';

const COMMUNITY_INSIGHTS = [
  { condition: "Anemia", prevalence: "High prevalence", pct: 42, color: "#ef4444", trend: "↑" },
  { condition: "Protein Deficiency", prevalence: "Nationwide risk intake", pct: 33, color: "#f59e0b", trend: "↓" },
  { condition: "Undernutrition in Children", prevalence: "Under 5 Years", pct: 28, color: "#0d9488", trend: "↓" },
];

export function NutritionSideWidgets({ 
  profileType, 
  setProfileType,
  onBudgetChange
}: { 
  profileType: "default" | "pregnant" | "child", 
  setProfileType: (t: "default" | "pregnant" | "child") => void,
  onBudgetChange?: () => void
}) {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [loadingBudget, setLoadingBudget] = useState<string | null>(null);

  const handleBudgetChange = async (budget: string) => {
    if (!currentUser) {
      addToast("Please log in to change budget settings.", "error");
      return;
    }
    setLoadingBudget(budget);
    try {
      const profile = await getNutritionUserProfile(currentUser.uid);
      if (profile) {
        await generateWeeklyPlan(currentUser.uid, profile, budget);
        addToast(`Generated new meal plan for ${budget} budget!`, "success");
        if (onBudgetChange) onBudgetChange();
      }
    } catch (error) {
      console.error(error);
      addToast("Failed to regenerate meal plan.", "error");
    } finally {
      setLoadingBudget(null);
    }
  };

  return (
    <aside className="nutrition-rail">
      <NutritionProfileFinder profileType={profileType} setProfileType={setProfileType} />
      
      {/* Budget Planner */}
      <div className="rail-card">
        <h3 className="rail-title">Weekly Budget Planner</h3>
        <p className="rail-sub">Regenerate meal plans based on your budget tier</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          {['Low Cost', 'Standard', 'Premium'].map((budget) => (
             <button 
                key={budget}
                onClick={() => handleBudgetChange(budget)}
                disabled={loadingBudget !== null}
                style={{ 
                  padding: '10px', 
                  background: loadingBudget === budget ? '#e2e8f0' : '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: loadingBudget !== null ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}
             >
                {loadingBudget === budget && <Loader2 size={16} className="animate-spin" />}
                {budget} Tier
             </button>
          ))}
        </div>
      </div>

      <div className="rail-card">
        <h3 className="rail-title">Community Insights</h3>
        <p className="rail-sub">(Local data)</p>
        {COMMUNITY_INSIGHTS.map((ci) => (
          <div key={ci.condition} className="community-insight-item">
            <span className="ci-icon" style={{ color: ci.color }}>⚠️</span>
            <div className="ci-text">
              <div className="ci-condition">{ci.condition}</div>
              <div className="ci-prevalence" style={{ color: ci.color }}>{ci.prevalence}</div>
            </div>
            <span className="ci-pct" style={{ color: ci.color }}>{ci.trend}{ci.pct}%</span>
          </div>
        ))}
        <button className="rail-link">See More Insights</button>
      </div>

      <div className="rail-card rail-teal-card">
        <h3 className="rail-teal-title">Stay Ahead, Stay Healthy!</h3>
        <p className="rail-teal-sub">Real-time updates: Nutrition tips & local health alerts.</p>
        <button className="rail-teal-btn">View All Updates</button>
      </div>
    </aside>
  );
}
