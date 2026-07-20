import { useState } from 'react';
import { ShieldAlert, RefreshCw, Filter, Search } from 'lucide-react';
import { AlertCard } from '../components/dashboard/AlertCard';
import { useAlerts } from '../hooks/useAlerts';
import './AlertsPage.css';

export function AlertsPage() {
  const { alerts, loading } = useAlerts();
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = alerts.filter(a => {
    const matchesFilter = filter === 'All' || a.category.toLowerCase().includes(filter.toLowerCase()) || a.severity === filter;
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.district.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="alerts-page">
      <header className="alerts-header-section">
        <div className="alerts-header-left">
          <ShieldAlert size={28} className="text-red-600" />
          <h1>Public Health Intelligence</h1>
        </div>
        <button className="alerts-refresh-btn" disabled={loading}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Syncing...' : 'Live Synced'}
        </button>
      </header>

      <div className="alerts-controls" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
          <div style={{ color: '#991b1b', fontWeight: 'bold' }}>Critical Alerts</div>
          <div style={{ fontSize: '2rem', color: '#7f1d1d' }}>{alerts.filter(a => a.severity === 'Critical').length}</div>
        </div>
        <div style={{ background: '#fff7ed', padding: '16px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
          <div style={{ color: '#9a3412', fontWeight: 'bold' }}>High Severity</div>
          <div style={{ fontSize: '2rem', color: '#7c2d12' }}>{alerts.filter(a => a.severity === 'High').length}</div>
        </div>
        <div style={{ background: '#fefce8', padding: '16px', borderRadius: '8px', border: '1px solid #fef08a' }}>
          <div style={{ color: '#854d0e', fontWeight: 'bold' }}>Moderate</div>
          <div style={{ fontSize: '2rem', color: '#713f12' }}>{alerts.filter(a => a.severity === 'Moderate').length}</div>
        </div>
        <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <div style={{ color: '#166534', fontWeight: 'bold' }}>Active Monitored</div>
          <div style={{ fontSize: '2rem', color: '#14532d' }}>{alerts.length}</div>
        </div>
      </div>

      <div className="alerts-controls">
        <div className="alerts-search">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search alerts, locations, diseases..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="alerts-filters">
          <Filter size={18} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="All">All Categories</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Severity</option>
            <option value="Disease Outbreak">Disease Outbreaks</option>
            <option value="Weather">Weather</option>
            <option value="Air Quality">Air Quality</option>
          </select>
        </div>
      </div>

      <main className="alerts-content">
        {loading && alerts.length === 0 ? (
          <div className="alerts-loading">Loading real-time health intelligence...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="alerts-empty">No active alerts match your criteria.</div>
        ) : (
          <div className="alerts-grid">
            {filteredAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
