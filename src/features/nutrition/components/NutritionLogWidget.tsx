import React, { useState, useRef } from 'react';
import { Camera, Plus, Droplets, Utensils, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { analyzeFoodImage, logMeal, type LoggedMeal } from '@/services/nutritionService';

export const NutritionLogWidget = ({ onLog }: { onLog?: () => void }) => {
  const { userProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<Partial<LoggedMeal> | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setAnalyzedData(null);
    setSuccess(false);

    try {
      const result = await analyzeFoodImage(file);
      if (result) {
        setAnalyzedData({
          mealType: "Snack", // Default
          foodName: result.foodName || "Unknown Food",
          calories: result.calories || 0,
          protein: result.protein || 0,
          carbs: result.carbs || 0,
          fat: result.fat || 0,
          fiber: result.fiber || 0,
          healthiness: result.healthiness || "Medium"
        });
      }
    } catch (error) {
      console.error(error);
      alert("Failed to analyze image. Ensure the AI service is running.");
    } finally {
      setLoading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveMeal = async () => {
    if (!analyzedData) return;
    try {
      await logMeal(userProfile?.uid || 'demo-user', analyzedData);
      setSuccess(true);
      if (onLog) onLog();
      setTimeout(() => {
        setSuccess(false);
        setAnalyzedData(null);
      }, 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <section style={{ margin: '24px', background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Utensils size={24} color="#0d9488" /> Log Your Nutrition
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        
        {/* Camera Upload Button */}
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

        {/* Manual Log Button */}
        <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer' }}>
          <Plus size={32} color="#64748b" />
          <span style={{ fontWeight: '600', color: '#475569' }}>Manual Entry</span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Search database or enter manually</span>
        </button>

        {/* Log Water Button */}
        <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', cursor: 'pointer' }}>
          <Droplets size={32} color="#0ea5e9" />
          <span style={{ fontWeight: '600', color: '#0369a1' }}>Log Water</span>
          <span style={{ fontSize: '12px', color: '#0c4a6e' }}>+250ml Glass</span>
        </button>
      </div>

      {/* AI Analysis Result */}
      {analyzedData && (
        <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#0f172a' }}>AI Analysis Result</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '16px' }}>
             <div style={{ background: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Food</div>
                <div style={{ fontWeight: 'bold' }}>{analyzedData.foodName}</div>
             </div>
             <div style={{ background: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Calories</div>
                <div style={{ fontWeight: 'bold', color: '#f59e0b' }}>{analyzedData.calories}</div>
             </div>
             <div style={{ background: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Protein</div>
                <div style={{ fontWeight: 'bold', color: '#0d9488' }}>{analyzedData.protein}g</div>
             </div>
             <div style={{ background: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Carbs</div>
                <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>{analyzedData.carbs}g</div>
             </div>
             <div style={{ background: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Fat</div>
                <div style={{ fontWeight: 'bold', color: '#ef4444' }}>{analyzedData.fat}g</div>
             </div>
          </div>
          
          <button 
            onClick={handleSaveMeal}
            style={{ width: '100%', padding: '12px', background: success ? '#16a34a' : '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {success ? <><Check size={20} /> Saved to Journal</> : 'Confirm & Save Meal'}
          </button>
        </div>
      )}
    </section>
  );
};
