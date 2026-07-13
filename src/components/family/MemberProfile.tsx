import React, { useState } from 'react';
import { FamilyMember } from '../../data/familyMock';
import { RecordTimeline } from './RecordTimeline';
import { ArrowLeft, UserCircle, FileText, Plus, Shield, ShieldAlert, Phone, Share2, Upload } from 'lucide-react';
import { ShareQRModal } from './ShareQRModal';

interface MemberProfileProps {
  member: FamilyMember;
  onBack: () => void;
}

type WorkspaceTab = 'Overview' | 'Records' | 'Nutrition' | 'Vaccines' | 'Reports' | 'Share';

export const MemberProfile: React.FC<MemberProfileProps> = ({ member, onBack }) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('Overview');
  const [showShare, setShowShare] = useState(false);

  const handleAddRecord = () => {
    alert("This feature will connect with OCR and camera capture in the next development phase.");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="profile-grid">
            {/* Basic Information */}
            <section className="profile-section">
              <h3 className="profile-section-title"><UserCircle size={18} /> Basic Information</h3>
              <div className="profile-detail-list">
                <div className="profile-detail-item">
                  <span className="profile-detail-label">Age & Gender</span>
                  <span className="profile-detail-value">{member.age} years, {member.gender}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="profile-detail-label">Relationship</span>
                  <span className="profile-detail-value">{member.relation}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="profile-detail-label">Blood Group</span>
                  <span className="profile-detail-value" style={{ color: '#dc2626', fontWeight: 600 }}>{member.bloodGroup}</span>
                </div>
              </div>
            </section>

            {/* Medical Information */}
            <section className="profile-section">
              <h3 className="profile-section-title"><FileText size={18} /> Medical Information</h3>
              <div className="profile-detail-list">
                <div className="profile-detail-item">
                  <span className="profile-detail-label">Current Conditions</span>
                  <div className="pill-group">
                    {member.conditions.map((c, i) => <span key={i} className="pill">{c}</span>)}
                  </div>
                </div>
                <div className="profile-detail-item mt-2">
                  <span className="profile-detail-label">Current Medications</span>
                  <div className="pill-group">
                    {member.medications.map((m, i) => <span key={i} className="pill">{m}</span>)}
                  </div>
                </div>
                <div className="profile-detail-item mt-2">
                  <span className="profile-detail-label">Known Allergies</span>
                  <div className="pill-group">
                    {member.allergies.map((a, i) => (
                      <span key={i} className="pill" style={a !== 'None' ? { borderColor: '#fca5a5', color: '#b91c1c', background: '#fef2f2' } : {}}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Government Schemes */}
            <section className="profile-section">
              <h3 className="profile-section-title"><Shield size={18} /> Government Schemes</h3>
              <div className="profile-detail-list">
                {member.schemes.map((s, i) => (
                  <div key={i} className="profile-detail-item">
                    <span className="profile-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldAlert size={16} className="text-teal" />
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Emergency & Vaccines */}
            <section className="profile-section">
              <h3 className="profile-section-title"><Phone size={18} /> Emergency Contact</h3>
              <div className="profile-detail-list">
                <div className="profile-detail-item">
                  <span className="profile-detail-label">Vaccination Status</span>
                  <span className="profile-detail-value" style={{ color: '#16a34a', fontWeight: 600 }}>{member.vaccinationStatus}</span>
                </div>
                <div className="profile-detail-item mt-2">
                  <span className="profile-detail-label">Emergency Contact</span>
                  <span className="profile-detail-value">{member.emergencyContact}</span>
                </div>
              </div>
            </section>
          </div>
        );
      
      case 'Records':
        return (
          <div className="env-section mt-4">
            <h3 className="env-section-title" style={{ marginBottom: '16px' }}>Medical Timeline</h3>
            <RecordTimeline records={member.records} />
          </div>
        );

      case 'Nutrition':
        return (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ opacity: 0.3, margin: '0 auto 16px auto' }} />
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text)' }}>Nutrition Tracking</h3>
            <p style={{ margin: 0 }}>This section will display active meal plans and dietary recommendations.</p>
          </div>
        );

      case 'Vaccines':
        return (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Shield size={48} style={{ opacity: 0.3, margin: '0 auto 16px auto' }} />
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text)' }}>Immunization Record</h3>
            <p style={{ margin: 0 }}>A complete history of vaccinations and upcoming schedules will appear here.</p>
          </div>
        );

      case 'Reports':
        return (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Upload size={48} style={{ opacity: 0.3, margin: '0 auto 16px auto', color: '#0d9488' }} />
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text)' }}>Upload Medical Reports</h3>
            <p style={{ margin: '0 0 24px 0' }}>Connect with OCR to automatically digitize prescriptions and lab results.</p>
            <button className="btn-primary" onClick={handleAddRecord}>
              <Plus size={18} /> Upload Document
            </button>
          </div>
        );

      case 'Share':
        return (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Share2 size={48} style={{ color: '#0d9488', margin: '0 auto 16px auto' }} />
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text)' }}>Share Health Context</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 24px 0', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
              Securely share {member.name}'s medical history with ASHA workers or healthcare providers using a one-time QR code.
            </p>
            <button className="btn-primary" onClick={() => setShowShare(true)}>
              Generate Sharing Code
            </button>
          </div>
        );
    }
  };

  const tabs: WorkspaceTab[] = ['Overview', 'Records', 'Nutrition', 'Vaccines', 'Reports', 'Share'];

  return (
    <div className="family-module-card mt-4" style={{ padding: '0', overflow: 'hidden' }}>
      <div style={{ padding: '24px 24px 0 24px' }}>
        <div className="profile-header" style={{ marginBottom: '16px' }}>
          <div className="profile-header-left">
            <button className="btn-back" onClick={onBack} title="Back to Family" aria-label="Back to Family">
              <ArrowLeft size={24} />
            </button>
            <div className="family-module-title-wrap">
              <UserCircle size={28} className="text-teal" />
              <h2 className="family-module-title">{member.name}'s Health Workspace</h2>
            </div>
          </div>
        </div>

        <div className="dashboard-tabs-container" style={{ borderBottom: '1px solid var(--border)' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              className={`dashboard-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              style={{ padding: '12px 16px', fontSize: '0.9rem' }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {renderTabContent()}
      </div>
      
      {showShare && <ShareQRModal onClose={() => setShowShare(false)} />}
    </div>
  );
};
