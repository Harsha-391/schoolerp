import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, Shield, KeyRound } from 'lucide-react';
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
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password-change step
  const [step, setStep] = useState('login'); // 'login' | 'change-password' | 'done'
  const [pendingChange, setPendingChange] = useState(null); // { userId, role }
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { login, subdomain, adminPortal, portalSchool } = useAuth();
  const navigate = useNavigate();

  const isUnknownSubdomain = !!subdomain && !adminPortal && portalSchool === null;

  // ── Login submit ────────────────────────────────────────────────────────────
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

  // ── Password change submit ──────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/change-password`, {
        userId: pendingChange.userId,
        newPassword,
      });
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
    setIdentifier('');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  // ── Shared form: email-only (admin portal) or email/mobile (school portal) ──
  const loginForm = (emailOnly = false) => (
    <>
      {error && <div className="login-error">{error}</div>}
      <form onSubmit={handleSubmit} style={{ marginTop: '8px' }}>
        <div className="form-group">
          <label className="form-label">
            {emailOnly ? 'Email Address' : 'Email or Mobile Number'}
          </label>
          <input
            type={emailOnly ? 'email' : 'text'}
            className="form-input"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder={emailOnly ? 'Enter your email' : 'Email or 10-digit mobile number'}
            autoFocus
            required
          />
        </div>
        <div className="form-group" style={{ position: 'relative' }}>
          <label className="form-label">Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            className="form-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            style={{ paddingRight: '40px' }}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
            position: 'absolute', right: '12px', top: '32px',
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
          }}>
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </>
  );

  // ── Change-password form ────────────────────────────────────────────────────
  const changePasswordForm = () => (
    <>
      {error && <div className="login-error">{error}</div>}
      <form onSubmit={handleChangePassword} style={{ marginTop: '8px' }}>
        <div className="form-group" style={{ position: 'relative' }}>
          <label className="form-label">New Password</label>
          <input
            type={showNew ? 'text' : 'password'}
            className="form-input"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            autoFocus
            required
            style={{ paddingRight: '40px' }}
          />
          <button type="button" onClick={() => setShowNew(!showNew)} style={{
            position: 'absolute', right: '12px', top: '32px',
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
          }}>
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <div className="form-group" style={{ position: 'relative' }}>
          <label className="form-label">Confirm New Password</label>
          <input
            type={showConfirm ? 'text' : 'password'}
            className="form-input"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            required
            style={{ paddingRight: '40px' }}
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{
            position: 'absolute', right: '12px', top: '32px',
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
          }}>
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
          {loading ? 'Saving...' : 'Set New Password'}
        </button>
      </form>
    </>
  );

  // ── Unknown subdomain ───────────────────────────────────────────────────────
  if (isUnknownSubdomain) {
    return (
      <div className="login-container">
        <div className="login-bg" />
        <div className="login-card slide-up" style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '14px', background: 'rgba(239,68,68,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <AlertCircle size={28} style={{ color: 'var(--error)' }} />
          </div>
          <h1 className="login-title" style={{ color: 'var(--error)' }}>School Not Found</h1>
          <p className="login-subtitle">
            No school is registered under <strong>{window.location.hostname}</strong>.
          </p>
          <a href={getRootUrl()} className="btn btn-primary"
            style={{ display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}>
            Go to Main Site
          </a>
        </div>
      </div>
    );
  }

  // ── Developer admin portal ──────────────────────────────────────────────────
  if (adminPortal) {
    return (
      <div className="login-container">
        <div className="login-bg" />
        <div className="login-card slide-up">
          <div style={{
            width: 64, height: 64, borderRadius: '16px',
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            border: '1px solid rgba(99,102,241,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
          }}>
            <Shield size={30} style={{ color: '#6366f1' }} />
          </div>
          <h1 className="login-title">Acadmay Admin</h1>
          <p className="login-subtitle">Platform developer access only</p>

          {loginForm(true)}

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Looking for your school?{' '}
              <a
                href={getSchoolUrl('dps')}
                style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
              >
                schoolname.acadmay.in
              </a>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── School portal ───────────────────────────────────────────────────────────
  if (portalSchool) {
    // Password-change step
    if (step === 'change-password') {
      return (
        <div className="login-container">
          <div className="login-bg" />
          <div className="login-card slide-up">
            <div style={{
              width: 64, height: 64, borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <KeyRound size={28} style={{ color: '#fff' }} />
            </div>
            <h1 className="login-title">Set Your Password</h1>
            <p className="login-subtitle">
              This is your first login. Please set a personal password to continue.
            </p>
            {changePasswordForm()}
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                onClick={resetToLogin}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}
              >
                Back to login
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Password-change success
    if (step === 'done') {
      return (
        <div className="login-container">
          <div className="login-bg" />
          <div className="login-card slide-up" style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '16px',
              background: 'rgba(34,197,94,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <KeyRound size={28} style={{ color: '#22c55e' }} />
            </div>
            <h1 className="login-title">Password Updated</h1>
            <p className="login-subtitle">Your password has been set. Please log in with your new password.</p>
            <button className="btn btn-primary login-btn" style={{ marginTop: '16px' }} onClick={resetToLogin}>
              Back to Login
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="login-container">
        <div className="login-bg" />
        <div className="login-card slide-up">
          <div style={{
            width: 64, height: 64, borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: '28px', fontWeight: 800, color: '#fff',
          }}>
            {portalSchool.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="login-title">{portalSchool.name}</h1>
          <p className="login-subtitle">
            {portalSchool.city && portalSchool.state
              ? `${portalSchool.city}, ${portalSchool.state}`
              : 'School Portal'}
          </p>

          {loginForm(false)}

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <a href={getRootUrl()} style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none' }}>
              Platform admin? Sign in at admin.acadmay.in →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
