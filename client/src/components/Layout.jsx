import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

export default function Layout({ title, subtitle, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Close drawer whenever the route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const openDrawer  = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="app-layout">
      {/* Sidebar: persistent on desktop, drawer on mobile */}
      <Sidebar isOpen={drawerOpen} onClose={closeDrawer} />

      {/* Backdrop behind drawer on mobile/tablet */}
      {drawerOpen && (
        <div className="nav-overlay" onClick={closeDrawer} />
      )}

      <div className="main-content">
        <TopBar title={title} subtitle={subtitle} onMenuClick={openDrawer} />
        <div className="page-content fade-in">
          {children}
        </div>
      </div>

      {/* Bottom nav — hidden on desktop via CSS */}
      <BottomNav onMoreClick={openDrawer} />
    </div>
  );
}
