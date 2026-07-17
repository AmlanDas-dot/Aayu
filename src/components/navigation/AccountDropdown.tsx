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
      <div onClick={() => setIsOpen(!isOpen)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {userProfile?.photoURL ? (
          <img
            src={userProfile.photoURL}
            alt="Profile"
            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <i className="fa-regular fa-user"></i>
        )}
        <span>{displayName}</span>
        <i className="fa-solid fa-chevron-down"></i>
      </div>

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
          
          <div 
            onClick={() => { setIsOpen(false); navigate("/account"); }}
            style={{ padding: '12px 16px', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <i className="fa-regular fa-user" style={{ width: '16px' }}></i> My Account
          </div>
          
          <div 
            onClick={() => { setIsOpen(false); navigate("/account?tab=preferences"); }}
            style={{ padding: '12px 16px', color: '#333', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #eee' }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <i className="fa-solid fa-gear" style={{ width: '16px' }}></i> Preferences
          </div>
          
          <div 
            onClick={handleLogout}
            style={{ padding: '12px 16px', color: '#e53e3e', display: 'flex', alignItems: 'center', gap: '8px' }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <i className="fa-solid fa-arrow-right-from-bracket" style={{ width: '16px' }}></i> Sign out
          </div>
        </div>
      )}
    </div>
  );
}
