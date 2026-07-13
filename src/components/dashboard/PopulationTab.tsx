import React, { useState } from 'react';
import { DashboardData } from '../../data/dashboardMock';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';

interface PopulationTabProps {
  population: DashboardData['population'];
}

export const PopulationTab: React.FC<PopulationTabProps> = ({ population }) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const popItems = [
    { id: 'children', label: 'Children (0-14)', value: population.children, details: '15% undernourished. Primary focus: Immunization.' },
    { id: 'pregnant', label: 'Pregnant Women', value: population.pregnantWomen, details: '45% registered for ANC. Primary focus: Iron supplements.' },
    { id: 'seniors', label: 'Senior Citizens (65+)', value: population.seniorCitizens, details: 'High risk of heat stroke. Primary focus: Routine checkups.' },
    { id: 'disabled', label: 'Disabled Persons', value: population.disabled, details: '60% receiving pension. Primary focus: Accessibility.' },
    { id: 'chronic', label: 'Chronic Patients', value: population.chronicPatients, details: 'Top conditions: Diabetes, Hypertension. Primary focus: Med adherence.' }
  ];

  return (
    <div className="population-tab">
      <div className="dashboard-filters">
        <select className="filter-select"><option>Village: All</option></select>
        <select className="filter-select"><option>Ward: All</option></select>
        <select className="filter-select"><option>Gender: All</option></select>
        <select className="filter-select"><option>Age: All</option></select>
        <select className="filter-select"><option>Risk Level: All</option></select>
        <select className="filter-select"><option>Scheme: All</option></select>
      </div>

      <div className="population-cards">
        {popItems.map(item => (
          <div key={item.id} className="expandable-card">
            <div className="expandable-header" onClick={() => toggleCard(item.id)}>
              <div className="expandable-title">
                <Users size={20} className="text-teal" />
                {item.label}
              </div>
              <div className="expandable-stats">
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{item.value.toLocaleString()}</div>
                {expandedCard === item.id ? <ChevronUp size={20} className="text-gray" /> : <ChevronDown size={20} className="text-gray" />}
              </div>
            </div>
            {expandedCard === item.id && (
              <div className="expandable-body">
                <p style={{ margin: '16px 0 0 0', color: 'var(--text-muted)' }}>{item.details}</p>
                <div style={{ marginTop: '16px' }}>
                  <button className="btn-outline">View Detailed Roster</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
