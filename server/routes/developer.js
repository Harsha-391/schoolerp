import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcryptjs from 'bcryptjs';
import db from '../config/db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require developer role
router.use(authMiddleware, roleMiddleware('developer'));

// GET /api/developer/dashboard
router.get('/dashboard', (req, res) => {
  const totalSchools = db.schools.length;
  const activeSchools = db.schools.filter(s => s.is_active).length;
  const totalStudents = db.students.length;
  const totalStaff = db.staff.length;
  const totalRevenue = db.schools.reduce((sum, school) => {
    const studentCount = db.students.filter(s => s.school_id === school.id).length;
    return sum + (studentCount * school.rate_per_student);
  }, 0);

  const schoolStats = db.schools.map(school => {
    const studentCount = db.students.filter(s => s.school_id === school.id).length;
    const staffCount = db.staff.filter(s => s.school_id === school.id).length;
    const revenue = studentCount * school.rate_per_student;
    const totalFees = db.fee_payments
      .filter(p => p.school_id === school.id && p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    return {
      ...school,
      student_count: studentCount,
      staff_count: staffCount,
      platform_revenue: revenue,
      fees_collected: totalFees,
    };
  });

  // Monthly revenue chart data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueChart = months.map((m, i) => ({
    month: m,
    revenue: Math.floor(totalRevenue * (0.7 + Math.random() * 0.6) / 12),
  }));

  res.json({
    totalSchools,
    activeSchools,
    totalStudents,
    totalStaff,
    totalRevenue,
    schoolStats,
    revenueChart,
  });
});

// GET /api/developer/schools
router.get('/schools', (req, res) => {
  const schools = db.schools.map(school => ({
    ...school,
    student_count: db.students.filter(s => s.school_id === school.id).length,
    staff_count: db.staff.filter(s => s.school_id === school.id).length,
    admin: db.users.find(u => u.school_id === school.id && u.role === 'school_admin'),
  }));
  res.json(schools);
});

// POST /api/developer/schools
router.post('/schools', async (req, res) => {
  const { name, address, city, state, phone, email, subdomain, rate_per_student, payment_methods, admin_name, admin_email, admin_password, razorpay_account_id } = req.body;

  // Check subdomain uniqueness
  if (db.schools.find(s => s.subdomain === subdomain)) {
    return res.status(400).json({ error: 'Subdomain already in use' });
  }

  const schoolId = uuidv4();
  const newSchool = {
    id: schoolId,
    name,
    address: address || '',
    city: city || '',
    state: state || '',
    phone: phone || '',
    email: email || '',
    logo: null,
    subdomain,
    rate_per_student: rate_per_student || 200,
    payment_methods: payment_methods || ['online', 'cash'],
    razorpay_account_id: razorpay_account_id || null,
    is_active: true,
    created_at: new Date().toISOString(),
  };
  db.schools.push(newSchool);

  // Create admin user for this school
  if (admin_email && admin_password) {
    const hash = await bcryptjs.hash(admin_password, 10);
    db.users.push({
      id: uuidv4(),
      email: admin_email,
      password: hash,
      name: admin_name || 'School Admin',
      role: 'school_admin',
      school_id: schoolId,
      avatar: null,
      phone: phone || '',
      created_at: new Date().toISOString(),
    });
  }

  // Create default grades
  const defaultGrades = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
  defaultGrades.forEach((g, idx) => {
    const gId = uuidv4();
    db.grades.push({ id: gId, school_id: schoolId, name: g, order: idx });
    ['A', 'B'].forEach(sec => {
      db.sections.push({ id: uuidv4(), grade_id: gId, school_id: schoolId, name: sec });
    });
  });

  res.status(201).json(newSchool);
});

// PUT /api/developer/schools/:id
router.put('/schools/:id', async (req, res) => {
  const idx = db.schools.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'School not found' });

  const { admin_name, admin_email, admin_password, ...updates } = req.body;
  
  db.schools[idx] = { ...db.schools[idx], ...updates };

  // Update admin user if details provided
  const adminUser = db.users.find(u => u.school_id === req.params.id && u.role === 'school_admin');
  if (adminUser) {
    if (admin_name) adminUser.name = admin_name;
    if (admin_email) adminUser.email = admin_email;
    if (admin_password) {
      adminUser.password = await bcryptjs.hash(admin_password, 10);
    }
  }

  res.json(db.schools[idx]);
});

// DELETE /api/developer/schools/:id
router.delete('/schools/:id', (req, res) => {
  const idx = db.schools.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'School not found' });
  db.schools[idx].is_active = false;
  res.json({ message: 'School deactivated' });
});

// GET /api/developer/schools/:id/analytics
router.get('/schools/:id/analytics', (req, res) => {
  const school = db.schools.find(s => s.id === req.params.id);
  if (!school) return res.status(404).json({ error: 'School not found' });

  const students = db.students.filter(s => s.school_id === school.id);
  const staffMembers = db.staff.filter(s => s.school_id === school.id);
  const grades = db.grades.filter(g => g.school_id === school.id);
  const payments = db.fee_payments.filter(p => p.school_id === school.id);

  const gradeDistribution = grades.map(g => ({
    grade: g.name,
    count: students.filter(s => s.grade_id === g.id).length,
  })).filter(g => g.count > 0);

  const totalFees = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidFees = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

  const attendanceRate = db.attendance_students.filter(a => a.school_id === school.id);
  const presentCount = attendanceRate.filter(a => a.status === 'present').length;
  const avgAttendance = attendanceRate.length > 0 ? ((presentCount / attendanceRate.length) * 100).toFixed(1) : 0;

  res.json({
    school,
    student_count: students.length,
    staff_count: staffMembers.length,
    grade_count: grades.length,
    total_fees_collected: totalFees,
    paid_fees: paidFees,
    platform_revenue: students.length * school.rate_per_student,
    avg_attendance: avgAttendance,
    grade_distribution: gradeDistribution,
    payment_methods: school.payment_methods,
    students,
    staff: staffMembers,
    attendance: attendanceRate,
    transactions: payments,
  });
});

export default router;
