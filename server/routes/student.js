import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware, roleMiddleware('student'));

// GET /api/student/dashboard
router.get('/dashboard', (req, res) => {
  const studentId = req.user.student_id;
  const schoolId = req.user.school_id;
  const student = db.students.find(s => s.id === studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const school = db.schools.find(s => s.id === schoolId);
  const grade = db.grades.find(g => g.id === student.grade_id);
  const section = db.sections.find(s => s.id === student.section_id);

  // Attendance
  const attendance = db.attendance_students.filter(a => a.student_id === studentId);
  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const absentDays = attendance.filter(a => a.status === 'absent').length;
  const lateDays = attendance.filter(a => a.status === 'late').length;
  const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

  // Recent marks
  const marks = db.marks.filter(m => m.student_id === studentId);
  const enrichedMarks = marks.map(m => {
    const exam = db.exams.find(e => e.id === m.exam_id);
    const subject = db.subjects.find(s => s.id === m.subject_id);
    return { ...m, exam_name: exam?.name, subject_name: subject?.name };
  });

  // Fee summary
  const payments = db.fee_payments.filter(p => p.student_id === studentId);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const feeStructure = db.fees_structure.filter(f => f.school_id === schoolId && f.grade_id === student.grade_id);
  const totalDue = feeStructure.reduce((sum, f) => sum + f.amount, 0);

  // Upcoming holidays
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingHolidays = db.holidays
    .filter(h => h.school_id === schoolId && h.date >= todayStr)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  // Class teacher
  const classTeacherAssignment = db.class_teacher_assignments.find(
    a => a.grade_id === student.grade_id && a.section_id === student.section_id
  );
  let classTeacher = null;
  if (classTeacherAssignment) {
    classTeacher = db.staff.find(s => s.id === classTeacherAssignment.staff_id);
  }

  res.json({
    student: {
      ...student,
      grade_name: grade?.name,
      section_name: section?.name,
    },
    school: { name: school?.name, logo: school?.logo },
    attendance: {
      total_days: totalDays,
      present: presentDays,
      absent: absentDays,
      late: lateDays,
      percentage: attendancePercentage,
    },
    marks: enrichedMarks,
    fees: {
      total_paid: totalPaid,
      monthly_due: totalDue,
      recent_payments: payments.slice(-5),
    },
    upcoming_holidays: upcomingHolidays,
    class_teacher: classTeacher ? { name: classTeacher.name, phone: classTeacher.phone } : null,
  });
});

// GET /api/student/attendance
router.get('/attendance', (req, res) => {
  const attendance = db.attendance_students.filter(a => a.student_id === req.user.student_id);
  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const absentDays = attendance.filter(a => a.status === 'absent').length;
  const lateDays = attendance.filter(a => a.status === 'late').length;
  res.json({
    records: attendance.sort((a, b) => new Date(b.date) - new Date(a.date)),
    summary: {
      total: totalDays,
      present: presentDays,
      absent: absentDays,
      late: lateDays,
      percentage: totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0,
    },
  });
});

// GET /api/student/marks
router.get('/marks', (req, res) => {
  const marks = db.marks.filter(m => m.student_id === req.user.student_id);
  const enriched = marks.map(m => {
    const exam = db.exams.find(e => e.id === m.exam_id);
    const subject = db.subjects.find(s => s.id === m.subject_id);
    return { ...m, exam_name: exam?.name, subject_name: subject?.name };
  });

  // Group by exam
  const grouped = {};
  enriched.forEach(m => {
    if (!grouped[m.exam_name]) grouped[m.exam_name] = [];
    grouped[m.exam_name].push(m);
  });

  res.json({ marks: enriched, grouped });
});

// GET /api/student/fees
router.get('/fees', (req, res) => {
  const studentId = req.user.student_id;
  const student = db.students.find(s => s.id === studentId);
  const schoolId = req.user.school_id;

  const feeStructure = db.fees_structure.filter(f => f.school_id === schoolId && f.grade_id === student?.grade_id);
  const payments = db.fee_payments.filter(p => p.student_id === studentId);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const enrichedPayments = payments.map(p => {
    const feeType = db.fees_structure.find(f => f.id === p.fee_structure_id);
    return { ...p, fee_type: feeType?.name };
  });

  res.json({
    structure: feeStructure,
    payments: enrichedPayments,
    total_paid: totalPaid,
    school_payment_methods: db.schools.find(s => s.id === schoolId)?.payment_methods || [],
  });
});

// POST /api/student/pay-fee
router.post('/pay-fee', (req, res) => {
  const { fee_structure_id, payment_method } = req.body;
  const studentId = req.user.student_id;
  const schoolId = req.user.school_id;

  const feeStructure = db.fees_structure.find(f => f.id === fee_structure_id);
  if (!feeStructure) return res.status(404).json({ error: 'Fee structure not found' });

  const payment = {
    id: uuidv4(),
    student_id: studentId,
    school_id: schoolId,
    fee_structure_id,
    amount: feeStructure.amount,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: payment_method || 'online',
    status: 'paid',
    receipt_no: `REC-${Date.now()}`,
    month: new Date().toISOString().substring(0, 7),
  };
  db.fee_payments.push(payment);
  res.status(201).json(payment);
});

// GET /api/student/profile
router.get('/profile', (req, res) => {
  const student = db.students.find(s => s.id === req.user.student_id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const grade = db.grades.find(g => g.id === student.grade_id);
  const section = db.sections.find(s => s.id === student.section_id);
  const school = db.schools.find(s => s.id === req.user.school_id);

  res.json({
    ...student,
    grade_name: grade?.name,
    section_name: section?.name,
    school_name: school?.name,
  });
});

export default router;
