import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHealthContext } from '@/contexts/HealthContext';
import { Medication, FamilyMember } from '@/firebase/collections';
import { getMedications } from '@/services/medicationService';
import { generateTodaySchedule } from '@/services/medicationService';
import { logMedicationDose } from '@/services/medicationService';
import { getFamilyMembers } from '@/services/familyService';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { MedicationCard } from '@/features/medication/components/MedicationCard';
import { TodaySchedule } from '@/features/medication/components/TodaySchedule';
import { Pill, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MedicationsPage() {
  const { currentUser } = useAuth();
  const { selectedFamilyId, selectedMemberId } = useHealthContext();
  const navigate = useNavigate();
  
  const [medications, setMedications] = useState<Medication[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [filterMember, setFilterMember] = useState(selectedMemberId || "all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser && selectedFamilyId) {
      loadData();
    }
  }, [currentUser, selectedFamilyId, filterMember]);

  const loadData = async () => {
    if (!selectedFamilyId) return;
    setLoading(true);
    try {
      const [meds, membersData] = await Promise.all([
        getMedications(selectedFamilyId, filterMember),
        getFamilyMembers(selectedFamilyId)
      ]);
      setMedications(meds);
      setMembers(membersData);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeDose = async (medicationId: string, scheduledTime: string) => {
    const med = medications.find(m => m.id === medicationId);
    if (!med) return;
    try {
      await logMedicationDose({
        medicationId,
        familyId: med.familyId,
        memberId: med.memberId,
        takenAt: new Date().toISOString(),
        scheduledFor: scheduledTime,
        status: 'TAKEN'
      }, med);
      loadData();
    } catch (e: any) {
      console.error(e);
    }
  };

  if (!selectedFamilyId) {
    return (
      <EmptyState
        icon={Pill}
        title="No Family Selected"
        description="You must select or create a family to view Medications."
        actionText="Go to Family Hub"
        onAction={() => navigate('/family')}
        className="page-container"
      />
    );
  }

  const activeMeds = medications.filter(m => m.status === 'ACTIVE');
  const pastMeds = medications.filter(m => m.status !== 'ACTIVE');
  const todaySchedule = generateTodaySchedule(medications);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', color: '#0f172a' }}>Medication Plan</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Track medicines and schedule for your family.</p>
        </div>
        <select 
          value={filterMember} 
          onChange={e => setFilterMember(e.target.value)} 
          style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', minWidth: '200px' }}
        >
          <option value="all">All Family Members</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
        
        {/* Main Content */}
        <div>
          <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="#3b82f6" /> Active Medications ({activeMeds.length})
          </h2>
          
          {loading ? (
            <LoadingState message="Loading medications..." />
          ) : activeMeds.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="No active medications"
              description={filterMember === 'all' ? "No medications found for the family." : "No medications found for this member."}
              actionText="Add Medication"
              onAction={() => navigate('/records')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
              {activeMeds.map(med => (
                <MedicationCard key={med.id} medication={med} onUpdate={loadData} />
              ))}
            </div>
          )}

          {pastMeds.length > 0 && (
            <>
              <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '20px', opacity: 0.7 }}>Past Medications</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {pastMeds.map(med => (
                  <div key={med.id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 4px 0', color: '#475569' }}>{med.medicineName}</h4>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{med.status}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <TodaySchedule schedule={todaySchedule} onTakeDose={handleTakeDose} />
        </div>

      </div>
    </div>
  );
}

