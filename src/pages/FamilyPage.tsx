import { useState, useEffect } from 'react';
import { FamilyData } from '../data/familyMock';
import { getFamilyData } from '../services/familyService';
import { FamilyHero } from '../components/family/FamilyHero';
import { FamilyOverview } from '../components/family/FamilyOverview';
import { MemberGrid } from '../components/family/MemberGrid';
import { MemberProfile } from '../components/family/MemberProfile';
import { AddMemberModal } from '../components/family/AddMemberModal';
import { ShareQRModal } from '../components/family/ShareQRModal';
import { LoadingStatus } from '../components/LoadingStatus';
import './FamilyPage.css';
import { Info } from 'lucide-react';
import { useHealthContext } from '../hooks/useHealthContext';

export function FamilyPage() {
  const [data, setData] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { selectedMember, setSelectedMember } = useHealthContext();
  const [showAddMember, setShowAddMember] = useState(false);
  const [showShareQR, setShowShareQR] = useState(false);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await getFamilyData();
        if (active) {
          setData(result);
        }
      } catch (e) {
        if (active) {
          setError('Failed to load family data.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="family-page">
      <div className="family-layout">
        <main className="family-main">
          <FamilyHero 
            onAddMember={() => setShowAddMember(true)} 
            onShareQR={() => setShowShareQR(true)} 
          />

          <div className="workflow-hint" style={{ marginTop: '-8px' }}>
            <Info size={18} className="workflow-hint-icon" />
            <span>Share the household QR with an ASHA worker to instantly grant them access to your family's records.</span>
          </div>

          {loading ? (
            <div style={{ maxWidth: 400, margin: '40px auto' }}>
              <LoadingStatus icon="👨‍👩‍👧" status="Loading family records..." />
            </div>
          ) : error ? (
            <div className="schemes-error">⚠️ {error}</div>
          ) : data ? (
            <>
              {selectedMember ? (
                <MemberProfile member={selectedMember} onBack={() => setSelectedMember(null)} />
              ) : (
                <>
                  <FamilyOverview overview={data.overview} />
                  
                  <div className="workflow-hint">
                    <Info size={18} className="workflow-hint-icon" />
                    <span>Select a family member below to view their detailed health records, current conditions, and medical timeline.</span>
                  </div>

                  <MemberGrid members={data.members} onMemberClick={setSelectedMember} />
                </>
              )}

              {/* Page Footer CTA */}
              <div className="talk-section mt-4" style={{ textAlign: 'center', padding: '32px' }}>
                <Info size={32} className="text-teal" style={{ margin: '0 auto 16px auto' }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Secure & Private</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                  Your family's health records are encrypted and stored securely. You control who has access to this information.
                </p>
              </div>
            </>
          ) : null}
        </main>

        {/* Right Sidebar Rail (consistent with layout) */}
        <aside className="schemes-rail">
          <div className="profile-finder-card">
            <div className="pf-header">
              <span className="pf-icon" style={{ fontSize: '20px' }}>🔐</span>
              <h3>Privacy Settings</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
              Manage who can view and update your family's health records.
            </p>
            <button style={{
              width: '100%',
              padding: '12px',
              background: '#0d9488',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              Manage Access
            </button>
          </div>

          <div className="scheme-alerts-card mt-4">
            <div className="alerts-header">
              <Info size={18} />
              <h3>Data Sources</h3>
            </div>
            <ul className="alerts-list">
              <li><span className="alert-badge new">Pending</span> Firebase Sync</li>
              <li><span className="alert-badge new">Pending</span> OCR Document Scan</li>
              <li><span className="alert-badge">Mock</span> Local Storage Data</li>
            </ul>
          </div>
        </aside>
      </div>

      {showAddMember && <AddMemberModal onClose={() => setShowAddMember(false)} />}
      {showShareQR && <ShareQRModal onClose={() => setShowShareQR(false)} />}
    </div>
  );
}

export default FamilyPage;
