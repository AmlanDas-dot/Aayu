import { useState } from "react";

const BUDGET_OPTIONS = [50, 100, 150, 200];

import { type NutritionProfile } from "@/features/nutrition/types";

export function MealPlanGrid({ profile }: { profile: NutritionProfile }) {
  const [selectedBudget, setSelectedBudget] = useState(100);
  const totalCost = profile.mealPlan.reduce((sum: number, m) => sum + m.price, 0);

  return (
    <section className="meal-plan-section">
      <div className="meal-plan-header">
        <div>
          <h2 className="section-heading">Meal Plans & Budget Planner</h2>
          <p className="section-sub">For your location and local ingredients.</p>
        </div>
        <div className="budget-selector">
          <span className="budget-label">Select Budget</span>
          <div className="budget-btns">
            {BUDGET_OPTIONS.map((b) => (
              <button
                key={b}
                className={`budget-btn ${selectedBudget === b ? "budget-btn-active" : ""}`}
                onClick={() => setSelectedBudget(b)}
              >
                ₹{b}<span className="budget-per">Per Day</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="meal-tabs">
        <button className="meal-tab meal-tab-active">Daily Plan</button>
        <button className="meal-tab">Weekly Plan</button>
        <button className="meal-tab">Family Plan</button>
      </div>

      <div className="meal-cards-grid">
        {profile.mealPlan.map((meal) => (
          <div key={meal.meal} className="meal-card">
            <div className="meal-time">{meal.meal}</div>
            <div className="meal-icon">{meal.icon}</div>
            <div className="meal-name">{meal.name}</div>
            <div className="meal-price">₹{meal.price}</div>
            <div className="meal-note">{meal.note}</div>
          </div>
        ))}
      </div>

      <div className="meal-total-row">
        <div className="meal-total-text">
          Total Cost: <strong>₹{totalCost} /day</strong>
          <span className="meal-note-small"> 🛈 These are customized for you based on age, activity level and health goals.</span>
        </div>
        <button className="view-plan-btn">View Full Weekly Plan →</button>
      </div>
    </section>
  );
}
