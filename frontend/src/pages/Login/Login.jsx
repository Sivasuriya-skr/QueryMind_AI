import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Database,
} from 'lucide-react';
import './Login.css';

function AuthIllustration() {
  return (
    <svg viewBox="0 0 280 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="auth-svg">
      {/* speech bubbles */}
      <circle cx="210" cy="50" r="18" fill="#c084fc" opacity="0.3" />
      <circle cx="230" cy="38" r="10" fill="#a855f7" opacity="0.2" />
      <circle cx="195" cy="35" r="7" fill="#e9d5ff" opacity="0.5" />
      <path d="M168 64q-4 0-6-3l-8 4 3-7q-5-4-5-10 0-7 7-11t17-4 17 4 7 11q0 6-5 10l4 7-9-4q-3 3-7 3z" fill="#e9d5ff" opacity="0.5" />

      {/* decorative dots */}
      <circle cx="40" cy="40" r="6" fill="#a855f7" opacity="0.15" />
      <circle cx="60" cy="30" r="4" fill="#7c3aed" opacity="0.1" />
      <circle cx="25" cy="60" r="5" fill="#c084fc" opacity="0.12" />
      <circle cx="250" cy="190" r="8" fill="#a855f7" opacity="0.1" />
      <circle cx="268" cy="175" r="4" fill="#7c3aed" opacity="0.08" />

      {/* desk */}
      <rect x="50" y="168" width="180" height="10" rx="4" fill="#d8b4fe" />
      <rect x="55" y="178" width="170" height="6" rx="3" fill="#c084fc" opacity="0.5" />

      {/* laptop base */}
      <rect x="85" y="153" width="110" height="8" rx="3" fill="#8b5cf6" />
      <rect x="85" y="153" width="110" height="8" rx="3" fill="#a855f7" opacity="0.4" />

      {/* laptop screen */}
      <path d="M90 148h100l6 8H84z" fill="#7c3aed" opacity="0.35" />
      <rect x="92" y="110" width="96" height="38" rx="4" fill="#ede9fe" />

      {/* screen content - lines */}
      <rect x="102" y="120" width="30" height="3" rx="1.5" fill="#c084fc" opacity="0.4" />
      <rect x="102" y="128" width="20" height="3" rx="1.5" fill="#a855f7" opacity="0.3" />
      <rect x="102" y="136" width="25" height="3" rx="1.5" fill="#c084fc" opacity="0.35" />

      {/* robot body */}
      <rect x="118" y="118" width="44" height="38" rx="12" fill="#ddd6fe" />
      <rect x="118" y="118" width="44" height="38" rx="12" fill="url(#robotGrad)" opacity="0.3" />

      {/* robot head */}
      <circle cx="140" cy="95" r="28" fill="#e9d5ff" />
      <circle cx="140" cy="95" r="28" fill="url(#headGrad)" opacity="0.2" />

      {/* robot antenna */}
      <line x1="140" y1="67" x2="140" y2="56" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="140" cy="53" r="5" fill="#a855f7" opacity="0.6" />

      {/* eyes */}
      <circle cx="131" cy="90" r="4" fill="#4c1d95" />
      <circle cx="149" cy="90" r="4" fill="#4c1d95" />
      <circle cx="132" cy="89" r="1.5" fill="#fff" opacity="0.6" />
      <circle cx="150" cy="89" r="1.5" fill="#fff" opacity="0.6" />

      {/* smile */}
      <path d="M132 100q7 5 14 0" stroke="#4c1d95" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* robot arms */}
      <path d="M118 128q-8 4-10 14" stroke="#ddd6fe" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M162 128q8 4 10 14" stroke="#ddd6fe" strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* keyboard hands */}
      <circle cx="108" cy="143" r="5" fill="#e9d5ff" />
      <circle cx="172" cy="143" r="5" fill="#e9d5ff" />

      {/* decorative leaf */}
      <path d="M30 200q10-15 25-10 0 12-10 20t-15-10z" fill="#c084fc" opacity="0.12" />
      <path d="M36 196q6-12 16-8 0 8-6 13t-10-5z" fill="#a855f7" opacity="0.08" />

      {/* gradients */}
      <defs>
        <linearGradient id="robotGrad" x1="118" y1="118" x2="162" y2="156">
          <stop stopColor="#a855f7" stopOpacity="0.15" />
          <stop offset="1" stopColor="#7c3aed" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="headGrad" x1="112" y1="67" x2="168" y2="123">
          <stop stopColor="#a855f7" stopOpacity="0.1" />
          <stop offset="1" stopColor="#7c3aed" stopOpacity="0.05" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateField = (name, value) => {
    if (name === 'email') {
      if (!value) return 'Email is required';
      if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format';
    }
    if (name === 'password') {
      if (!value) return 'Password is required';
    }
    return '';
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 401) {
        setApiError('Invalid email or password');
      } else if (err.response?.data?.message) {
        setApiError(err.response.data.message);
      } else {
        setApiError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldClass = (name) => {
    if (!touched[name]) return '';
    if (errors[name]) return 'input-error';
    return 'input-valid';
  };

  return (
    <div className="auth-page">
      {/* background decorative circles */}
      <div className="auth-bg-blobs">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />
      </div>

      <div className="auth-card">
        {/* left panel - illustration */}
        <div className="auth-illustration">
          <div className="auth-illustration-inner">
            <AuthIllustration />
            <h2>Turn your questions into answers.</h2>
            <p>Ask your database anything — no SQL required.</p>
          </div>
        </div>

        {/* right panel - form */}
        <div className="auth-form">
          <div className="auth-form-inner">
            <div className="form-logo">
              <div className="form-logo-icon">
                <Database size={20} />
              </div>
              <span className="form-logo-text">QueryMind AI</span>
            </div>

            <div className="form-header">
              <h1>Login to your Account</h1>
              <p>Welcome back — sign in to continue</p>
            </div>

            {apiError && <div className="form-error-banner">{apiError}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-field">
                <label htmlFor="email">Email</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getFieldClass('email')}
                  />
                  {touched.email && !errors.email && form.email && (
                    <span className="input-check" />
                  )}
                </div>
                {errors.email && touched.email && (
                  <span className="field-error">{errors.email}</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getFieldClass('password')}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <span className="field-error">{errors.password}</span>
                )}
              </div>

              <div className="form-row">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="form-forgot">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="form-btn" disabled={loading}>
                {loading ? <Loader2 size={20} className="btn-spinner" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="form-footer">
              Don't have an account? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
