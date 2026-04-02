import { useAuth } from '../context/AuthContext';
import { Bell, Search, Menu } from 'lucide-react';

export default function TopBar({ title, subtitle }) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div>
          <div className="topbar-title">{title || 'Dashboard'}</div>
          {subtitle && <div className="topbar-breadcrumb">{subtitle}</div>}
        </div>
      </div>
      <div className="topbar-right">
        <button className="topbar-btn" title="Search">
          <Search size={16} />
        </button>
        <button className="topbar-btn" title="Notifications">
          <Bell size={16} />
        </button>
      </div>
    </header>
  );
}
