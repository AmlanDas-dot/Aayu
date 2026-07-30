import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupWithEmail, loginWithGoogle } from "@/firebase/auth";
import {
  CheckCircle2,
  HeartPulse,
  Lock,
  Mail,
  Stethoscope,
  User,
  UserRound,
  ArrowRight,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import {
  DEFAULT_ROLE,
  DEFAULT_USER_STATUS,
  SignupUserRole,
  USER_ROLE,
} from "@/rbac/permissions";

interface AccountTypeOption {
  role: SignupUserRole;
  title: string;
  description: string;
  Icon: LucideIcon;
}

const ACCOUNT_TYPE_OPTIONS: AccountTypeOption[] = [
  {
    role: USER_ROLE.CITIZEN,
    title: "Personal & Family",
    description: "I want to manage health for myself and my family.",
    Icon: UserRound,
  },
  {
    role: USER_ROLE.ASHA_WORKER,
    title: "ASHA / Health Worker",
    description: "I am a community health worker managing patients.",
    Icon: HeartPulse,
  },
  {
    role: USER_ROLE.DOCTOR,
    title: "Doctor",
    description: "I am a licensed medical professional.",
    Icon: Stethoscope,
  },
];

export const SignupPage = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<SignupUserRole>(DEFAULT_ROLE);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signupWithEmail(email, password, name, selectedRole, DEFAULT_USER_STATUS);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to create an account");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle(selectedRole, DEFAULT_USER_STATUS);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container" style={{ padding: '40px 20px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="signup-card" style={{ maxWidth: '480px', width: '100%', padding: '40px' }}>
        
        {step === 1 && (
          <div className="step-1-role-selection">
            <div className="signup-header">
              <h2 className="signup-title">Welcome to AAYU</h2>
              <p className="signup-subtitle">How will you be using AAYU?</p>
            </div>

            <div className="account-type-grid" role="radiogroup" aria-label="Select account type" style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '30px 0' }}>
              {ACCOUNT_TYPE_OPTIONS.map(({ role, title, description, Icon }) => {
                const isSelected = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    className={`account-type-card ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedRole(role)}
                    aria-checked={isSelected}
                    role="radio"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', 
                      borderRadius: '16px', border: isSelected ? '2px solid var(--teal)' : '1px solid var(--border)',
                      background: isSelected ? 'var(--teal-bg)' : 'var(--white)', cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.2s'
                    }}
                  >
                    <span className="account-type-icon" style={{ color: isSelected ? 'var(--teal)' : 'var(--text-muted)' }}>
                      <Icon size={28} />
                    </span>
                    <span className="account-type-copy" style={{ flex: 1 }}>
                      <span className="account-type-title" style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{title}</span>
                      <span className="account-type-desc" style={{ display: 'block', fontSize: '14px', color: 'var(--text-muted)' }}>{description}</span>
                    </span>
                    {isSelected && <CheckCircle2 className="account-type-check" style={{ color: 'var(--teal)' }} size={24} />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(2)}
              className="signup-submit-btn"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Continue <ArrowRight size={20} />
            </button>

            <p className="signup-footer" style={{ marginTop: '24px' }}>
              Already have an account?{" "}
              <Link to="/login" className="login-link">Sign in</Link>
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="step-2-details">
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', marginBottom: '24px', fontSize: '15px', fontWeight: 600 }}>
              <ArrowLeft size={16} /> Back
            </button>

            <div className="signup-header">
              <h2 className="signup-title">Create your account</h2>
              <p className="signup-subtitle">Enter your details to register as a {ACCOUNT_TYPE_OPTIONS.find(r => r.role === selectedRole)?.title}</p>
            </div>

            {error && <div className="signup-error" style={{ marginBottom: '20px' }}>{error}</div>}

            <form className="signup-form" onSubmit={handleEmailSignup}>
              <div className="signup-inputs" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div className="input-group" style={{ position: 'relative' }}>
                  <User className="input-icon" size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '16px' }}
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="input-group" style={{ position: 'relative' }}>
                  <Mail className="input-icon" size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '16px' }}
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="input-group" style={{ position: 'relative' }}>
                  <Lock className="input-icon" size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '16px' }}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="signup-submit-btn">
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div className="signup-divider" style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '12px' }}>
              <span className="divider-line" style={{ flex: 1, height: '1px', background: 'var(--border)' }}></span>
              <span className="divider-text" style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600 }}>Or continue with</span>
              <span className="divider-line" style={{ flex: 1, height: '1px', background: 'var(--border)' }}></span>
            </div>

            <button onClick={handleGoogleSignup} disabled={loading} className="google-signup-btn">
              <svg className="google-icon" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
