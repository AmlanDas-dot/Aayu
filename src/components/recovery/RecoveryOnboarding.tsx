import React, { useState } from 'react';


interface RecoveryOnboardingProps {
  onComplete: (data: any) => void;
  onCancel: () => void;
}

export const RecoveryOnboarding: React.FC<RecoveryOnboardingProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: 'Alcohol',
    duration: '',
    frequency: '',
    lastUse: '',
    motivation: '',
    primaryTrigger: '',
    stressLevel: 5,
    sleep: '',
    medicalConditions: '',
    supportSystem: '',
    goal: ''
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = () => {
    onComplete(formData);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '24px' }}>Begin Your Journey</h2>
        <p style={{ margin: 0, color: '#64748b' }}>Step {step} of 3</p>
      </div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1e293b' }}>What are you recovering from?</label>
            <select 
              value={formData.type} 
              onChange={(e) => handleChange('type', e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            >
              <option>Alcohol</option>
              <option>Smoking</option>
              <option>Drugs</option>
              <option>Gaming</option>
              <option>Social Media</option>
              <option>Pornography</option>
              <option>Gambling</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1e293b' }}>When was your last use?</label>
            <input 
              type="date" 
              value={formData.lastUse} 
              onChange={(e) => handleChange('lastUse', e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1e293b' }}>How long has this been a challenge?</label>
            <input 
              type="text" 
              placeholder="e.g., 5 years" 
              value={formData.duration} 
              onChange={(e) => handleChange('duration', e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1e293b' }}>What is your primary trigger?</label>
            <input 
              type="text" 
              placeholder="e.g., Stress at work, social gatherings" 
              value={formData.primaryTrigger} 
              onChange={(e) => handleChange('primaryTrigger', e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1e293b' }}>Current Stress Level (1-10)</label>
            <input 
              type="range" 
              min="1" max="10" 
              value={formData.stressLevel} 
              onChange={(e) => handleChange('stressLevel', parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ textAlign: 'center', color: '#64748b', marginTop: '4px' }}>{formData.stressLevel} / 10</div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1e293b' }}>Do you have a support system?</label>
            <input 
              type="text" 
              placeholder="e.g., Spouse, therapist, AA group" 
              value={formData.supportSystem} 
              onChange={(e) => handleChange('supportSystem', e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1e293b' }}>What is your primary motivation?</label>
            <textarea 
              rows={3} 
              placeholder="Why do you want to recover?" 
              value={formData.motivation} 
              onChange={(e) => handleChange('motivation', e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1e293b' }}>What is your ultimate goal?</label>
            <input 
              type="text" 
              placeholder="e.g., Stay sober for 1 year" 
              value={formData.goal} 
              onChange={(e) => handleChange('goal', e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
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
          <button onClick={handleNext} style={{ padding: '12px 32px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Next</button>
        ) : (
          <button onClick={handleSubmit} style={{ padding: '12px 32px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Start Journey</button>
        )}
      </div>
    </div>
  );
};
