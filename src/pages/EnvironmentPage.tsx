import { useState, useEffect } from 'react';
import { EnvironmentData } from '../services/environmentMock';
import { getCurrentEnvironment } from '../services/environmentService';
import { OverviewCards } from '../components/environment/OverviewCards';
import { AirSmartCard } from '../components/environment/AirSmartCard';
import { HeatRiskCard } from '../components/environment/HeatRiskCard';
import { Leaf, Info } from 'lucide-react';
import { LoadingStatus } from '../components/LoadingStatus';
import './EnvironmentPage.css';

export function EnvironmentPage() {
  const [data, setData] = useState<EnvironmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await getCurrentEnvironment();
        if (active) {
          setData(result);
        }
      } catch (e) {
        if (active) {
          setError('Failed to load environmental data.');
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
    <div className="environment-page">
      <div className="environment-layout">
        <main className="environment-main">

          {/* Hero Section */}
          <section className="hero-banner">
            <div className="hero-banner-text">
              <span className="hero-label">DAILY INSIGHTS</span>
              <h1 className="hero-headline">Environmental Health</h1>
              <p className="hero-sub">
                Monitor air quality, heat stress and environmental risks that affect your health every day.
              </p>
              <div className="hero-badges">
                <button className="badge" style={{ cursor: 'pointer', background: '#0d9488', color: 'white' }}>Check My Area</button>
                <button className="badge" style={{ cursor: 'pointer' }}>View Recommendations</button>
              </div>
            </div>
            <div className="hero-banner-img">
              <Leaf size={140} color="#0d9488" strokeWidth={1} style={{ opacity: 0.8, marginRight: '40px', marginBottom: '20px' }} />
            </div>
          </section>

          {loading ? (
            <div style={{ maxWidth: 400, margin: '40px auto' }}>
              <LoadingStatus icon="🌍" status="Loading environmental data..." />
            </div>
          ) : error ? (
            <div className="schemes-error">⚠️ {error}</div>
          ) : data ? (
            <>
              {/* Overview Cards */}
              <OverviewCards data={data} />

              {/* Module 1: AirSmart */}
              <AirSmartCard
                airQuality={data.airQuality}
                timeline={data.airTimeline}
                greenAreas={data.nearbyGreenAreas}
              />

              {/* Module 2: Heatwave Risk */}
              <HeatRiskCard
                heat={data.heat}
                timeline={data.heatTimeline}
              />

              {/* Coming Soon Section */}
              <div className="env-coming-soon mt-4">
                <h3 className="env-section-title">Coming Soon</h3>
                <div className="env-overview-grid disabled-grid">
                  <div className="env-overview-card disabled">
                    <div className="env-card-icon-wrap bg-gray-light">
                      <span className="text-gray">💧</span>
                    </div>
                    <div className="env-card-content">
                      <div className="env-card-label">Water Quality</div>
                      <div className="env-card-status">Roadmap</div>
                    </div>
                  </div>
                  <div className="env-overview-card disabled">
                    <div className="env-card-icon-wrap bg-gray-light">
                      <span className="text-gray">🦟</span>
                    </div>
                    <div className="env-card-content">
                      <div className="env-card-label">Mosquito Risk</div>
                      <div className="env-card-status">Roadmap</div>
                    </div>
                  </div>
                  <div className="env-overview-card disabled">
                    <div className="env-card-icon-wrap bg-gray-light">
                      <span className="text-gray">🌼</span>
                    </div>
                    <div className="env-card-content">
                      <div className="env-card-label">Pollen</div>
                      <div className="env-card-status">Roadmap</div>
                    </div>
                  </div>
                  <div className="env-overview-card disabled">
                    <div className="env-card-icon-wrap bg-gray-light">
                      <span className="text-gray">🌧️</span>
                    </div>
                    <div className="env-card-content">
                      <div className="env-card-label">Flood Alerts</div>
                      <div className="env-card-status">Roadmap</div>
                    </div>
                  </div>
                  <div className="env-overview-card disabled">
                    <div className="env-card-icon-wrap bg-gray-light">
                      <span className="text-gray">🔊</span>
                    </div>
                    <div className="env-card-content">
                      <div className="env-card-label">Noise Pollution</div>
                      <div className="env-card-status">Roadmap</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page Footer CTA */}
              <div className="talk-section mt-4" style={{ textAlign: 'center', padding: '32px' }}>
                <Info size={32} className="text-teal" style={{ margin: '0 auto 16px auto' }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Stay Informed Before Stepping Outside</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                  Environmental health directly impacts chronic disease, respiratory health, and daily productivity. Check your local conditions before planning prolonged outdoor activities.
                </p>
              </div>
            </>
          ) : null}

        </main>

        {/* Right Sidebar Rail (consistent with SchemesPage layout) */}
        <aside className="schemes-rail">
          {/* Reusing existing AAYU side rail styles implicitly, but providing specific content */}
          <div className="profile-finder-card">
            <div className="pf-header">
              <Leaf size={20} className="pf-icon" />
              <h3>Location Settings</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
              Enable location to get accurate environmental data for your area.
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
              Detect Location
            </button>
          </div>

          <div className="scheme-alerts-card mt-4">
            <div className="alerts-header">
              <Info size={18} />
              <h3>Data Sources</h3>
            </div>
            <ul className="alerts-list">
              <li><span className="alert-badge new">Pending</span> Open-Meteo Integration</li>
              <li><span className="alert-badge new">Pending</span> Google Maps Integration</li>
              <li><span className="alert-badge">Mock</span> Local AQI Data</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default EnvironmentPage;
