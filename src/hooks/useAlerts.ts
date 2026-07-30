import { useState, useEffect } from 'react';
import { AlertData } from '../components/dashboard/AlertCard';
import { isDemoSession } from '@/utils/demoMode';
import { reverseGeocode } from '@/services/jurisdictionService';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { config } from '@/config';

function buildDemoAlerts(district: string, state: string): AlertData[] {
  return [
    {
      id: 'demo-alert-1',
      title: 'Dengue cluster watch',
      summary: 'Fever cases are rising in two wards with stagnant-water exposure.',
      description: 'A demo public-health alert generated for judge walkthroughs.',
      category: 'Disease Outbreak',
      severity: 'High',
      state,
      district,
      village: 'Nearby area',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      source: 'AAYU Public Health Intelligence',
      status: 'Active',
      recommendations: ['Increase fever screening', 'Remove stagnant water', 'Stock ORS and rapid tests'],
      ai_summary: 'Likely seasonal vector-borne cluster requiring source reduction.',
    },
    {
      id: 'demo-alert-2',
      title: 'Heat advisory',
      summary: 'Heat index is expected to stay elevated during afternoon hours.',
      description: 'A demo environmental alert for hydration and outdoor-work planning.',
      category: 'Heatwave',
      severity: 'Warning',
      state,
      district,
      village: 'District-wide',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      source: 'AAYU Weather Monitor',
      status: 'Active',
      recommendations: ['Avoid outdoor work from 12 PM to 4 PM', 'Activate hydration points', 'Check on older adults'],
      ai_summary: 'Prevent dehydration and heat stress in vulnerable groups.',
    },
  ];
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const { location, loading: locationLoading } = useCurrentLocation();

  useEffect(() => {
    if (isDemoSession()) {
      if (locationLoading) return;
      
      if (location) {
        reverseGeocode(location.lat, location.lng)
          .then((info) => {
            setAlerts(buildDemoAlerts(info.district, info.state));
            setLoading(false);
          })
          .catch(() => {
            setAlerts(buildDemoAlerts('Your District', 'Your State'));
            setLoading(false);
          });
      } else {
        setAlerts(buildDemoAlerts('Your District', 'Your State'));
        setLoading(false);
      }
      return;
    }

    let active = true;
    
    const fetchAlerts = async () => {
      try {
        const url = `${config.apiBaseUrl}/public-health/alerts?lat=${location!.lat}&lon=${location!.lng}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch alerts");
        const data = await res.json();
        if (active) {
          setAlerts(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching alerts from API: ", error);
        if (active) {
          setLoading(false);
        }
      }
    };

    if (location && !locationLoading) {
      fetchAlerts();
    }

    return () => { active = false; };
  }, [location, locationLoading]);

  return { alerts, loading };
}
