import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, Shield, KeyRound, CheckCircle } from 'lucide-react';
import { getRootUrl, getSchoolUrl } from '../utils/subdomain';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

const roleRedirects = {
  developer: '/developer',
  school_admin: '/admin',
  staff: '/staff',
  student: '/student',
};

export default function Login() {
  const [identifier,       setIdentifier]       = useState('');
  const [password,         setPassword]         = useState('');
  const [showPassword,     setShowPassword]     = useState(false);
  const [error,            setError]            = useState('');
  const [loading,          setLoading]          = useState(false);
  const [step,             setStep]             = useState('login');
  const [pendingChange,    setPendingChange]    = useState(null);
  const [newPassword,      setNewPassword]      = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [showNew,          setShowNew]          = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);

  const { login, subdomain, adminPortal, portalSchool } = useAuth();
  const navigate = useNavigate();

  const isUnknownSubdomain = !!subdomain && !adminPortal && portalSchool === null;

  // ── Login ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(identifier, password);
      if (result?.requiresPasswordChange) {
        setPendingChange({ userId: result.userId, role: result.role });
        setStep('change-password');
        return;
      }
      navigate(roleRedirects[result.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ── Password change ──────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/change-password`, { userId: pendingChange.userId, newPassword });
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const resetToLogin = () => {
    setStep('login');
    setPendingChange(null);
    setIdentifier(''); setPassword('');
    setNewPassword(''); setConfirmPassword('');
    setError('');
  };

  // ── Shared field helpers ─────────────────────────────────────
  const PasswordField = ({ value, onChange, show, onToggle, placeholder = 'Enter password', label = 'Password', name }) => (
    <div className="form-group" style={{ position: 'relative' }}>
      <label className="form-label">{label}</label>
      <input
        type={show ? 'text' : 'password'}
        className="form-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        name={name}
        style={{ paddingRight: '46px' }}
      />
      <button
        type="button"
        onClick={onToggle}
        style={{
          position: 'absolute', right: '12px', bottom: '13px',
          background: 'none', border: 'none',
          color: 'var(--text-muted)', cursor: 'pointer', padding: '0',
          display: 'flex', alignItems: 'center',
        }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );

  const ErrorBanner = () => error ? (
    <div className="login-error">
      <AlertCircle size={15} style={{ flexShrink: 0 }} />
      {error}
    </div>
  ) : null;

  // ── Login form ───────────────────────────────────────────────
  const renderLoginForm = (emailOnly = false) => (
    <div className="login-form-inner">
      <h2 className="login-title" style={{ marginBottom: '4px' }}>Welcome back</h2>
      <p className="login-subtitle">Sign in to continue</p>

      <ErrorBanner />

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            {emailOnly ? 'Email Address' : 'Email or Mobile Number'}
          </label>
          <input
            type={emailOnly ? 'email' : 'text'}
            className="form-input"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder={emailOnly ? 'Enter your email' : 'Email or 10-digit mobile'}
            autoFocus
            required
          />
        </div>

        <PasswordField
          value={password}
          onChange={e => setPassword(e.target.value)}
          show={showPassword}
          onToggle={() => setShowPassword(p => !p)}
        />

        <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );

  // ── Change-password form ────────────────────────────────────
  const renderChangeForm = () => (
    <div className="login-form-inner">
      <h2 className="login-title" style={{ marginBottom: '4px' }}>Set your password</h2>
      <p className="login-subtitle">First login — choose a personal password</p>

      <ErrorBanner />

      <form onSubmit={handleChangePassword}>
        <PasswordField
          label="New Password"
          placeholder="Minimum 6 characters"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          show={showNew}
          onToggle={() => setShowNew(p => !p)}
          name="new"
        />
        <PasswordField
          label="Confirm Password"
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          show={showConfirm}
          onToggle={() => setShowConfirm(p => !p)}
          name="confirm"
        />

        <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
          {loading ? 'Saving…' : 'Set Password'}
        </button>
      </form>

      <button
        onClick={resetToLogin}
        style={{
          display: 'block', margin: '14px auto 0',
          background: 'none', border: 'none',
          color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
        }}
      >
        ← Back to login
      </button>
    </div>
  );

  // ── Success screen ───────────────────────────────────────────
  const renderDoneScreen = () => (
    <div className="login-form-inner" style={{ textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '20px',
        background: 'var(--success-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <CheckCircle size={28} color="var(--success)" />
      </div>
      <h2 className="login-title">Password set!</h2>
      <p className="login-subtitle" style={{ marginBottom: '28px' }}>
        You can now sign in with your new password.
      </p>
      <button className="btn btn-primary login-btn" onClick={resetToLogin}>
        Go to Login
      </button>
    </div>
  );

  // ── Unknown subdomain ────────────────────────────────────────
  if (isUnknownSubdomain) {
    return (
      <div className="login-container">
        <div className="login-brand">
          <div className="login-logo-wrap">
            <AlertCircle size={30} color="white" />
          </div>
          <div className="login-brand-name">School Not Found</div>
          <div className="login-brand-sub">{window.location.hostname}</div>
        </div>
        <div className="login-card">
          <div className="login-form-inner" style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
              No school is registered under this domain.
            </p>
            <a href={getRootUrl()} className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Go to Main Site
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Developer admin portal ───────────────────────────────────
  if (adminPortal) {
    return (
      <div className="login-container">
        <div className="login-brand">
          <div className="login-logo-wrap">
            <Shield size={30} color="white" />
          </div>
          <div className="login-brand-name">Acadmay Admin</div>
          <div className="login-brand-sub">Platform developer access only</div>
        </div>

        <div className="login-card">
          {renderLoginForm(true)}

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Looking for your school?{' '}
            <a href={getSchoolUrl('dps')} style={{ color: 'var(--accent-primary)' }}>
              schoolname.acadmay.in
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ── School portal ────────────────────────────────────────────
  if (portalSchool) {
    const schoolInitial = portalSchool.name?.charAt(0)?.toUpperCase() || 'S';
    const schoolLocation = portalSchool.city && portalSchool.state
      ? `${portalSchool.city}, ${portalSchool.state}`
      : 'School Portal';

    return (
      <div className="login-container">
        <div className="login-brand">
          <div className="login-logo-wrap">{schoolInitial}</div>
          <div className="login-brand-name">{portalSchool.name}</div>
          <div className="login-brand-sub">{schoolLocation}</div>
        </div>

        <div className="login-card">
          {step === 'login'           && renderLoginForm(false)}
          {step === 'change-password' && renderChangeForm()}
          {step === 'done'            && renderDoneScreen()}

          {step === 'login' && (
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Platform admin?{' '}
              <a href={getRootUrl()} style={{ color: 'var(--accent-primary)' }}>
                Sign in at admin.acadmay.in →
              </a>
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
