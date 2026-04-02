import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

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
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(roleRedirects[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email, password) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="login-container">
      <div className="login-bg" />
      <div className="login-card slide-up">
        <div className="login-logo">S</div>
        <h1 className="login-title">School ERP</h1>
        <p className="login-subtitle">Sign in to your account to continue</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
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
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '12px', top: '32px',
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-credentials">
          <h4>Quick Login</h4>
          <p onClick={() => quickLogin('developer@erp.com', 'admin123')} style={{ cursor: 'pointer' }}>
            🔧 Developer: developer@erp.com / admin123
          </p>
          <p onClick={() => quickLogin('admin@dps.edu', 'school123')} style={{ cursor: 'pointer' }}>
            🏫 School Admin: admin@dps.edu / school123
          </p>
          <p onClick={() => quickLogin('anita@dps.edu', 'staff123')} style={{ cursor: 'pointer' }}>
            👩‍🏫 Staff: anita@dps.edu / staff123
          </p>
          <p onClick={() => quickLogin('student1@dps.edu', 'student123')} style={{ cursor: 'pointer' }}>
            🎓 Student: student1@dps.edu / student123
          </p>
        </div>
      </div>
    </div>
  );
}
