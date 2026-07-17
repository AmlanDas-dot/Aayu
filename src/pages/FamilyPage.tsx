import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserFamily } from '@/services/familyService';
import { Family, FamilyMember } from '@/firebase/collections';
import { LoadingStatus } from '@/components/LoadingStatus';
import { NoFamilyState } from '@/components/family/NoFamilyState';
import { CreateFamilyWizard } from '@/components/family/CreateFamilyWizard';
import { JoinFamilyWizard } from '@/components/family/JoinFamilyWizard';
import { FamilyDashboard } from '@/components/family/FamilyDashboard';
import { PendingApprovalState } from '@/components/family/PendingApprovalState';
import './FamilyPage.css';

export function FamilyPage() {
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);
  const [currentMember, setCurrentMember] = useState<FamilyMember | null>(null);
  
  // Navigation State
  const [viewState, setViewState] = useState<'loading' | 'no_family' | 'creating' | 'joining' | 'dashboard' | 'pending_approval'>('loading');

  const loadFamilyData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const { family: f, member: m } = await getUserFamily(currentUser.uid);
      if (f && m) {
        setFamily(f);
        setCurrentMember(m);
        if (m.status === 'pending') {
          setViewState('pending_approval');
        } else {
          setViewState('dashboard');
        }
      } else {
        setViewState('no_family');
      }
    } catch (e) {
      console.error(e);
      setViewState('no_family');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamilyData();
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <div className="family-page">
      <div className="family-layout">
        <main className="family-main" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
          
          {loading || viewState === 'loading' ? (
            <div style={{ maxWidth: 400, margin: '40px auto' }}>
              <LoadingStatus icon="👨‍👩‍👧" status="Loading family records..." />
            </div>
          ) : viewState === 'no_family' ? (
            <NoFamilyState 
              onCreate={() => setViewState('creating')} 
              onJoin={() => setViewState('joining')} 
            />
          ) : viewState === 'creating' ? (
            <CreateFamilyWizard 
              onCancel={() => setViewState('no_family')}
              onSuccess={loadFamilyData}
            />
          ) : viewState === 'joining' ? (
            <JoinFamilyWizard 
              onCancel={() => setViewState('no_family')}
              onSuccess={loadFamilyData}
            />
          ) : viewState === 'dashboard' && family && currentMember ? (
            <FamilyDashboard 
              family={family} 
              currentMember={currentMember} 
              onFamilyChange={loadFamilyData} 
            />
          ) : viewState === 'pending_approval' ? (
            <PendingApprovalState />
          ) : null}

        </main>
      </div>
    </div>
  );
}

export default FamilyPage;
