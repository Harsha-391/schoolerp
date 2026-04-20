import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import navConfig from '../config/navConfig';

export default function Sidebar({ isOpen = false, onClose }) {
  const { user, school, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  if (!user) return null;
  const config = navConfig[user.role];
  if (!config) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          {school?.name?.charAt(0)?.toUpperCase() || 'A'}
        </div>
        <div className="sidebar-brand">
          <h2>{school?.name || config.title}</h2>
          <span>{config.subtitle}</span>
        </div>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <X size={17} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {config.items.map((item, idx) => {
          if (item.section) {
            return (
              <div key={idx} className="nav-section">
                <div className="nav-section-title">{item.section}</div>
              </div>
            );
          }
          const Icon     = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={idx}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon className="nav-icon" size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleLogout} title="Logout">
          <div className="user-avatar">{user.name?.charAt(0)?.toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role.replace('_', ' ')}</div>
          </div>
          <LogOut size={15} style={{ color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
