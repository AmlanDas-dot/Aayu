import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { joinFamilyWithToken } from '@/services/familyService';
import { ArrowLeft, UserPlus } from 'lucide-react';

interface Props {
  onCancel: () => void;
  onSuccess: () => void;
}

export const JoinFamilyWizard: React.FC<Props> = ({ onCancel, onSuccess }) => {
  const { currentUser, userProfile } = useAuth();
  
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!joinCode.trim()) {
      setError("Please enter a join code");
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await joinFamilyWithToken(
        currentUser.uid,
        userProfile?.name || currentUser.displayName || 'Family Member',
        joinCode.trim().toUpperCase()
      );
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to join family');
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <button 
        onClick={onCancel}
        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}
      >
        <ArrowLeft size={18} /> Back
      </button>

      <h2 style={{ marginBottom: '12px' }}>Join a Family</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        Enter the 6-character join code provided by your family administrator.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && <div style={{ color: 'red', fontSize: '0.9rem' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '500' }}>Join Code</label>
          <input 
            type="text" 
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="e.g. A1B2C3"
            style={{ 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #ccc',
              fontSize: '1.2rem',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}
            disabled={loading}
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          style={{
            marginTop: '10px',
            padding: '14px',
            backgroundColor: '#0d9488',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {loading ? 'Joining...' : <><UserPlus size={20} /> Join Family</>}
        </button>

        <div style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)' }}>
          <p>Or scan a QR code (Coming soon to mobile)</p>
        </div>
      </form>
    </div>
  );
};
