// @ts-nocheck
import { useState, useEffect } from 'react';
import { Search, UserPlus, Activity, Clock, ShieldAlert, FileText, Pill, UploadCloud, ChevronRight, Stethoscope, AlertTriangle, ArrowLeft, Brain } from 'lucide-react';
import { mockDoctorSummary, mockPatientDatabase, PatientRecord } from '../data/doctorMock';
import { DashboardData, generateDashboardData } from '../data/dashboardMock';
import { useAuth } from '@/contexts/AuthContext';
import { CommunityDigitalTwin } from '../components/dashboard/CommunityDigitalTwin';

import { WorkspaceSelector } from '../components/dashboard/WorkspaceSelector';
import { useCommunityTwin } from '../contexts/CommunityTwinContext';
import { reverseGeocode, LocationInfo } from '../services/jurisdictionService';
import { MapPin, Building2, RefreshCw } from 'lucide-react';
import './DoctorDashboardPage.css';

export function DoctorDashboardPage() {
  const { userProfile } = useAuth();
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const { 
    activeWorkspace, 
    setActiveWorkspace, 
    dashboardData, 
    jurisdiction,
    selectedEntityId,
    setSelectedEntityId
  } = useCommunityTwin();

  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null);
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);

  const summary = mockDoctorSummary;
  const activePatient: PatientRecord | null = activePatientId ? mockPatientDatabase[activePatientId] : null;

  // 1. Initial Location Detection
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



  const handlePatientSelect = (id: string) => {
    setActivePatientId(id);
  };

  const handleBackToDashboard = () => {
    setActivePatientId(null);
  };

  const renderDashboardHome = () => (
    <div className="page-container emr-dashboard-home" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* Jurisdiction Map Section */}
      <div className="emr-jurisdiction-card" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: '20px' }}>
        <h2 className="emr-card-title" style={{ marginBottom: '15px' }}><Stethoscope size={20} /> Your Jurisdiction</h2>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '15px' }}>
          <div style={{ background: '#f8fafc', padding: '10px 15px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Assigned CHC</span>
            <strong>{activeWorkspace?.name || 'Not Assigned'}</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: '10px 15px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Assigned PHC</span>
            <strong>{activeWorkspace?.supportedPHCs?.[0] || 'Not Assigned'}</strong>
          </div>
        </div>
        
        <div style={{ height: '450px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          {dashboardData && jurisdiction && (
            <CommunityDigitalTwin 
              villages={dashboardData.villages}
              geoJson={jurisdiction.geoJson}
              facilities={jurisdiction.facilities}
              selectedVillageId={selectedEntityId}
              onSelectVillage={setSelectedEntityId}
              aiSummary={`Monitoring ${activeWorkspace?.name} jurisdiction. Focus on high-risk maternal cases.`}
              jurisdictionBounds={jurisdiction.bounds}
            />
          )}
        </div>
      </div>

      <div className="emr-top-section">
        {/* Tasks & Queues */}
        <div className="emr-clinical-summary-card">
          <h2 className="emr-card-title"><Activity size={20} /> Clinical Queue</h2>
          <div className="emr-metrics-grid">
            <div className="emr-metric" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
              <div className="emr-metric-value text-primary">{summary.todaysPatients}</div>
              <div className="emr-metric-label">Upcoming Follow-ups</div>
            </div>
            <div className="emr-metric warning" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
              <div className="emr-metric-value text-warning">{summary.pendingPrescriptions}</div>
              <div className="emr-metric-label">Prescription Queue</div>
            </div>
            <div className="emr-metric danger" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
              <div className="emr-metric-value text-danger">{summary.followUpsNeeded}</div>
              <div className="emr-metric-label">Critical Alerts</div>
            </div>
            <div className="emr-metric">
              <div className="emr-metric-value">12</div>
              <div className="emr-metric-label">High Risk Patients</div>
            </div>
          </div>
        </div>

        {/* Patient Access */}
        <div className="emr-patient-access-card">
          <h2 className="emr-card-title"><UserPlus size={20} /> Quick Access</h2>
          <div className="emr-access-forms">
            <div className="emr-input-group">
              <label>Temporary Record Access Code</label>
              <div className="emr-input-with-button">
                <input 
                  type="text" 
                  placeholder="e.g. AAYU-772-918" 
                  value={accessCode}
                  onChange={e => setAccessCode(e.target.value)}
                  className="emr-input"
                />
                <button className="emr-btn emr-btn-primary" onClick={() => handlePatientSelect('p1')}>Access</button>
              </div>
            </div>
            <div className="emr-divider">OR</div>
            <div className="emr-input-group">
              <label>Search Existing Patients</label>
              <div className="emr-search-box">
                <Search size={18} className="emr-search-icon" />
                <input 
                  type="text" 
                  placeholder="Search by name, ID, or phone..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="emr-input pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );

  const renderPatientEMR = () => {
    if (!activePatient) return null;

    return (
      <div className="emr-patient-view">
        <div className="emr-patient-header">
          <button className="emr-back-btn" onClick={handleBackToDashboard}>
            <ArrowLeft size={18} /> Back to Worklist
          </button>
          
          <div className="emr-patient-banner">
            <div className="emr-banner-main">
              <div className="emr-banner-avatar">{activePatient.name.charAt(0)}</div>
              <div>
                <h1 className="emr-banner-name">{activePatient.name}</h1>
                <div className="emr-banner-demo">
                  {activePatient.aayuId} • {activePatient.age}y {activePatient.gender} • Blood: {activePatient.bloodGroup} • {activePatient.phone}
                </div>
              </div>
            </div>
            <div className="emr-banner-vitals-snippet">
              <div className="emr-vs-item">
                <span className="emr-vs-label">BP</span>
                <span className={`emr-vs-value ${activePatient.vitals.bloodPressure.includes('145') ? 'text-danger' : ''}`}>{activePatient.vitals.bloodPressure}</span>
              </div>
              <div className="emr-vs-item">
                <span className="emr-vs-label">HR</span>
                <span className="emr-vs-value">{activePatient.vitals.heartRate}</span>
              </div>
              <div className="emr-vs-item">
                <span className="emr-vs-label">SpO2</span>
                <span className="emr-vs-value">{activePatient.vitals.spo2}%</span>
              </div>
              <div className="emr-vs-item">
                <span className="emr-vs-label">Temp</span>
                <span className="emr-vs-value">{activePatient.vitals.temperature}°F</span>
              </div>
            </div>
          </div>
        </div>

        <div className="emr-grid">
          {/* Left Column: Overview */}
          <div className="emr-col emr-col-left">
            <div className="emr-card">
              <div className="emr-card-header bg-red-subtle">
                <AlertTriangle size={18} className="text-danger" /> 
                <span className="font-semibold text-danger">Allergies & Conditions</span>
              </div>
              <div className="emr-card-body p-0">
                <div className="emr-list-section">
                  <div className="emr-list-title">Allergies</div>
                  <div className="emr-tags">
                    {activePatient.allergies.map(a => <span key={a} className="emr-tag danger">{a}</span>)}
                  </div>
                </div>
                <div className="emr-list-section border-t">
                  <div className="emr-list-title">Chronic Conditions</div>
                  <div className="emr-tags">
                    {activePatient.chronicConditions.map(c => <span key={c} className="emr-tag warning">{c}</span>)}
                  </div>
                </div>
              </div>
            </div>

            <div className="emr-card">
              <div className="emr-card-header">
                <Pill size={18} className="text-primary" />
                <span className="font-semibold">Active Medications</span>
              </div>
              <div className="emr-card-body p-0">
                {activePatient.medications.map(med => (
                  <div key={med.id} className="emr-med-item">
                    <div className="emr-med-name">{med.name} <span className="emr-med-dose">{med.dosage}</span></div>
                    <div className="emr-med-freq">{med.frequency}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="emr-card">
              <div className="emr-card-header">
                <Activity size={18} className="text-primary" />
                <span className="font-semibold">Recent Labs</span>
              </div>
              <div className="emr-card-body p-0">
                <table className="emr-lab-table">
                  <tbody>
                    {activePatient.labResults.map(lab => (
                      <tr key={lab.id} className={lab.flag !== 'Normal' ? 'lab-abnormal' : ''}>
                        <td>{lab.testName}</td>
                        <td className="text-right fw-bold">{lab.value} <span className="lab-unit">{lab.unit}</span></td>
                        <td className="text-center">
                          {lab.flag === 'High' && <span className="lab-flag up">↑</span>}
                          {lab.flag === 'Low' && <span className="lab-flag down">↓</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Middle Column: Actions & Timeline */}
          <div className="emr-col emr-col-main">
            <div className="emr-card">
              <div className="emr-card-header">
                <span className="font-semibold">Quick Actions</span>
              </div>
              <div className="emr-card-body">
                <div className="emr-action-grid">
                  <button className="emr-action-btn"><Pill size={18} /> New Prescription</button>
                  <button className="emr-action-btn"><FileText size={18} /> Add Clinical Note</button>
                  <button className="emr-action-btn"><UploadCloud size={18} /> Upload Lab Report</button>
                  <button className="emr-action-btn"><UserPlus size={18} /> Request Follow-up</button>
                </div>
              </div>
            </div>

            <div className="emr-card">
              <div className="emr-card-header">
                <FileText size={18} className="text-primary" />
                <span className="font-semibold">Recent Clinical Notes</span>
              </div>
              <div className="emr-card-body">
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #3b82f6', marginBottom: '10px' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px' }}><strong>Dr. Sharma (Cardiology)</strong> • 2 Days Ago</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>Patient reported mild palpitations. Adjusted dosage of Metoprolol. Requested follow-up ECG in 1 week.</p>
                </div>
              </div>
            </div>

            <div className="emr-card flex-1">
              <div className="emr-card-header">
                <Clock size={18} className="text-primary" />
                <span className="font-semibold">Patient Timeline</span>
              </div>
              <div className="emr-card-body">
                <div className="emr-timeline">
                  {activePatient.timeline.map(event => (
                    <div key={event.id} className="emr-timeline-item">
                      <div className="emr-timeline-dot"></div>
                      <div className="emr-timeline-content">
                        <div className="emr-tl-header">
                          <span className="emr-tl-type">{event.type}</span>
                          <span className="emr-tl-date">{event.date}</span>
                        </div>
                        <div className="emr-tl-desc">{event.description}</div>
                        <div className="emr-tl-provider">{event.provider}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Assistant */}
          <div className="emr-col emr-col-right">
            <div className="emr-ai-card">
              <div className="emr-ai-header" style={{ background: 'linear-gradient(90deg, #1e3a8a, #3b82f6)' }}>
                <Brain size={20} /> AI Clinical Assistant
              </div>
              <div className="emr-ai-body">
                <div className="emr-ai-section">
                  <h4 className="emr-ai-subtitle">AI Differential Diagnosis</h4>
                  <ul className="emr-ai-list info">
                    {activePatient.differentialDiagnosis.map(dx => (
                      <li key={dx}><ChevronRight size={14} /> {dx}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="emr-ai-section">
                  <h4 className="emr-ai-subtitle">Drug Interaction Panel</h4>
                  <div className="emr-ai-alert warning">
                    <ShieldAlert size={16} />
                    <span>{activePatient.medicationInteractions[0]}</span>
                  </div>
                </div>

                <div className="emr-ai-section">
                  <h4 className="emr-ai-subtitle">Clinical Summary</h4>
                  <p className="emr-ai-text">{activePatient.aiSummary}</p>
                </div>
                
                <div className="emr-ai-section">
                  <h4 className="emr-ai-subtitle">Risk Flags</h4>
                  <ul className="emr-ai-list danger">
                    {activePatient.riskFlags.map(flag => (
                      <li key={flag}><AlertTriangle size={14} /> {flag}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="emr-workspace">
      <div className="emr-sidebar">
        <div className="emr-sidebar-header">
          <h2>EMR System</h2>
          <span className="emr-badge">Dr. {userProfile?.name?.split(' ')[0]}</span>
        </div>
        
        <div className="emr-workspace-info" style={{ padding: '15px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
            <MapPin size={14} />
            {currentLocation ? `${currentLocation.district}, ${currentLocation.state}` : 'Location Unknown'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#0f172a', fontWeight: '500', background: '#e0e7ff', padding: '4px 10px', borderRadius: '12px', marginBottom: '8px' }}>
            <Building2 size={14} color="#4338ca" />
            {activeWorkspace ? activeWorkspace.name : 'No Workspace'}
          </div>
          <button 
            onClick={() => setShowWorkspaceSelector(true)}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', fontSize: '0.8rem', background: '#ffffff', border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', color: '#334155' }}
          >
            <RefreshCw size={12} /> Change Workspace
          </button>
        </div>
      </div>

      <div className="emr-main-content">
        {(!activeWorkspace || showWorkspaceSelector) && (
          <WorkspaceSelector 
            detectedLocation={currentLocation} 
            isInitialLoad={!activeWorkspace}
            onSelectWorkspace={(ws) => {
              setActiveWorkspace(ws);
              setShowWorkspaceSelector(false);
            }}
            onCancel={activeWorkspace ? () => setShowWorkspaceSelector(false) : undefined}
          />
        )}
        
        <header className="emr-topbar">
          <div className="emr-header-left">
            <Stethoscope size={24} className="emr-logo-icon" />
            <h1>AAYU Clinical Workspace</h1>
          </div>
          <div className="emr-header-right">
            <div className="emr-provider-badge">{userProfile?.name || 'Doctor'} • {userProfile?.role === 'doctor' ? 'General Physician' : userProfile?.role}</div>
          </div>
        </header>

        <main className="emr-main">
          {activePatientId ? renderPatientEMR() : renderDashboardHome()}
        </main>
      </div>
    </div>
  );
}

export default DoctorDashboardPage;
