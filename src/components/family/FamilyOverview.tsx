import React from 'react';
import { FamilyData } from '../../data/familyMock';
import { Phone, Users, MapPin, HeartPulse, Baby, UserCheck } from 'lucide-react';

interface FamilyOverviewProps {
  overview: FamilyData['overview'];
}

export const FamilyOverview: React.FC<FamilyOverviewProps> = ({ overview }) => {
  return (
    <section className="family-dashboard mb-6">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>{overview.householdName}</h2>
          <div className="dashboard-subtitle">
            <MapPin size={16} />
            {overview.village}, {overview.district}, {overview.state}
          </div>
        </div>
        <div className="dashboard-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Assigned ASHA Worker</div>
          <div style={{ fontWeight: 600, color: '#0d9488', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserCheck size={16} />
            {overview.ashaWorker}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-item">
          <div className="dashboard-label">
            <Users size={16} />
            Total Members
          </div>
          <div className="dashboard-value">{overview.totalMembers}</div>
        </div>

        <div className="dashboard-item">
          <div className="dashboard-label" style={{ color: '#ea580c' }}>
            <HeartPulse size={16} />
            Chronic Patients
          </div>
          <div className="dashboard-value">{overview.chronicPatientsCount}</div>
        </div>

        <div className="dashboard-item">
          <div className="dashboard-label">
            <Users size={16} />
            Elderly ({'>'}65)
          </div>
          <div className="dashboard-value">{overview.elderlyCount}</div>
        </div>

        <div className="dashboard-item">
          <div className="dashboard-label">
            <Baby size={16} />
            Children
          </div>
          <div className="dashboard-value">{overview.childrenCount}</div>
        </div>
        
        <div className="dashboard-item">
          <div className="dashboard-label">
            <Phone size={16} />
            Primary Contact
          </div>
          <div className="dashboard-value">{overview.primaryContact}</div>
        </div>
        
        <div className="dashboard-item">
          <div className="dashboard-label">Language</div>
          <div className="dashboard-value">{overview.primaryLanguage}</div>
        </div>

        <div className="dashboard-item">
          <div className="dashboard-label">Socio-Economic</div>
          <div className="dashboard-value">{overview.socioEconomicCategory}</div>
        </div>
      </div>
    </section>
  );
};
