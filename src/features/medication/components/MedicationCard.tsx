import { Medication } from '@/firebase/collections';
import { Pill, CheckCircle2, Clock, XCircle, Calendar, Play } from 'lucide-react';
import { logMedicationDose } from '@/services/adherenceService';

interface MedicationCardProps {
  medication: Medication;
  onUpdate: () => void;
}

export function MedicationCard({ medication, onUpdate }: MedicationCardProps) {
  
  const handleAction = async (action: 'TAKEN' | 'SKIPPED') => {
    try {
      await logMedicationDose({
        medicationId: medication.id!,
        familyId: medication.familyId,
        memberId: medication.memberId,
        takenAt: new Date().toISOString(),
        scheduledFor: medication.nextDose || new Date().toISOString(),
        status: action
      }, medication);
      onUpdate();
    } catch (err) {
      console.error(err);
      alert("Failed to log dose");
    }
  };

  const getStatusColor = () => {
    switch (medication.status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'COMPLETED': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'STOPPED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '12px', color: '#0ea5e9' }}>
            <Pill size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>{medication.medicineName}</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              {medication.dosage} {medication.strength} • {medication.frequency}
            </p>
          </div>
        </div>
        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }} className={getStatusColor()}>
          {medication.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px' }}>
          <Calendar size={16} />
          <span>Duration: {medication.duration}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px' }}>
          <Clock size={16} />
          <span>Times: {medication.specificTimes?.join(', ')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px' }}>
          <Play size={16} />
          <span>Start: {new Date(medication.startDate).toLocaleDateString()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px' }}>
          <CheckCircle2 size={16} />
          <span>Adherence: {medication.adherencePercentage}%</span>
        </div>
      </div>

      {medication.instructions && (
        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#475569', marginBottom: '20px' }}>
          <strong>Instructions:</strong> {medication.instructions}
        </div>
      )}

      {medication.status === 'ACTIVE' && (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => handleAction('TAKEN')}
            style={{ flex: 1, padding: '10px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
          >
            <CheckCircle2 size={18} /> Taken
          </button>
          <button 
            onClick={() => handleAction('SKIPPED')}
            style={{ flex: 1, padding: '10px', background: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
          >
            <XCircle size={18} /> Skip
          </button>
        </div>
      )}
    </div>
  );
}
