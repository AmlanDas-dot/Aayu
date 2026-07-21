import React, { useState, useRef, useMemo } from 'react';
import { Camera, Plus, Droplets, Utensils, Check, Loader2, Search, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { analyzeFoodImage, logMeal, logWater, type LoggedMeal } from '@/services/nutritionService';

const LOCAL_FOOD_DB = [
  { name: "Apple", cal: 95, p: 0.5, c: 25, f: 0.3, fib: 4.4 },
  { name: "Banana", cal: 105, p: 1.3, c: 27, f: 0.3, fib: 3.1 },
  { name: "Chicken Breast (100g)", cal: 165, p: 31, c: 0, f: 3.6, fib: 0 },
  { name: "Dal (1 bowl)", cal: 180, p: 10, c: 25, f: 5, fib: 8 },
  { name: "Roti (1 piece)", cal: 120, p: 3.5, c: 22, f: 2.5, fib: 3 },
  { name: "Rice (1 cup)", cal: 205, p: 4.3, c: 45, f: 0.4, fib: 0.6 },
  { name: "Paneer (100g)", cal: 265, p: 18, c: 1.2, f: 20, fib: 0 },
  { name: "Oats (1 cup)", cal: 154, p: 5.3, c: 27, f: 2.6, fib: 4 },
  { name: "Egg (1 large)", cal: 72, p: 6.3, c: 0.4, f: 4.8, fib: 0 },
  { name: "Milk (1 cup)", cal: 103, p: 8, c: 12, f: 2.4, fib: 0 }
];

export const NutritionLogWidget = ({ onLog }: { onLog?: () => void }) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [waterLoading, setWaterLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<Partial<LoggedMeal> | null>(null);

  const [showManualModal, setShowManualModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setAnalyzedData(null);
    setSuccess(false);

    try {
      const result = await analyzeFoodImage(file);
      if (result) {
        let lowestConfidence = 1.0;
        let summaryName = "Mixed Meal";
        
        if (result.foods && result.foods.length > 0) {
            lowestConfidence = Math.min(...result.foods.map((f:any) => f.confidence));
            if (result.foods.length === 1) summaryName = result.foods[0].name;
            else summaryName = `${result.foods[0].name} & ${result.foods.length - 1} more`;
        }

        setAnalyzedData({
          mealType: "Snack",
          foodName: summaryName,
          foods: result.foods || [],
          calories: result.totalCalories || result.calories || 0,
          protein: result.totalProtein || result.protein || 0,
          carbs: result.totalCarbs || result.carbs || 0,
          fat: result.totalFat || result.fat || 0,
          fiber: result.fiber || 0,
          healthiness: "Medium",
          confidence: lowestConfidence
        });
        
        if (lowestConfidence < 0.70) {
            addToast("Low confidence detected. Please verify the items.", "error");
        } else {
            addToast("Food analyzed successfully!", "success");
        }
      } else {
        addToast("Analysis returned empty results. Please try again.", "error");
      }
    } catch (error) {
      console.error(error);
      addToast("Failed to analyze image. Ensure the AI service is running.", "error");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveMeal = async () => {
    if (!analyzedData) return;
    if (!currentUser) {
      addToast("Please log in to save meals.", "error");
      return;
    }
    try {
      await logMeal(currentUser.uid, analyzedData);
      setSuccess(true);
      if (onLog) onLog();
      addToast(`Logged ${analyzedData.foodName} successfully!`, "success");
      setTimeout(() => {
        setSuccess(false);
        setAnalyzedData(null);
      }, 2000);
    } catch (e) {
      console.error(e);
      addToast("Failed to save meal.", "error");
    }
  };

  const handleLogWater = async () => {
    if (!currentUser) {
      addToast("Please log in to track water.", "error");
      return;
    }
    setWaterLoading(true);
    try {
      await logWater(currentUser.uid, 250);
      addToast("Added 250ml of water!", "success");
      if (onLog) onLog();
    } catch (e) {
      console.error(e);
      addToast("Failed to log water.", "error");
    } finally {
      setWaterLoading(false);
    }
  };

  const filteredFoods = useMemo(() => {
    if (!searchQuery) return LOCAL_FOOD_DB;
    return LOCAL_FOOD_DB.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const selectManualFood = (food: typeof LOCAL_FOOD_DB[0]) => {
    setAnalyzedData({
      mealType: "Snack",
      foodName: food.name,
      foods: [{ name: food.name, portion: "1 serving", confidence: 1.0, calories: food.cal, protein: food.p, carbs: food.c, fat: food.f, fiber: food.fib }],
      calories: food.cal,
      protein: food.p,
      carbs: food.c,
      fat: food.f,
      fiber: food.fib,
      healthiness: "High",
      confidence: 1.0
    });
    setShowManualModal(false);
    setSearchQuery("");
  };

  const updateMacro = (field: keyof LoggedMeal, val: string) => {
    if (!analyzedData) return;
    setAnalyzedData({
      ...analyzedData,
      [field]: field === 'foodName' ? val : Number(val)
    });
  };

  return (
    <section style={{ margin: '24px', background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative' }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Utensils size={24} color="#0d9488" /> Log Your Nutrition
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', background: '#f0fdf4', border: '2px dashed #bbf7d0', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? <Loader2 size={32} color="#16a34a" className="animate-spin" /> : <Camera size={32} color="#16a34a" />}
          <span style={{ fontWeight: '600', color: '#16a34a' }}>
            {loading ? "Analyzing Image with AI..." : "Scan Food with AI"}
          </span>
          <span style={{ fontSize: '12px', color: '#15803d' }}>Upload photo for auto-logging</span>
        </button>
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          style={{ display: 'none' }} 
        />

        <button onClick={() => setShowManualModal(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer' }}>
          <Plus size={32} color="#64748b" />
          <span style={{ fontWeight: '600', color: '#475569' }}>Manual Entry</span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Search database or enter manually</span>
        </button>

        <button onClick={handleLogWater} disabled={waterLoading} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', cursor: waterLoading ? 'not-allowed' : 'pointer', opacity: waterLoading ? 0.7 : 1 }}>
          {waterLoading ? <Loader2 size={32} color="#0ea5e9" className="animate-spin" /> : <Droplets size={32} color="#0ea5e9" />}
          <span style={{ fontWeight: '600', color: '#0369a1' }}>Log Water</span>
          <span style={{ fontSize: '12px', color: '#0c4a6e' }}>+250ml Glass</span>
        </button>
      </div>

      {showManualModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Search Food</h3>
              <button onClick={() => setShowManualModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input 
                type="text" 
                placeholder="Search local database..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredFoods.length > 0 ? filteredFoods.map(food => (
                <div key={food.name} onClick={() => selectManualFood(food)} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9', cursor: 'pointer', background: '#f8fafc' }}>
                  <span style={{ fontWeight: '500', color: '#0f172a' }}>{food.name}</span>
                  <span style={{ color: '#64748b', fontSize: '14px' }}>{food.cal} kcal</span>
                </div>
              )) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No matches found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {analyzedData && (
        <div style={{ marginTop: '24px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Review & Confirm Meal 
              {analyzedData.confidence && analyzedData.confidence < 0.70 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#ef4444', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px' }}>
                  <AlertTriangle size={14} /> Low Confidence
                </span>
              )}
            </h3>
            <button onClick={() => setAnalyzedData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} color="#ef4444" /></button>
          </div>

          {analyzedData.foods && analyzedData.foods.length > 0 && (
             <div style={{ marginBottom: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
               <div style={{ padding: '12px', background: '#f1f5f9', fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>DETECTED ITEMS</div>
               {analyzedData.foods.map((food, i) => (
                 <div key={i} style={{ padding: '12px', borderBottom: i === analyzedData.foods!.length - 1 ? 'none' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <div style={{ fontWeight: '500', color: '#0f172a' }}>{food.name}</div>
                     <div style={{ fontSize: '12px', color: '#64748b' }}>{food.portion} &middot; {Math.round(food.confidence * 100)}% sure</div>
                   </div>
                   <div style={{ fontWeight: '600', color: '#0d9488' }}>{food.calories} kcal</div>
                 </div>
               ))}
             </div>
          )}
          
          <input 
             type="text" 
             value={analyzedData.foodName || ""} 
             onChange={e => updateMacro('foodName', e.target.value)}
             style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '16px', fontWeight: 'bold' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '12px', marginBottom: '20px' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Calories (kcal)</label>
                <input type="number" value={analyzedData.calories || 0} onChange={e => updateMacro('calories', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Protein (g)</label>
                <input type="number" value={analyzedData.protein || 0} onChange={e => updateMacro('protein', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Carbs (g)</label>
                <input type="number" value={analyzedData.carbs || 0} onChange={e => updateMacro('carbs', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Fat (g)</label>
                <input type="number" value={analyzedData.fat || 0} onChange={e => updateMacro('fat', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
             </div>
          </div>
          
          <button 
            onClick={handleSaveMeal}
            style={{ width: '100%', padding: '14px', background: success ? '#16a34a' : '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
          >
            {success ? <><Check size={20} /> Saved to Journal</> : 'Confirm & Save Meal'}
          </button>
        </div>
      )}
    </section>
  );
};
