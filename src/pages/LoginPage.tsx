import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginWithEmail, loginWithGoogle } from "@/firebase/auth";
import { resetPassword } from "@/firebase/auth";
import { Mail, Lock, Eye, EyeOff, Sparkles, Users, FileText, Loader2 } from "lucide-react";
import logoHeart from "@/assets/logo-heart.png";
import styles from "./Login.module.css";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || "/";

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetMessage("");
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many failed attempts. Please try again later or reset your password.");
      } else {
        setError("Failed to sign in. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setResetMessage("");
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error("Google login error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign-in popup was closed before completing.");
      } else {
        setError("Failed to sign in with Google. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address to reset password.");
      return;
    }
    try {
      setLoading(true);
      await resetPassword(email);
      setResetMessage("Password reset email sent. Check your inbox.");
      setError("");
    } catch (err: any) {
      console.error("Password reset error:", err);
      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email address.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else {
        setError("Failed to send reset email. Please try again later.");
      }
      setResetMessage("");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={styles.loginContainer}>
      
      {/* Left Panel - Healthcare Themed */}
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <div className={styles.brandLogo}>
            <img src={logoHeart} alt="AAYU Logo" fetchPriority="high" />
            <h1>AAYU</h1>
          </div>
          
          <p className={styles.tagline}>
            Your intelligent companion for rural healthcare, bringing expert guidance directly to your family.
          </p>
          
          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <Sparkles size={20} />
              </div>
              <span>AI Health Assistant in your local language</span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <Users size={20} />
              </div>
              <span>Family Health Management & Caregiving</span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <FileText size={20} />
              </div>
              <span>Secure, Intelligent Medical Records Vault</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Card */}
      <div className={styles.rightPanel}>
        <div className={styles.loginCard}>
          
          <div className={styles.cardHeader}>
            <h2>Welcome Back</h2>
            <p>Sign in to access your secure health dashboard</p>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              {error}
            </div>
          )}
          
          {resetMessage && (
            <div className={styles.successBanner}>
              {resetMessage}
            </div>
          )}

          <form onSubmit={handleEmailLogin}>
            
            <div className={styles.inputGroup}>
              <input
                type="email"
                required
                className={styles.inputField}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <Mail className={styles.inputIcon} size={20} />
            </div>
            
            <div className={styles.inputGroup}>
              <input
                type={showPassword ? "text" : "password"}
                required
                className={styles.inputField}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <Lock className={styles.inputIcon} size={20} />
              <button 
                type="button" 
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <button
              type="button"
              onClick={handleResetPassword}
              className={styles.forgotPassword}
              disabled={loading}
            >
              Forgot Password?
            </button>

            <button
              type="submit"
              disabled={loading}
              className={styles.primaryButton}
            >
              {loading ? (
                <><Loader2 size={20} className={styles.spinner} /> Signing in...</>
              ) : (
                "Sign In to AAYU"
              )}
            </button>
          </form>

          <div className={styles.divider}>
            <span>Or continue with</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className={styles.googleButton}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>



          <div className={styles.createAccount}>
            Don't have an account? 
            <Link to="/signup" className={styles.createAccountLink}>
              Create one now
            </Link>
          </div>
          
        </div>
      </div>
      
    </div>
  );
};

