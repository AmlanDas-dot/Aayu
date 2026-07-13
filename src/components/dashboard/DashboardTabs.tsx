import React from 'react';

export type TabName = 'Overview' | 'Population' | 'Surveillance' | 'Workers' | 'Environment' | 'Schemes' | 'Alerts';

interface DashboardTabsProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

const TABS: TabName[] = [
  'Overview',
  'Population',
  'Surveillance',
  'Workers',
  'Environment',
  'Schemes',
  'Alerts'
];

export const DashboardTabs: React.FC<DashboardTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="dashboard-tabs-container">
      {TABS.map(tab => (
        <button
          key={tab}
          className={`dashboard-tab ${activeTab === tab ? 'active' : ''}`}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
