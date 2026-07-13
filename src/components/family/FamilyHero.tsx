import React from 'react';
import { Users } from 'lucide-react';

interface FamilyHeroProps {
  onAddMember: () => void;
  onShareQR: () => void;
}

export const FamilyHero: React.FC<FamilyHeroProps> = ({ onAddMember, onShareQR }) => {
  return (
    <section className="hero-banner">
      <div className="hero-banner-text">
        <span className="hero-label">FAMILY HUB</span>
        <h1 className="hero-headline">Family & Sharing</h1>
        <p className="hero-sub">
          Manage health profiles for all your family members and share records securely with caregivers or doctors.
        </p>
        <div className="hero-badges">
          <button className="badge" style={{ cursor: 'pointer', background: '#0d9488', color: 'white' }} onClick={onAddMember}>
            Add Family Member
          </button>
          <button className="badge" style={{ cursor: 'pointer' }} onClick={onShareQR}>
            Share Family QR
          </button>
        </div>
      </div>
      <div className="hero-banner-img">
        <Users size={140} color="#0d9488" strokeWidth={1} style={{ opacity: 0.8, marginRight: '40px', marginBottom: '20px' }} />
      </div>
    </section>
  );
};
