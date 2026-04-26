import {
  LayoutDashboard, School, BarChart3, CreditCard, Users, GraduationCap,
  BookOpen, Calendar, ClipboardList, QrCode, Clock, FileText, UserCircle,
  DollarSign, Award, Settings, TrendingUp,
} from 'lucide-react';

const navConfig = {
  developer: {
    title: 'ERP Platform',
    subtitle: 'Developer Admin',
    items: [
      { label: 'Dashboard',     icon: LayoutDashboard, path: '/developer' },
      { label: 'Schools',       icon: School,          path: '/developer/schools' },
      { label: 'Analytics',     icon: BarChart3,        path: '/developer/analytics' },
      { label: 'Billing',       icon: CreditCard,       path: '/developer/billing' },
    ],
  },

  school_admin: {
    title: 'School Admin',
    subtitle: 'Management',
    bottomItems: [
      { label: 'Home',     icon: LayoutDashboard, path: '/admin' },
      { label: 'Students', icon: GraduationCap,   path: '/admin/students' },
      { label: 'Staff',    icon: Users,            path: '/admin/staff' },
      { label: 'Finance',  icon: DollarSign,       path: '/admin/finance' },
    ],
    items: [
      { section: 'Overview' },
      { label: 'Dashboard',        icon: LayoutDashboard, path: '/admin' },
      { section: 'People' },
      { label: 'Staff',            icon: Users,            path: '/admin/staff' },
      { label: 'Students',         icon: GraduationCap,    path: '/admin/students' },
      { section: 'Academics' },
      { label: 'Grades & Sections',icon: BookOpen,         path: '/admin/grades' },
      { label: 'Syllabus',         icon: GraduationCap,    path: '/admin/syllabus' },
      { label: 'Exams & Marks',    icon: ClipboardList,    path: '/admin/exams' },
      { section: 'Finance' },
      { label: 'Fee Management',   icon: DollarSign,       path: '/admin/fees' },
      { label: 'Finance Analytics',icon: TrendingUp,       path: '/admin/finance' },
      { label: 'Verify Payments',  icon: CreditCard,       path: '/admin/payments' },
      { label: 'Payment Settings', icon: Settings,         path: '/admin/payment-config' },
      { section: 'Attendance' },
      { label: 'QR Scanner',           icon: QrCode,           path: '/admin/qr-scanner' },
      { label: 'Staff Attendance',      icon: Users,            path: '/admin/attendance/staff' },
      { label: 'Student Attendance',    icon: GraduationCap,    path: '/admin/attendance/students' },
      { section: 'Other' },
      { label: 'Leave Requests',   icon: FileText,         path: '/admin/leaves' },
      { label: 'Holiday Calendar', icon: Calendar,         path: '/admin/holidays' },
    ],
  },

  staff: {
    title: 'Teacher Panel',
    subtitle: 'Staff Portal',
    bottomItems: [
      { label: 'Home',       icon: LayoutDashboard, path: '/staff' },
      { label: 'Schedule',   icon: Clock,           path: '/staff/schedule' },
      { label: 'Classes',    icon: BookOpen,        path: '/staff/classes' },
      { label: 'Attendance', icon: QrCode,          path: '/staff/qr-attendance' },
    ],
    items: [
      { label: 'Dashboard',    icon: LayoutDashboard, path: '/staff' },
      { label: 'My Schedule',  icon: Clock,           path: '/staff/schedule' },
      { label: 'My Classes',   icon: BookOpen,        path: '/staff/classes' },
      { label: 'QR Attendance',icon: QrCode,          path: '/staff/qr-attendance' },
      { label: 'Apply Leave',  icon: FileText,        path: '/staff/leave' },
      { label: 'My Attendance',icon: ClipboardList,   path: '/staff/my-attendance' },
    ],
  },

  student: {
    title: 'Student Portal',
    subtitle: 'My School',
    items: [
      { label: 'Home',       icon: LayoutDashboard, path: '/student' },
      { label: 'Attendance', icon: ClipboardList,   path: '/student/attendance' },
      { label: 'Marks',      icon: Award,           path: '/student/marks' },
      { label: 'Fees',       icon: DollarSign,      path: '/student/fees' },
      { label: 'Profile',    icon: UserCircle,      path: '/student/profile' },
    ],
  },
};

export default navConfig;
