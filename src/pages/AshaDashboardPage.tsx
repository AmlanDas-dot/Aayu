// @ts-nocheck
import { useState, useEffect } from 'react';
import { WorkspaceFacility } from '../data/workspaceRegistry';
import { WorkspaceSelector } from '../components/dashboard/WorkspaceSelector';
import { DashboardData } from '../data/dashboardMock';
import { useCommunityTwin } from '../contexts/CommunityTwinContext';
import { reverseGeocode, LocationInfo } from '../services/jurisdictionService';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Users, Activity, Home, ShieldAlert } from 'lucide-react';
import './DoctorDashboardPage.css'; // Reuse doctor dashboard styling
import { AlertsTab } from '../components/dashboard/AlertsTab';
import { CommunityDigitalTwin } from '../components/dashboard/CommunityDigitalTwin';

export function AshaDashboardPage() {
  const { userProfile } = useAuth();
  
  const { 
    activeWorkspace, 
    setActiveWorkspace, 
    jurisdiction,
    dashboardData,
    selectedEntityId,
    setSelectedEntityId
  } = useCommunityTwin();

  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null);
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) reject(new Error('No geolocation'));
          else navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        const info = await reverseGeocode(position.coords.latitude, position.coords.longitude);
        setCurrentLocation(info);
      } catch (err) {
        console.warn('Geolocation denied or failed');
        setCurrentLocation(null);
      }
    };
    detectLocation();
  }, []);



  if (showWorkspaceSelector || !activeWorkspace) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#1e293b' }}>
          ASHA Worker Setup
        </h1>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>
          Please select your assigned primary health centre or workspace.
        </p>
        <WorkspaceSelector 
          detectedLocation={currentLocation} 
          onSelectWorkspace={(ws: WorkspaceFacility) => { setActiveWorkspace(ws); setShowWorkspaceSelector(false); }} 
          isInitialLoad={!activeWorkspace}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="emr-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>ASHA Dashboard</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Welcome back, {userProfile?.name || 'ASHA Worker'}
          </p>
        </div>
        <button 
          onClick={() => setShowWorkspaceSelector(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', cursor: 'pointer', fontWeight: '500' }}>
          <MapPin size={16} /> Change Assignment
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
          <div style={{ color: '#1e40af', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18}/> Assigned Families</div>
          <div style={{ fontSize: '28px', color: '#1e3a8a', fontWeight: 'bold' }}>142</div>
        </div>
        <div style={{ background: '#fdf4ff', padding: '20px', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
          <div style={{ color: '#86198f', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18}/> Pending Screenings</div>
          <div style={{ fontSize: '28px', color: '#701a75', fontWeight: 'bold' }}>18</div>
        </div>
        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
          <div style={{ color: '#166534', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><Home size={18}/> Households Visited</div>
          <div style={{ fontSize: '28px', color: '#14532d', fontWeight: 'bold' }}>45 <span style={{fontSize:'14px', color:'#16a34a', fontWeight:'normal'}}>this week</span></div>
        </div>
        <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '12px', border: '1px solid #fecaca' }}>
          <div style={{ color: '#991b1b', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={18}/> High Risk Patients</div>
          <div style={{ fontSize: '28px', color: '#7f1d1d', fontWeight: 'bold' }}>12</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
             <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
               <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={20}/> Village Map & Household Tracking</h2>
             </div>
             <div style={{ height: '400px' }}>
                {dashboardData && jurisdiction && (
                  <CommunityDigitalTwin 
                    villages={dashboardData.villages}
                    geoJson={jurisdiction.geoJson}
                    facilities={jurisdiction.facilities}
                    selectedVillageId={selectedEntityId}
                    onSelectVillage={setSelectedEntityId}
                    aiSummary={`Monitoring ${activeWorkspace.name} jurisdiction`}
                    jurisdictionBounds={jurisdiction.bounds}
                  />
                )}
             </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', flex: 1 }}>
             <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={20}/> Local Alerts</h2>
             <AlertsTab alerts={dashboardData?.alerts || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
