import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createFamily } from '@/services/familyService';
import { ArrowLeft, Save } from 'lucide-react';

interface Props {
  onCancel: () => void;
  onSuccess: () => void;
}

export const CreateFamilyWizard: React.FC<Props> = ({ onCancel, onSuccess }) => {
  const { currentUser, userProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    photoURL: '',
    primaryCaregiver: userProfile?.name || currentUser?.displayName || '',
    address: '',
    motto: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!formData.name.trim()) {
      setError("Family name is required");
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await createFamily(
        currentUser.uid,
        userProfile?.name || currentUser.displayName || 'Admin',
        formData
      );
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create family');
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

      <h2 style={{ marginBottom: '24px' }}>Create Your Family Hub</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && <div style={{ color: 'red', fontSize: '0.9rem' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '500' }}>Family Name *</label>
          <input 
            type="text" 
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. The Sharma Family"
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            disabled={loading}
            maxLength={100}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '500' }}>Primary Caregiver</label>
          <input 
            type="text" 
            name="primaryCaregiver"
            value={formData.primaryCaregiver}
            onChange={handleChange}
            placeholder="Name of main caregiver"
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            disabled={loading}
            maxLength={100}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '500' }}>Address (Optional)</label>
          <textarea 
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Full residential address"
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', minHeight: '80px' }}
            disabled={loading}
            maxLength={500}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '500' }}>Family Motto (Optional)</label>
          <input 
            type="text" 
            name="motto"
            value={formData.motto}
            onChange={handleChange}
            placeholder="e.g. Health is Wealth"
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            disabled={loading}
            maxLength={200}
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
          {loading ? 'Creating...' : <><Save size={20} /> Create Family</>}
        </button>
      </form>
    </div>
  );
};
