import { useState, useEffect } from 'react';
import { EnvironmentData } from '../services/environmentMock';
import { getCurrentEnvironment } from '../services/environmentService';
import { getPersonalizedRecommendation } from '../services/aiRecommendationService';
import { OverviewCards } from '../components/environment/OverviewCards';
import { AirSmartCard } from '../components/environment/AirSmartCard';
import { HeatRiskCard } from '../components/environment/HeatRiskCard';
import { Leaf } from 'lucide-react';
import { LoadingStatus } from '../components/LoadingStatus';
import './EnvironmentPage.css';

// Mock user context hook if useAuth doesn't exist yet
const useAuth = () => {
  return {
    userProfile: {
      name: "User",
      role: "Citizen",
      medicalHistory: ["Asthma"],
      chronicConditions: ["Hypertension"]
    }
  };
};

export function EnvironmentPage() {
  const { userProfile } = useAuth();
  const [data, setData] = useState<EnvironmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);

  useEffect(() => {
    let active = true;

    const loadData = async (lat: number, lon: number) => {
      try {
        setLoading(true);
        const result = await getCurrentEnvironment(lat, lon);
        
        // Generate Personalized Recommendation dynamically
        const aiRec = await getPersonalizedRecommendation(result, userProfile);
        result.heat.recommendation = aiRec; // Inject AI recommendation

        if (active) {
          setData(result);
        }
      } catch (e) {
        if (active) setError('Failed to load environmental data.');
      } finally {
        if (active) setLoading(false);
      }
    };

    // Get Geolocation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          if (active) setUserLocation({ lat, lon });
          loadData(lat, lon);
        },
        (error) => {
          console.warn("Geolocation blocked/failed. Using defaults.", error);
          // Default to a central location (e.g., Patna) if blocked
          const defaultLat = 25.5941;
          const defaultLon = 85.1376;
          if (active) setUserLocation({ lat: defaultLat, lon: defaultLon });
          loadData(defaultLat, defaultLon);
        }
      );
    } else {
      // Fallback
      loadData(25.5941, 85.1376);
    }

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="environment-page page-container">
      <div className="environment-layout">
        <main className="environment-main">

          {/* Hero Section */}
          <section className="hero-banner">
            <div className="hero-banner-text">
              <span className="hero-label">LIVE INTELLIGENCE</span>
              <h1 className="hero-headline">Environmental Health</h1>
              <p className="hero-sub">
                Live monitoring of air quality, heat stress and personalized environmental risks.
              </p>
            </div>
            <div className="hero-banner-img">
              <Leaf size={140} color="#0d9488" strokeWidth={1} style={{ opacity: 0.8, marginRight: '40px', marginBottom: '20px' }} />
            </div>
          </section>

          {loading ? (
            <div style={{ maxWidth: 400, margin: '40px auto' }}>
              <LoadingStatus icon="🌍" status="Fetching live environment & API data..." />
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
                userLat={userLocation?.lat}
                userLon={userLocation?.lon}
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
                </div>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
