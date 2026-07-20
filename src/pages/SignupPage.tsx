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
    title: "Citizen",
    description: "Personal and family healthcare.",
    Icon: UserRound,
  },
  {
    role: USER_ROLE.ASHA_WORKER,
    title: "ASHA / Anganwadi Worker",
    description: "Community healthcare worker responsible for recording health observations.",
    Icon: HeartPulse,
  },
  {
    role: USER_ROLE.DOCTOR,
    title: "Doctor",
    description: "Licensed medical professional.",
    Icon: Stethoscope,
  },
];

export const SignupPage = () => {
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
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h2 className="signup-title">Create an account</h2>
          <p className="signup-subtitle">Join AAYU to start managing your health</p>
        </div>

        {error && (
          <div className="signup-error">
            {error}
          </div>
        )}

        <form className="signup-form" onSubmit={handleEmailSignup}>
          <div className="signup-inputs">
            <div className="input-group">
              <User className="input-icon" />
              <input
                type="text"
                required
                className="custom-input"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <Mail className="input-icon" />
              <input
                type="email"
                required
                className="custom-input"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="input-group">
              <Lock className="input-icon" />
              <input
                type="password"
                required
                className="custom-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <section className="account-type-section" aria-labelledby="account-type-title">
            <div className="account-type-header">
              <h3 id="account-type-title">Select Account Type</h3>
              <p>Choose the role that best matches how you will use AAYU.</p>
            </div>

            <div className="account-type-grid" role="radiogroup" aria-label="Select account type">
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
                  >
                    <span className="account-type-icon">
                      <Icon size={22} />
                    </span>
                    <span className="account-type-copy">
                      <span className="account-type-title">{title}</span>
                      <span className="account-type-desc">{description}</span>
                    </span>
                    <CheckCircle2 className="account-type-check" size={20} />
                  </button>
                );
              })}
            </div>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="signup-submit-btn"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="signup-divider">
          <span className="divider-line"></span>
          <span className="divider-text">Or continue with</span>
          <span className="divider-line"></span>
        </div>

        <button
          onClick={handleGoogleSignup}
          disabled={loading}
          className="google-signup-btn"
        >
          <svg className="google-icon" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>

        <p className="signup-footer">
          Already have an account?{" "}
          <Link to="/login" className="login-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
