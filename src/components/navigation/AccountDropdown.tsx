import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function AccountDropdown() {
  const { userProfile, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = userProfile?.name || currentUser?.displayName || "User";
  // const initials = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await logout();
    }
  };

  return (
    <div className="profile-item" style={{ position: 'relative', cursor: 'pointer' }} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        aria-haspopup="true"
        aria-expanded={isOpen}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', font: 'inherit' }}
      >
        {userProfile?.photoURL ? (
          <img
            src={userProfile.photoURL}
            alt="Profile"
            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <i className="fa-regular fa-user" aria-hidden="true"></i>
        )}
        <span>{displayName}</span>
        <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          minWidth: '200px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
            <div style={{ fontWeight: 'bold', color: '#333' }}>{displayName}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{currentUser?.email}</div>
          </div>
          
          <button 
            onClick={() => { setIsOpen(false); navigate("/account"); }}
            style={{ width: '100%', textAlign: 'left', padding: '12px 16px', color: '#333', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit' }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <i className="fa-regular fa-user" style={{ width: '16px' }} aria-hidden="true"></i> My Account
          </button>
          
          <button 
            onClick={() => { setIsOpen(false); navigate("/account?tab=preferences"); }}
            style={{ width: '100%', textAlign: 'left', padding: '12px 16px', color: '#333', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #eee', borderTop: 'none', borderLeft: 'none', borderRight: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit' }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <i className="fa-solid fa-gear" style={{ width: '16px' }} aria-hidden="true"></i> Preferences
          </button>
          
          <button 
            onClick={handleLogout}
            style={{ width: '100%', textAlign: 'left', padding: '12px 16px', color: '#e53e3e', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit' }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <i className="fa-solid fa-arrow-right-from-bracket" style={{ width: '16px' }} aria-hidden="true"></i> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
