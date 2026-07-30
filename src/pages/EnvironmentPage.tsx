import { useState, useEffect } from 'react';
import type { EnvironmentData } from '../types/environment';
import { getCurrentEnvironment } from '../services/environmentService';
import { getPersonalizedRecommendation } from '../services/aiRecommendationService';
import { OverviewCards } from '../components/environment/OverviewCards';
import { AirSmartCard } from '../components/environment/AirSmartCard';
import { HeatRiskCard } from '../components/environment/HeatRiskCard';
import { Leaf } from 'lucide-react';
import { LoadingStatus } from '../components/LoadingStatus';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import './EnvironmentPage.css';

export function EnvironmentPage() {
  const { userProfile } = useAuth();
  const [data, setData] = useState<EnvironmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);

  // Build a profile for the AI recommendation engine from real Firestore health data.
  // Falls back to empty arrays if the user has not filled in their health profile yet.
  const aiUserProfile = {
    name: userProfile?.name || 'User',
    role: userProfile?.role || 'citizen',
    chronicConditions: userProfile?.healthProfile?.chronicConditions ?? [],
    allergies: userProfile?.healthProfile?.allergies ?? [],
  };

  const { location, error: locationError } = useCurrentLocation();

  useEffect(() => {
    let active = true;

    const loadData = async (lat: number, lon: number) => {
      try {
        setLoading(true);
        const result = await getCurrentEnvironment(lat, lon);
        
        // Generate Personalized Recommendation using real user health profile
        const aiRec = await getPersonalizedRecommendation(result, aiUserProfile);
        result.heat.recommendation = aiRec; // Inject AI recommendation

        if (active) {
          setData(result);
          setError('');
        }
      } catch (e: any) {
        if (active) setError('Failed to load environmental data.');
      } finally {
        if (active) setLoading(false);
      }
    };

    if (location) {
      if (active) setUserLocation({ lat: location.lat, lon: location.lng });
      loadData(location.lat, location.lng);
    } else if (locationError) {
      if (active) {
        setError("Location access is required to load live environmental data. Please enable location permissions in your browser and refresh.");
        setLoading(false);
      }
    }

    return () => {
      active = false;
    };
  }, [location, locationError]);

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


            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
