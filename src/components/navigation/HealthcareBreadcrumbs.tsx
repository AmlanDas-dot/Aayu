import { useLocation, Link } from 'react-router-dom';
import { useHealthContext } from '../../hooks/useHealthContext';
import { ChevronRight } from 'lucide-react';

export const HealthcareBreadcrumbs = () => {
  const location = useLocation();
  const { selectedMember } = useHealthContext();

  const getPathName = (path: string) => {
    switch (path) {
      case '/family': return 'Household';
      case '/records': return 'Health Vault';
      case '/nutrition': return 'Nutrition';
      case '/hospitals': return 'Hospitals';
      case '/chat': return 'AAYU Assistant';
      case '/environment': return 'Environment';
      case '/schemes': return 'Schemes';
      case '/admin': return 'Dashboard';
      default: return path.substring(1).charAt(0).toUpperCase() + path.substring(2);
    }
  };

  const currentPath = location.pathname;

  if (currentPath === '/' || currentPath === '/admin' || currentPath === '/environment') return null;

  return (
    <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
      <Link to="/family" style={{ color: '#0d9488', textDecoration: 'none', fontWeight: 600 }}>Family</Link>
      
      {selectedMember && (
        <>
          <ChevronRight size={14} />
          <Link to="/family" style={{ color: '#0f766e', textDecoration: 'none', fontWeight: 600 }}>{selectedMember.name}</Link>
        </>
      )}

      {currentPath !== '/family' && (
        <>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text)' }}>{getPathName(currentPath)}</span>
        </>
      )}
    </div>
  );
};
