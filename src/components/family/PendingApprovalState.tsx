import React from 'react';
import { Clock, ShieldAlert } from 'lucide-react';

export const PendingApprovalState: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div style={{ width: '80px', height: '80px', background: '#fef3c7', color: '#d97706', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <Clock size={40} />
      </div>
      <h2 style={{ fontSize: '1.75rem', marginBottom: '16px', color: '#1e293b' }}>Waiting for Approval</h2>
      <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '400px', margin: '0 auto 32px', lineHeight: '1.5' }}>
        You have successfully requested to join the family. The family administrator must approve your request before you can access shared health records and features.
      </p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#f1f5f9', color: '#475569', borderRadius: '8px', fontSize: '0.95rem' }}>
        <ShieldAlert size={18} /> Please check back later or notify the family admin.
      </div>
    </div>
  );
};
