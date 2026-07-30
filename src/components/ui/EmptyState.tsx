
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, actionText, onAction, className = '' }: EmptyStateProps) {
  return (
    <div className={`empty-state-container ${className}`} style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#f1f5f9', padding: '20px', borderRadius: '50%', marginBottom: '24px' }}>
        <Icon size={48} style={{ color: '#94a3b8' }} strokeWidth={1.5} />
      </div>
      <h3 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '20px', fontWeight: 'bold' }}>{title}</h3>
      <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '15px', maxWidth: '400px', lineHeight: '1.5' }}>{description}</p>
      
      {actionText && onAction && (
        <button 
          onClick={onAction}
          style={{ padding: '12px 28px', backgroundColor: '#0284c7', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '15px', transition: 'background-color 0.2s', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0369a1'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
