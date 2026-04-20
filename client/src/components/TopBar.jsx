import { Bell, Search, Menu } from 'lucide-react';

export default function TopBar({ title, subtitle, onMenuClick }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="topbar-menu-btn"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
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
