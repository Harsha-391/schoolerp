import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getSubdomain, getAdminUrl, isAdminPortal, isSchoolPortal } from './utils/subdomain';

// Pages
import Login from './pages/Login';

// Developer
import DevDashboard from './pages/developer/DevDashboard';
import ManageSchools from './pages/developer/ManageSchools';
import SchoolAnalytics from './pages/developer/SchoolAnalytics';
import BillingSettings from './pages/developer/BillingSettings';

// School Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import StaffManagement from './pages/admin/StaffManagement';
import StudentManagement from './pages/admin/StudentManagement';
import GradeManagement from './pages/admin/GradeManagement';
import FeeManagement from './pages/admin/FeeManagement';
import ExamManagement from './pages/admin/ExamManagement';
import LeaveManagement from './pages/admin/LeaveManagement';
import HolidayCalendar from './pages/admin/HolidayCalendar';
import PaymentVerification from './pages/admin/PaymentVerification';
import PaymentConfig from './pages/admin/PaymentConfig';
import FinanceAnalytics from './pages/admin/FinanceAnalytics';

// Staff
import StaffDashboard from './pages/staff/StaffDashboard';
import MySchedule from './pages/staff/MySchedule';
import MyClasses from './pages/staff/MyClasses';
import QRAttendance from './pages/staff/QRAttendance';
import LeaveApplication from './pages/staff/LeaveApplication';
import StaffAttendance from './pages/staff/StaffAttendance';

// Student
import StudentDashboard from './pages/student/StudentDashboard';
import MyAttendance from './pages/student/MyAttendance';
import MyMarks from './pages/student/MyMarks';
import MyFees from './pages/student/MyFees';
import MyProfile from './pages/student/MyProfile';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" />;
  return children;
}

function RoleRedirect() {
  const { user, loading } = useAuth();

  // Root domain with no subdomain → redirect to admin.acadmay.in (or admin.localhost)
  if (!getSubdomain()) {
    window.location.replace(getAdminUrl());
    return null;
  }

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  const redirectMap = {
    developer: '/developer',
    school_admin: '/admin',
    staff: '/staff',
    student: '/student',
  };
  return <Navigate to={redirectMap[user.role] || '/login'} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* Developer Admin */}
          <Route path="/developer" element={<ProtectedRoute allowedRoles={['developer']}><DevDashboard /></ProtectedRoute>} />
          <Route path="/developer/schools" element={<ProtectedRoute allowedRoles={['developer']}><ManageSchools /></ProtectedRoute>} />
          <Route path="/developer/analytics" element={<ProtectedRoute allowedRoles={['developer']}><SchoolAnalytics /></ProtectedRoute>} />
          <Route path="/developer/billing" element={<ProtectedRoute allowedRoles={['developer']}><BillingSettings /></ProtectedRoute>} />

          {/* School Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['school_admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['school_admin']}><StaffManagement /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['school_admin']}><StudentManagement /></ProtectedRoute>} />
          <Route path="/admin/grades" element={<ProtectedRoute allowedRoles={['school_admin']}><GradeManagement /></ProtectedRoute>} />
          <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={['school_admin']}><FeeManagement /></ProtectedRoute>} />
          <Route path="/admin/exams" element={<ProtectedRoute allowedRoles={['school_admin']}><ExamManagement /></ProtectedRoute>} />
          <Route path="/admin/leaves" element={<ProtectedRoute allowedRoles={['school_admin']}><LeaveManagement /></ProtectedRoute>} />
          <Route path="/admin/holidays" element={<ProtectedRoute allowedRoles={['school_admin']}><HolidayCalendar /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={['school_admin']}><PaymentVerification /></ProtectedRoute>} />
          <Route path="/admin/payment-config" element={<ProtectedRoute allowedRoles={['school_admin']}><PaymentConfig /></ProtectedRoute>} />
          <Route path="/admin/finance" element={<ProtectedRoute allowedRoles={['school_admin']}><FinanceAnalytics /></ProtectedRoute>} />

          {/* Staff */}
          <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff']}><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff/schedule" element={<ProtectedRoute allowedRoles={['staff']}><MySchedule /></ProtectedRoute>} />
          <Route path="/staff/classes" element={<ProtectedRoute allowedRoles={['staff']}><MyClasses /></ProtectedRoute>} />
          <Route path="/staff/qr-attendance" element={<ProtectedRoute allowedRoles={['staff']}><QRAttendance /></ProtectedRoute>} />
          <Route path="/staff/leave" element={<ProtectedRoute allowedRoles={['staff']}><LeaveApplication /></ProtectedRoute>} />
          <Route path="/staff/my-attendance" element={<ProtectedRoute allowedRoles={['staff']}><StaffAttendance /></ProtectedRoute>} />

          {/* Student */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><MyAttendance /></ProtectedRoute>} />
          <Route path="/student/marks" element={<ProtectedRoute allowedRoles={['student']}><MyMarks /></ProtectedRoute>} />
          <Route path="/student/fees" element={<ProtectedRoute allowedRoles={['student']}><MyFees /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['student']}><MyProfile /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
