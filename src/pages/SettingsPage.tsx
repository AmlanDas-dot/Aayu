import { useState, useEffect } from "react";
import { LANGUAGES } from "@/constants/languages";
import type { LanguageCode } from "@/constants/languages";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Globe, Shield, Info, Check, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "@/firebase/auth";

export function SettingsPage() {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [saved, setSaved] = useState(false);
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedLang = localStorage.getItem("aayu_language") as LanguageCode;
    if (savedLang && LANGUAGES[savedLang]) {
      setLanguage(savedLang);
    }
  }, []);

  function handleSave() {
    localStorage.setItem("aayu_language", language);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text)', marginBottom: '32px' }}>
        Settings
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Language Preference */}
        <div style={{ background: 'var(--white)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Globe color="var(--teal)" size={24} />
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Language Preference</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Select your preferred language for AAYU responses and voice interaction.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {(Object.entries(LANGUAGES) as [LanguageCode, string][]).map(([code, name]) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: language === code ? '2px solid var(--teal)' : '1px solid var(--border)',
                  background: language === code ? 'var(--teal-bg)' : 'var(--white)',
                  color: language === code ? 'var(--teal-dark)' : 'var(--text)',
                  fontWeight: language === code ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div style={{ background: 'var(--white)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Shield color="var(--teal)" size={24} />
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Account Information</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text)' }}>
            <div><strong>Name:</strong> {userProfile?.name || 'Loading...'}</div>
            <div><strong>Email:</strong> {currentUser?.email || 'Loading...'}</div>
            <div><strong>Role:</strong> {userProfile?.role || 'Citizen'}</div>
          </div>
          <button 
            onClick={handleLogout}
            style={{ marginTop: '24px', padding: '10px 20px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>

        {/* About */}
        <div style={{ background: 'var(--white)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Info color="var(--teal)" size={24} />
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>About AAYU</h2>
          </div>
          <p style={{ color: 'var(--text)', lineHeight: 1.6 }}>
            <strong>Version 1.0.0</strong><br />
            An AI-powered public healthcare assistant bringing expert guidance directly to you. Powered by Gemini and Firebase.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={handleSave}
          style={{ padding: '14px 28px', background: 'var(--teal)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', opacity: saved ? 0.9 : 1 }}
        >
          {saved ? <Check size={20} /> : <Save size={20} />}
          {saved ? "Saved" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
