import { useState } from 'react';
import { useAlerts } from '@/hooks/useAlerts';
import { AlertTriangle, Clock, MapPin, ShieldAlert, CloudRain, Wind, Activity, Newspaper, Shield } from 'lucide-react';
import './LiveAlertsSidebar.css';


const getSeverityClass = (severity: string) => {
    switch (severity?.toLowerCase()) {
        case 'high': return 'alert-high';
        case 'medium': return 'alert-medium';
        case 'low': return 'alert-low';
        default: return 'alert-medium';
    }
};

const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
        case 'disease': return <Activity size={16} />;
        case 'weather': return <CloudRain size={16} />;
        case 'environmental': return <Wind size={16} />;
        case 'vaccination': return <Shield size={16} />;
        case 'government': return <Newspaper size={16} />;
        case 'emergency': return <AlertTriangle size={16} />;
        default: return <ShieldAlert size={16} />;
    }
};

interface LiveAlertsSidebarProps {
    onAlertClick?: (lat: number, lng: number) => void;
}

export const LiveAlertsSidebar = ({ onAlertClick }: LiveAlertsSidebarProps = {}) => {
    const { alerts, loading } = useAlerts();
    const [activeFilter, setActiveFilter] = useState('All');

    const filters = ['All', 'Disease', 'Weather', 'Environmental', 'Vaccination', 'Government', 'Emergency'];

    const filteredAlerts = alerts.filter(a => activeFilter === 'All' || a.category.toLowerCase() === activeFilter.toLowerCase());

    return (
        <div className="live-alerts-sidebar">
            <div className="las-header">
                <div className="las-title-row">
                    <h3><div className="live-dot"></div> Live Health Intelligence</h3>
                </div>
                <div className="las-status">
                    <span>{loading ? "Refreshing..." : "Live"}</span>
                    <span className="las-time">Just now</span>
                </div>
            </div>

            <div className="las-filters">
                {filters.map(f => (
                    <button 
                        key={f} 
                        className={`las-filter-btn ${activeFilter === f ? 'active' : ''}`}
                        onClick={() => setActiveFilter(f)}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="las-feed">
                {loading && alerts.length === 0 ? (
                    <div className="las-empty">Loading latest alerts...</div>
                ) : filteredAlerts.length === 0 ? (
                    <div className="las-empty">No active alerts for this category.</div>
                ) : (
                    filteredAlerts.map(alert => (
                        <div key={alert.id} className={`las-card ${getSeverityClass(alert.severity)}`}>
                            <div className="las-card-header">
                                <span className={`las-badge ${getSeverityClass(alert.severity)}`}>
                                    {alert.severity?.toUpperCase() || 'UPDATE'}
                                </span>
                                <span className="las-time-text"><Clock size={12}/> 2 hours ago</span>
                            </div>
                            
                            <h4 className="las-card-title">{alert.title}</h4>
                            
                            <div className="las-card-meta">
                                <span className="las-location"><MapPin size={12}/> {alert.district || alert.village || 'Region-wide'}</span>
                                <span className="las-category">{getCategoryIcon(alert.category)} {alert.category}</span>
                            </div>
                            
                            <p className="las-card-summary">"{alert.summary}"</p>
                            
                            <div className="las-card-actions">
                                <button className="las-btn-primary">View Details</button>
                                <button className="las-btn-secondary" onClick={() => {
                                    const lat = (alert as any).lat;
                                    const lng = (alert as any).lng;
                                    if (onAlertClick && lat && lng) onAlertClick(lat, lng);
                                }}>Navigate</button>
                                <button className="las-btn-icon" title="Share"><i className="fa-solid fa-share-nodes"></i></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="las-ai-insights">
                <div className="las-ai-header">
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    <span>Today's Public Health Summary</span>
                </div>
                <p>"Low respiratory risk today. Dengue activity increasing in nearby wards."</p>
            </div>
        </div>
    );
};
