import { useState } from 'react';
import { ClipboardList, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import './DoctorDashboardPage.css';

export function ScreeningPage() {
  const [step, setStep] = useState(1);
  const [complete, setComplete] = useState(false);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else setComplete(true);
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <ClipboardList size={48} color="#0284c7" style={{ margin: '0 auto 16px auto' }} />
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Health Screening</h1>
        <p style={{ color: '#64748b' }}>Complete the standard public health questionnaire.</p>
      </div>

      {complete ? (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '40px 20px', borderRadius: '12px', textAlign: 'center' }}>
           <CheckCircle size={48} color="#16a34a" style={{ margin: '0 auto 16px auto' }} />
           <h2 style={{ color: '#166534', margin: '0 0 12px 0' }}>Screening Complete</h2>
           <p style={{ color: '#15803d', marginBottom: '24px' }}>The health profile has been updated and a baseline risk score has been generated.</p>
           <button onClick={() => {setStep(1); setComplete(false);}} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Start New Screening</button>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>
             <span>Step {step} of 3</span>
             <span>{step === 1 ? 'Basic Vitals' : step === 2 ? 'Symptoms' : 'Medical History'}</span>
          </div>

          <div style={{ marginBottom: '30px' }}>
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Temperature (°F)</label><input type="number" placeholder="98.6" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} /></div>
                <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Blood Pressure (mmHg)</label><input type="text" placeholder="120/80" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} /></div>
              </div>
            )}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}><input type="checkbox" /> Persistent Cough (&gt;2 weeks)</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}><input type="checkbox" /> High Fever</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}><input type="checkbox" /> Unexplained Weight Loss</label>
              </div>
            )}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Recent Travel History</label>
                <textarea rows={3} placeholder="Any travel outside the district in the last 14 days?" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}></textarea>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px', borderRadius: '8px', color: '#92400e', display: 'flex', gap: '8px', fontSize: '14px', alignItems: 'flex-start' }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} /> <span>Please ensure all data is accurate before finalizing the screening.</span>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleNext} style={{ width: '100%', background: '#0284c7', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
             {step === 3 ? 'Submit Screening' : 'Next Step'} <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
