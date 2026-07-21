import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RecoveryScoreGauge } from '../components/recovery/RecoveryScoreGauge';

import { JournalAndMood } from '../components/recovery/JournalAndMood';
import { LongitudinalAnalytics } from '../components/recovery/LongitudinalAnalytics';
import { HabitStreaks } from '../components/recovery/HabitStreaks';
import { DailyMissions } from '../components/recovery/DailyMissions';
import { ShieldAlert, HeartPulse, BrainCircuit, Users, Rocket } from 'lucide-react';
import { RecoveryOnboarding } from '../components/recovery/RecoveryOnboarding';
import { getRecoveryProfile, startRecoveryJourney, logRelapse, RecoveryProfile } from '../services/recoveryService';
import './RecoveryPage.css';

export const RecoveryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<RecoveryProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      if (!currentUser?.uid) return;
      const data = await getRecoveryProfile(currentUser.uid);
      setProfile(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

  const handleStartOnboarding = () => setShowOnboarding(true);

  const handleCompleteOnboarding = async (formData: any) => {
    if (!currentUser?.uid) return;
    await startRecoveryJourney(currentUser.uid, formData);
    setShowOnboarding(false);
    fetchProfile();
  };

  const handleRelapse = async () => {
    if (!currentUser?.uid) return;
    if (confirm("Are you sure you want to log a relapse? This will gently reduce your score and reset your streak, but your history is preserved. We are here to support you!")) {
      await logRelapse(currentUser.uid);
      fetchProfile();
    }
  };

  // Calculate streak in days based on start date or last relapse
  const calculateStreak = () => {
    if (!profile) return 0;
    const baseDate = profile.lastRelapse ? new Date(profile.lastRelapse) : new Date(profile.startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - baseDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Addiction profile...</div>;
  }

  // State: Not Started
  if (!profile && !showOnboarding) {
    return (
      <div className="recovery-dashboard" style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '48px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', maxWidth: '500px' }}>
          <Rocket size={48} color="#0284c7" style={{ margin: '0 auto 20px auto' }} />
          <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', color: '#0f172a' }}>No recovery journey has been started yet.</h2>
          <p style={{ margin: '0 0 32px 0', color: '#64748b' }}>Take the first step towards a healthier you. Track your progress, manage triggers, and build positive habits.</p>
          <button
            onClick={handleStartOnboarding}
            style={{ padding: '16px 32px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
          >
            Start Recovery Journey
          </button>
        </div>
      </div>
    );
  }

  // State: Onboarding
  if (showOnboarding) {
    return (
      <div className="recovery-dashboard" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
        <RecoveryOnboarding onComplete={handleCompleteOnboarding} onCancel={() => setShowOnboarding(false)} />
      </div>
    );
  }

  // State: Active Journey
  return (
    <div className="recovery-dashboard" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#0f172a', fontWeight: 'bold' }}>Addiction Recovery</h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>Track your progress, understand your triggers, and stay on the path to recovery.</p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: 'white', fontSize: '16px', fontWeight: '500', color: '#0f172a' }}>
            {profile?.type} Recovery
          </div>
          <button onClick={handleRelapse} style={{ padding: '12px 16px', borderRadius: '12px', border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} /> Log Relapse
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Top Row: Gauge & Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '24px' }}>
            <RecoveryScoreGauge score={profile?.score || 0} trend={"stable"} riskLevel={profile?.status === "Relapsed" ? "High" : "Low"} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <HeartPulse color="#ef4444" size={24} style={{ marginBottom: '12px' }} />
                <h4 style={{ margin: 0, color: '#64748b' }}>Streak</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{calculateStreak()} Days</div>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <BrainCircuit color="#8b5cf6" size={24} style={{ marginBottom: '12px' }} />
                <h4 style={{ margin: 0, color: '#64748b' }}>Relapses</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{profile?.relapses || 0}</div>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users color="#0284c7" size={20} />
                    <h4 style={{ margin: 0, color: '#0f172a' }}>Your Support Team</h4>
                  </div>
                </div>
                {profile?.supportSystem ? (
                  <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '14px' }}>{profile.supportSystem}</p>
                ) : (
                  <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>No support members added.</p>
                )}
              </div>
            </div>
          </div>

          {/* Analytics, Streaks & Missions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <DailyMissions />
            <HabitStreaks />
          </div>

          <LongitudinalAnalytics />

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <JournalAndMood onJournalLogged={fetchProfile} />

          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Doctor Insights</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>No insights yet. Complete more journals for AI observations.</p>
          </div>
        </div>

      </div>
    </div>
  );
};
