
import { Phone, ShieldAlert, Navigation, Info } from 'lucide-react';
import { AlertsPage } from './AlertsPage';

export function DisasterAidPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#991b1b', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={32} /> Disaster Aid & Emergency Response
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '16px' }}>Real-time coordination for public health emergencies and natural disasters.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
         <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ color: '#991b1b', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={20} /> Emergency Contacts</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#7f1d1d', lineHeight: '2' }}>
              <li><strong>National Emergency:</strong> 112</li>
              <li><strong>Ambulance:</strong> 108</li>
              <li><strong>Disaster Management (NDMA):</strong> 1078</li>
            </ul>
         </div>
         <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ color: '#9a3412', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Navigation size={20} /> Evacuation Centers</h3>
            <p style={{ color: '#7c2d12', margin: 0 }}>Detecting nearby safe zones and shelters based on your location. Please ensure location services are enabled.</p>
         </div>
         <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ color: '#0f766e', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Info size={20} /> Standard Operating Procedures</h3>
            <p style={{ color: '#115e59', margin: 0 }}>Follow local authority instructions. Stay indoors during severe weather alerts. Do not consume contaminated water during floods.</p>
         </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 20px 0', color: '#0f172a' }}>Active Emergency Alerts</h2>
        {/* We reuse the AlertsPage component but it acts as a standalone section here */}
        <div style={{ border: '1px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
          <AlertsPage />
        </div>
      </div>
    </div>
  );
}
