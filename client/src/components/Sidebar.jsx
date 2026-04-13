import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, School, BarChart3, CreditCard, Users, GraduationCap,
  BookOpen, Calendar, ClipboardList, QrCode, Clock, FileText, UserCircle,
  DollarSign, Award, Settings, LogOut, ChevronRight, Bell, TrendingUp
} from 'lucide-react';

const navConfig = {
  developer: {
    title: 'ERP Platform',
    subtitle: 'Developer Admin',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/developer' },
      { label: 'Manage Schools', icon: School, path: '/developer/schools' },
      { label: 'Analytics', icon: BarChart3, path: '/developer/analytics' },
      { label: 'Billing', icon: CreditCard, path: '/developer/billing' },
    ],
  },
  school_admin: {
    title: 'School Admin',
    subtitle: 'Management',
    items: [
      { section: 'Overview' },
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
      { section: 'People' },
      { label: 'Staff Management', icon: Users, path: '/admin/staff' },
      { label: 'Student Management', icon: GraduationCap, path: '/admin/students' },
      { section: 'Academics' },
      { label: 'Grades & Sections', icon: BookOpen, path: '/admin/grades' },
      { label: 'Exams & Marks', icon: ClipboardList, path: '/admin/exams' },
      { section: 'Finance' },
      { label: 'Fee Management', icon: DollarSign, path: '/admin/fees' },
      { label: 'Finance Analytics', icon: TrendingUp, path: '/admin/finance' },
      { label: 'Verify Payments', icon: CreditCard, path: '/admin/payments' },
      { label: 'Payment Settings', icon: Settings, path: '/admin/payment-config' },
      { section: 'Other' },
      { label: 'Leave Requests', icon: FileText, path: '/admin/leaves' },
      { label: 'Holiday Calendar', icon: Calendar, path: '/admin/holidays' },
    ],
  },
  staff: {
    title: 'Teacher Panel',
    subtitle: 'Staff Portal',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/staff' },
      { label: 'My Schedule', icon: Clock, path: '/staff/schedule' },
      { label: 'My Classes', icon: BookOpen, path: '/staff/classes' },
      { label: 'QR Attendance', icon: QrCode, path: '/staff/qr-attendance' },
      { label: 'Apply Leave', icon: FileText, path: '/staff/leave' },
      { label: 'My Attendance', icon: ClipboardList, path: '/staff/my-attendance' },
    ],
  },
  student: {
    title: 'Student Portal',
    subtitle: 'My School',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/student' },
      { label: 'My Attendance', icon: ClipboardList, path: '/student/attendance' },
      { label: 'My Marks', icon: Award, path: '/student/marks' },
      { label: 'My Fees', icon: DollarSign, path: '/student/fees' },
      { label: 'My Profile', icon: UserCircle, path: '/student/profile' },
    ],
  },
};

export default function Sidebar() {
  const { user, school, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const config = navConfig[user.role];
  if (!config) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">S</div>
        <div className="sidebar-brand">
          <h2>{school?.name || config.title}</h2>
          <span>{config.subtitle}</span>
        </div>
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
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={idx}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon className="nav-icon" size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleLogout} title="Click to logout">
          <div className="user-avatar">{user.name?.charAt(0)}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role.replace('_', ' ')}</div>
          </div>
          <LogOut size={16} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
        </div>
      </div>
    </aside>
  );
}
