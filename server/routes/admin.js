import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcryptjs from 'bcryptjs';
import db from '../config/db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware, roleMiddleware('school_admin'));

// GET /api/admin/dashboard
router.get('/dashboard', (req, res) => {
  const schoolId = req.user.school_id;
  const school = db.schools.find(s => s.id === schoolId);
  const students = db.students.filter(s => s.school_id === schoolId && s.is_active);
  const staffMembers = db.staff.filter(s => s.school_id === schoolId && s.is_active);
  const grades = db.grades.filter(g => g.school_id === schoolId);

  const totalFees = db.fee_payments.filter(p => p.school_id === schoolId && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingFees = db.fees_structure.filter(f => f.school_id === schoolId).reduce((sum, f) => sum + f.amount, 0) * students.length - totalFees;

  const attendanceRecords = db.attendance_students.filter(a => a.school_id === schoolId);
  const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
  const avgAttendance = attendanceRecords.length > 0 ? ((presentCount / attendanceRecords.length) * 100).toFixed(1) : 0;

  const gradeDistribution = grades.map(g => ({
    name: g.name,
    students: students.filter(s => s.grade_id === g.id).length,
  })).filter(g => g.students > 0);

  const recentPayments = db.fee_payments
    .filter(p => p.school_id === schoolId)
    .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
    .slice(0, 10)
    .map(p => {
      const student = db.students.find(s => s.id === p.student_id);
      const feeType = db.fees_structure.find(f => f.id === p.fee_structure_id);
      return { ...p, student_name: student?.name, fee_type: feeType?.name };
    });

  res.json({
    school,
    total_students: students.length,
    total_staff: staffMembers.length,
    total_grades: grades.length,
    total_fees_collected: totalFees,
    pending_fees: Math.max(0, pendingFees),
    avg_attendance: avgAttendance,
    grade_distribution: gradeDistribution,
    recent_payments: recentPayments,
  });
});

// =================== STAFF MANAGEMENT ===================

// GET /api/admin/staff
router.get('/staff', (req, res) => {
  const schoolId = req.user.school_id;
  const staffMembers = db.staff.filter(s => s.school_id === schoolId);

  const enriched = staffMembers.map(s => {
    const attendance = db.attendance_staff.filter(a => a.staff_id === s.id);
    const present = attendance.filter(a => a.status === 'present').length;
    const leaves = db.leaves.filter(l => l.staff_id === s.id);
    const assignment = db.class_teacher_assignments.find(a => a.staff_id === s.id);
    let assignedClass = null;
    if (assignment) {
      const grade = db.grades.find(g => g.id === assignment.grade_id);
      const section = db.sections.find(s => s.id === assignment.section_id);
      assignedClass = `${grade?.name} - ${section?.name}`;
    }
    return {
      ...s,
      attendance_percentage: attendance.length > 0 ? ((present / attendance.length) * 100).toFixed(1) : 0,
      total_leaves: leaves.length,
      pending_leaves: leaves.filter(l => l.status === 'pending').length,
      assigned_class: assignedClass,
    };
  });
  res.json(enriched);
});

// POST /api/admin/staff
router.post('/staff', async (req, res) => {
  const schoolId = req.user.school_id;
  const { name, email, phone, designation, department, salary, joining_date } = req.body;

  const staffId = uuidv4();
  const newStaff = {
    id: staffId,
    school_id: schoolId,
    name,
    designation: designation || 'Teacher',
    department: department || '',
    salary: salary || 0,
    phone: phone || '',
    email: email || '',
    avatar: null,
    joining_date: joining_date || new Date().toISOString().split('T')[0],
    is_active: true,
  };
  db.staff.push(newStaff);

  // Create login
  if (email) {
    const hash = await bcryptjs.hash('staff123', 10);
    db.users.push({
      id: uuidv4(),
      email,
      password: hash,
      name,
      role: 'staff',
      school_id: schoolId,
      staff_id: staffId,
      avatar: null,
      phone: phone || '',
      created_at: new Date().toISOString(),
    });
  }

  res.status(201).json(newStaff);
});

// PUT /api/admin/staff/:id
router.put('/staff/:id', (req, res) => {
  const idx = db.staff.findIndex(s => s.id === req.params.id && s.school_id === req.user.school_id);
  if (idx === -1) return res.status(404).json({ error: 'Staff not found' });
  db.staff[idx] = { ...db.staff[idx], ...req.body };
  res.json(db.staff[idx]);
});

// =================== STUDENT MANAGEMENT ===================

// GET /api/admin/students
router.get('/students', (req, res) => {
  const schoolId = req.user.school_id;
  const { grade_id, section_id } = req.query;
  let students = db.students.filter(s => s.school_id === schoolId);
  if (grade_id) students = students.filter(s => s.grade_id === grade_id);
  if (section_id) students = students.filter(s => s.section_id === section_id);

  const enriched = students.map(s => {
    const grade = db.grades.find(g => g.id === s.grade_id);
    const section = db.sections.find(sec => sec.id === s.section_id);
    const attendance = db.attendance_students.filter(a => a.student_id === s.id);
    const present = attendance.filter(a => a.status === 'present').length;
    const payments = db.fee_payments.filter(p => p.student_id === s.id);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      ...s,
      grade_name: grade?.name,
      section_name: section?.name,
      attendance_percentage: attendance.length > 0 ? ((present / attendance.length) * 100).toFixed(1) : 0,
      total_fees_paid: totalPaid,
    };
  });
  res.json(enriched);
});

// POST /api/admin/students
router.post('/students', async (req, res) => {
  const schoolId = req.user.school_id;
  const { name, grade_id, section_id, father_name, mother_name, father_phone, mother_phone, address, dob, gender, blood_group, email } = req.body;

  const studentId = uuidv4();
  const rollNo = `${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const newStudent = {
    id: studentId,
    school_id: schoolId,
    name,
    roll_number: rollNo,
    grade_id,
    section_id,
    father_name: father_name || '',
    mother_name: mother_name || '',
    father_phone: father_phone || '',
    mother_phone: mother_phone || '',
    address: address || '',
    dob: dob || '',
    gender: gender || '',
    blood_group: blood_group || '',
    admission_date: new Date().toISOString().split('T')[0],
    avatar: null,
    is_active: true,
  };
  db.students.push(newStudent);

  // Create login
  const loginEmail = email || `${rollNo.toLowerCase()}@student.erp`;
  const hash = await bcryptjs.hash('student123', 10);
  db.users.push({
    id: uuidv4(),
    email: loginEmail,
    password: hash,
    name,
    role: 'student',
    school_id: schoolId,
    student_id: studentId,
    avatar: null,
    phone: father_phone || '',
    created_at: new Date().toISOString(),
  });

  res.status(201).json({ ...newStudent, login_email: loginEmail });
});

// GET /api/admin/students/:id
router.get('/students/:id', (req, res) => {
  const student = db.students.find(s => s.id === req.params.id && s.school_id === req.user.school_id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const grade = db.grades.find(g => g.id === student.grade_id);
  const section = db.sections.find(s => s.id === student.section_id);
  const attendance = db.attendance_students.filter(a => a.student_id === student.id);
  const marks = db.marks.filter(m => m.student_id === student.id);
  const payments = db.fee_payments.filter(p => p.student_id === student.id);

  const enrichedMarks = marks.map(m => {
    const exam = db.exams.find(e => e.id === m.exam_id);
    const subject = db.subjects.find(s => s.id === m.subject_id);
    return { ...m, exam_name: exam?.name, subject_name: subject?.name };
  });

  res.json({
    ...student,
    grade_name: grade?.name,
    section_name: section?.name,
    attendance,
    marks: enrichedMarks,
    payments,
  });
});

// =================== GRADES & SECTIONS ===================

// GET /api/admin/grades
router.get('/grades', (req, res) => {
  const schoolId = req.user.school_id;
  const grades = db.grades.filter(g => g.school_id === schoolId).sort((a, b) => a.order - b.order);
  const enriched = grades.map(g => ({
    ...g,
    sections: db.sections.filter(s => s.grade_id === g.id),
    student_count: db.students.filter(s => s.grade_id === g.id && s.school_id === schoolId).length,
  }));
  res.json(enriched);
});

// =================== FEES ===================

// GET /api/admin/fees/structure
router.get('/fees/structure', (req, res) => {
  const schoolId = req.user.school_id;
  const structures = db.fees_structure.filter(f => f.school_id === schoolId);
  const enriched = structures.map(f => {
    const grade = db.grades.find(g => g.id === f.grade_id);
    return { ...f, grade_name: grade?.name };
  });
  res.json(enriched);
});

// POST /api/admin/fees/structure
router.post('/fees/structure', (req, res) => {
  const schoolId = req.user.school_id;
  const { grade_id, name, amount, frequency, due_day } = req.body;
  const newFee = {
    id: uuidv4(),
    school_id: schoolId,
    grade_id,
    name,
    amount,
    frequency: frequency || 'monthly',
    due_day: due_day || 10,
  };
  db.fees_structure.push(newFee);
  res.status(201).json(newFee);
});

// GET /api/admin/fees/payments
router.get('/fees/payments', (req, res) => {
  const schoolId = req.user.school_id;
  const payments = db.fee_payments.filter(p => p.school_id === schoolId);
  const enriched = payments.map(p => {
    const student = db.students.find(s => s.id === p.student_id);
    const feeType = db.fees_structure.find(f => f.id === p.fee_structure_id);
    return { ...p, student_name: student?.name, student_roll: student?.roll_number, fee_type: feeType?.name };
  });
  res.json(enriched);
});

// =================== EXAMS & MARKS ===================

// GET /api/admin/exams
router.get('/exams', (req, res) => {
  const schoolId = req.user.school_id;
  const exams = db.exams.filter(e => e.school_id === schoolId);
  res.json(exams);
});

// POST /api/admin/exams
router.post('/exams', (req, res) => {
  const schoolId = req.user.school_id;
  const newExam = { id: uuidv4(), school_id: schoolId, ...req.body };
  db.exams.push(newExam);
  res.status(201).json(newExam);
});

// POST /api/admin/marks
router.post('/marks', (req, res) => {
  const schoolId = req.user.school_id;
  const { student_id, exam_id, subject_id, obtained_marks, total_marks } = req.body;
  const pct = (obtained_marks / total_marks) * 100;
  let grade = 'D';
  if (pct >= 90) grade = 'A+';
  else if (pct >= 80) grade = 'A';
  else if (pct >= 70) grade = 'B+';
  else if (pct >= 60) grade = 'B';
  else if (pct >= 50) grade = 'C';

  const newMark = { id: uuidv4(), student_id, school_id: schoolId, exam_id, subject_id, obtained_marks, total_marks, grade };
  db.marks.push(newMark);
  res.status(201).json(newMark);
});

// =================== HOLIDAYS ===================

// GET /api/admin/holidays
router.get('/holidays', (req, res) => {
  const holidays = db.holidays.filter(h => h.school_id === req.user.school_id);
  res.json(holidays);
});

// POST /api/admin/holidays
router.post('/holidays', (req, res) => {
  const newHoliday = { id: uuidv4(), school_id: req.user.school_id, ...req.body };
  db.holidays.push(newHoliday);
  res.status(201).json(newHoliday);
});

// =================== LEAVES ===================

// GET /api/admin/leaves
router.get('/leaves', (req, res) => {
  const leaves = db.leaves.filter(l => l.school_id === req.user.school_id);
  const enriched = leaves.map(l => {
    const staffMember = db.staff.find(s => s.id === l.staff_id);
    return { ...l, staff_name: staffMember?.name, designation: staffMember?.designation };
  });
  res.json(enriched);
});

// PUT /api/admin/leaves/:id
router.put('/leaves/:id', (req, res) => {
  const idx = db.leaves.findIndex(l => l.id === req.params.id && l.school_id === req.user.school_id);
  if (idx === -1) return res.status(404).json({ error: 'Leave not found' });
  db.leaves[idx] = { ...db.leaves[idx], ...req.body };
  res.json(db.leaves[idx]);
});

// =================== ATTENDANCE ===================

// GET /api/admin/attendance/students
router.get('/attendance/students', (req, res) => {
  const { date, grade_id, section_id } = req.query;
  let records = db.attendance_students.filter(a => a.school_id === req.user.school_id);
  if (date) records = records.filter(a => a.date === date);

  if (grade_id || section_id) {
    const studentIds = db.students
      .filter(s => {
        let match = s.school_id === req.user.school_id;
        if (grade_id) match = match && s.grade_id === grade_id;
        if (section_id) match = match && s.section_id === section_id;
        return match;
      })
      .map(s => s.id);
    records = records.filter(a => studentIds.includes(a.student_id));
  }

  const enriched = records.map(a => {
    const student = db.students.find(s => s.id === a.student_id);
    return { ...a, student_name: student?.name, roll_number: student?.roll_number };
  });
  res.json(enriched);
});

// GET /api/admin/subjects
router.get('/subjects', (req, res) => {
  const subjects = db.subjects.filter(s => s.school_id === req.user.school_id);
  res.json(subjects);
});

export default router;
