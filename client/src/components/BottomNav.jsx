import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import navConfig from '../config/navConfig';

export default function BottomNav({ onMoreClick }) {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  if (!user) return null;
  const config = navConfig[user.role];
  if (!config) return null;

  const flatItems = config.items.filter(i => !i.section);
  const bottomItems = config.bottomItems || flatItems.slice(0, 5);
  const hasMore     = flatItems.length > bottomItems.length;

  const visibleItems = hasMore ? bottomItems.slice(0, 4) : bottomItems;

  return (
    <nav className="bottom-nav">
      {visibleItems.map((item, idx) => {
        const Icon     = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <button
            key={idx}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <Icon className="bottom-nav-icon" />
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}

      {hasMore && (
        <button className="bottom-nav-item" onClick={onMoreClick}>
          <MoreHorizontal className="bottom-nav-icon" />
          <span className="bottom-nav-label">More</span>
        </button>
      )}
    </nav>
  );
}
