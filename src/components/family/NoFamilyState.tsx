import React from 'react';
import { Users, UserPlus } from 'lucide-react';

interface Props {
  onCreate: () => void;
  onJoin: () => void;
}

export const NoFamilyState: React.FC<Props> = ({ onCreate, onJoin }) => {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <Users size={80} color="#0d9488" style={{ marginBottom: '20px', opacity: 0.8 }} />
      <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--text-color)' }}>No Family Found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto 40px auto' }}>
        You aren't part of any family yet. Create a new family to start managing health profiles, or join an existing one.
      </p>

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <button 
          onClick={onCreate}
          style={{
            padding: '12px 24px',
            backgroundColor: '#0d9488',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={20} /> Create Family
        </button>
        <button 
          onClick={onJoin}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            color: '#0d9488',
            border: '2px solid #0d9488',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <UserPlus size={20} /> Join Family
        </button>
      </div>
    </div>
  );
};
