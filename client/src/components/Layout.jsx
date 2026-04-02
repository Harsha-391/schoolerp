import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout({ title, subtitle, children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar title={title} subtitle={subtitle} />
        <div className="page-content fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
