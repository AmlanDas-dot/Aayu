import React from 'react';
import { X, Camera } from 'lucide-react';

interface AddMemberModalProps {
  onClose: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>Add Family Member</h3>
          <button className="btn-close" onClick={onClose} aria-label="Close modal"><X size={20} /></button>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: '#f1f5f9', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer' }}>
            <Camera size={28} />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input id="fullName" type="text" placeholder="e.g. Rahul Kumar" />
          </div>
          
          <div className="form-group">
            <label htmlFor="relation">Relationship</label>
            <select id="relation">
              <option>Spouse</option>
              <option>Child</option>
              <option>Parent</option>
              <option>Sibling</option>
              <option>Other</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="age">Age</label>
            <input id="age" type="number" placeholder="e.g. 30" />
          </div>

          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select id="gender">
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="bloodGroup">Blood Group</label>
            <select id="bloodGroup">
              <option>Unknown</option>
              <option>A+</option>
              <option>A-</option>
              <option>B+</option>
              <option>B-</option>
              <option>O+</option>
              <option>O-</option>
              <option>AB+</option>
              <option>AB-</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="emergencyContact">Emergency Contact</label>
            <input id="emergencyContact" type="tel" placeholder="+91" />
          </div>

          <div className="form-group full-width">
            <label htmlFor="conditions">Known Conditions (Comma separated)</label>
            <input id="conditions" type="text" placeholder="e.g. Hypertension, Diabetes" />
          </div>

          <div className="form-group full-width">
            <label htmlFor="allergies">Known Allergies</label>
            <input id="allergies" type="text" placeholder="e.g. Penicillin, Peanuts" />
          </div>

          <div className="form-group full-width">
            <label htmlFor="medications">Current Medications</label>
            <input id="medications" type="text" placeholder="e.g. Metformin 500mg" />
          </div>
        </div>
        
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onClose}>
            Save Member
          </button>
        </div>
      </div>
    </div>
  );
};
