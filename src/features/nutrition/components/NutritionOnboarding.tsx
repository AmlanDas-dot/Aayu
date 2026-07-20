import React, { useState } from 'react';
import { Target } from 'lucide-react';
import { NutritionUserProfile } from '@/services/nutritionService';

interface Props {
  onComplete: (data: Partial<NutritionUserProfile>) => void;
  onCancel: () => void;
}

export const NutritionOnboarding: React.FC<Props> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<NutritionUserProfile>>({
    age: 30,
    gender: 'Male',
    height: 170,
    weight: 70,
    targetWeight: 70,
    activityLevel: 'Moderate',
    dietPreference: 'Vegetarian',
    primaryGoal: 'Healthy Eating',
    foodAllergies: 'None',
  });

  const handleChange = (field: keyof NutritionUserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);
  const handleSubmit = () => onComplete(formData);

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Target size={48} color="#0d9488" style={{ margin: '0 auto 16px auto' }} />
        <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '24px' }}>Build Your Nutrition Profile</h2>
        <p style={{ margin: 0, color: '#64748b' }}>Step {step} of 3</p>
      </div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Age</label>
              <input type="number" value={formData.age} onChange={(e) => handleChange('age', e.target.value === '' ? '' : parseInt(e.target.value))} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Gender</label>
              <select value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Weight (kg)</label>
              <input type="number" value={formData.weight} onChange={(e) => handleChange('weight', e.target.value === '' ? '' : parseInt(e.target.value))} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Target Weight (kg)</label>
              <input type="number" value={formData.targetWeight} onChange={(e) => handleChange('targetWeight', e.target.value === '' ? '' : parseInt(e.target.value))} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Height (cm)</label>
            <input type="number" value={formData.height} onChange={(e) => handleChange('height', e.target.value === '' ? '' : parseInt(e.target.value))} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Primary Goal</label>
            <select value={formData.primaryGoal} onChange={(e) => handleChange('primaryGoal', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <option>Weight Loss</option>
              <option>Weight Gain</option>
              <option>Maintenance</option>
              <option>Muscle Gain</option>
              <option>Healthy Eating</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Activity Level</label>
            <select value={formData.activityLevel} onChange={(e) => handleChange('activityLevel', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <option>Sedentary</option>
              <option>Lightly Active</option>
              <option>Moderate</option>
              <option>Very Active</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Diet Preference</label>
            <select value={formData.dietPreference} onChange={(e) => handleChange('dietPreference', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <option>Vegetarian</option>
              <option>Vegan</option>
              <option>Eggetarian</option>
              <option>Non-Vegetarian</option>
            </select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Food Allergies</label>
            <input type="text" placeholder="e.g., Peanuts, Dairy, Gluten (or None)" value={formData.foodAllergies} onChange={(e) => handleChange('foodAllergies', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
        {step > 1 ? (
          <button onClick={handlePrev} style={{ padding: '12px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Back</button>
        ) : (
          <button onClick={onCancel} style={{ padding: '12px 24px', background: 'transparent', color: '#64748b', border: 'none', fontWeight: '500', cursor: 'pointer' }}>Cancel</button>
        )}
        
        {step < 3 ? (
          <button onClick={handleNext} style={{ padding: '12px 32px', background: '#0d9488', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Next</button>
        ) : (
          <button onClick={handleSubmit} style={{ padding: '12px 32px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Finish</button>
        )}
      </div>
    </div>
  );
};
