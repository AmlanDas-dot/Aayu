
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Loading...", className = '' }: LoadingStateProps) {
  return (
    <div className={`loading-state-container ${className}`} style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 className="animate-spin" size={40} style={{ color: '#0284c7', marginBottom: '16px' }} strokeWidth={2} />
      <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '500', margin: 0 }}>{message}</p>
    </div>
  );
}
