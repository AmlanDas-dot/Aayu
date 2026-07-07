import { Share2 } from "lucide-react";

export function ShareSection() {
  return (
    <div className="rail-help-card">
      <div className="rhc-inner">
        <div className="rhc-content">
          <div className="rhc-title">Share with Doctor</div>
          <p className="rhc-desc">Securely share your records with your doctor using a unique code or QR.</p>
          <button className="rhc-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={16} /> Share Now
          </button>
        </div>
      </div>
    </div>
  );
}
