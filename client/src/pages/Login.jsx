import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';
import { getRootUrl, getSchoolUrl } from '../utils/subdomain';

const roleRedirects = {
  developer: '/developer',
  school_admin: '/admin',
  staff: '/staff',
  student: '/student',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, subdomain, adminPortal, portalSchool } = useAuth();
  const navigate = useNavigate();

  // Three portal modes
  const isUnknownSubdomain = !!subdomain && !adminPortal && portalSchool === null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(roleRedirects[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (e, em, pw) => {
    e.preventDefault();
    setEmail(em);
    setPassword(pw);
  };

  const formFields = (
    <>
      {error && <div className="login-error">{error}</div>}
      <form onSubmit={handleSubmit} style={{ marginTop: '8px' }}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email" className="form-input" value={email} autoFocus required
            onChange={e => setEmail(e.target.value)} placeholder="Enter your email"
          />
        </div>
        <div className="form-group" style={{ position: 'relative' }}>
          <label className="form-label">Password</label>
          <input
            type={showPassword ? 'text' : 'password'} className="form-input"
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Enter password" required style={{ paddingRight: '40px' }}
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

  // ── Unknown subdomain ─────────────────────────────────────────────────────
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

  // ── Developer admin portal (admin.acadmay.in) ─────────────────────────────
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

          {formFields}

          <div className="login-credentials">
            <h4>Demo Credentials</h4>
            <p onClick={e => quickLogin(e, 'developer@erp.com', 'admin123')} style={{ cursor: 'pointer' }}>
              🔧 Developer: developer@erp.com / admin123
            </p>
          </div>

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

  // ── School portal (dps.acadmay.in, xavier.acadmay.in, …) ─────────────────
  if (portalSchool) {
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

          {formFields}

          <div className="login-credentials">
            <h4>Demo Accounts</h4>
            <p onClick={e => quickLogin(e, `admin@${portalSchool.subdomain}.edu`, 'school123')} style={{ cursor: 'pointer' }}>
              🏫 Admin: admin@{portalSchool.subdomain}.edu / school123
            </p>
            <p onClick={e => quickLogin(e, `anita@${portalSchool.subdomain}.edu`, 'staff123')} style={{ cursor: 'pointer' }}>
              👩‍🏫 Staff: anita@{portalSchool.subdomain}.edu / staff123
            </p>
            <p onClick={e => quickLogin(e, `student1@${portalSchool.subdomain}.edu`, 'student123')} style={{ cursor: 'pointer' }}>
              🎓 Student: student1@{portalSchool.subdomain}.edu / student123
            </p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <a href={getRootUrl()} style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none' }}>
              Platform admin? Sign in at admin.acadmay.in →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Fallback — should not normally be reached (root domain redirects via RoleRedirect)
  return null;
}
