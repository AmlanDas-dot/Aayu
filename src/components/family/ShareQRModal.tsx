import React from 'react';
import { X, QrCode, Share2, Download, Printer, ShieldCheck, WifiOff } from 'lucide-react';

interface ShareQRModalProps {
  onClose: () => void;
}

export const ShareQRModal: React.FC<ShareQRModalProps> = ({ onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>Share Family Records</h3>
          <button className="btn-close" onClick={onClose} aria-label="Close modal"><X size={20} /></button>
        </div>
        
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '24px', textAlign: 'center' }}>
          Present this QR code to any ASHA worker or registered doctor to instantly share your household's medical history.
        </p>

        <div className="qr-container">
          <div className="qr-box">
            <QrCode size={160} className="text-teal" />
          </div>
          
          <div className="qr-details">
            <div className="qr-id">ID: AAYU-HH-847291</div>
            <div className="qr-meta">
              <strong>Kumar Household</strong> • Phulwari Sharif, Patna<br/>
              4 Family Members Linked
            </div>
            <div className="qr-badges">
              <span className="qr-badge badge-offline"><WifiOff size={14} /> Offline Available</span>
              <span className="qr-badge badge-worker"><ShieldCheck size={14} /> Valid for Healthcare Scan</span>
            </div>
          </div>
        </div>
        
        <div className="modal-actions" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Download
          </button>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={18} /> Print
          </button>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={18} /> Share Secure Link
          </button>
        </div>
      </div>
    </div>
  );
};
