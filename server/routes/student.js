import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware, roleMiddleware('student'));

// GET /api/student/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const studentId = req.user.student_id;
    const schoolId  = req.user.school_id;

    const [[student]] = await db.query(
      `SELECT s.*, g.name AS grade_name, sec.name AS section_name
       FROM students s
       JOIN grades g ON g.id = s.grade_id
       JOIN sections sec ON sec.id = s.section_id
       WHERE s.id = ?`,
      [studentId]
    );
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const [[school]] = await db.query(
      'SELECT name, logo FROM schools WHERE id = ?',
      [schoolId]
    );

    // Attendance summary
    const [[attStats]] = await db.query(
      `SELECT COUNT(*) AS total,
              SUM(status='present') AS present_days,
              SUM(status='absent')  AS absent_days,
              SUM(status='late')    AS late_days
       FROM attendance_students WHERE student_id = ?`,
      [studentId]
    );
    const total   = Number(attStats.total);
    const present = Number(attStats.present_days);
    const absent  = Number(attStats.absent_days);
    const late    = Number(attStats.late_days);

    // Recent marks with exam and subject names
    const [marks] = await db.query(
      `SELECT m.*, e.name AS exam_name, sub.name AS subject_name
       FROM marks m
       JOIN exams e ON e.id = m.exam_id
       JOIN subjects sub ON sub.id = m.subject_id
       WHERE m.student_id = ?
       ORDER BY m.id DESC`,
      [studentId]
    );

    // Fee summary
    const [[feeStats]] = await db.query(
      `SELECT COALESCE(SUM(amount),0) AS total_paid FROM fee_payments WHERE student_id = ? AND status='paid'`,
      [studentId]
    );
    const [[feeStructureSum]] = await db.query(
      `SELECT COALESCE(SUM(amount),0) AS total_due FROM fees_structure WHERE school_id = ? AND grade_id = ?`,
      [schoolId, student.grade_id]
    );
    const [recentPayments] = await db.query(
      `SELECT * FROM fee_payments WHERE student_id = ? ORDER BY payment_date DESC LIMIT 5`,
      [studentId]
    );

    // Upcoming holidays
    const todayStr = new Date().toISOString().split('T')[0];
    const [holidays] = await db.query(
      `SELECT * FROM holidays WHERE school_id = ? AND date >= ? ORDER BY date LIMIT 5`,
      [schoolId, todayStr]
    );

    // Class teacher
    const [[ctAssign]] = await db.query(
      `SELECT st.name, st.phone
       FROM class_teacher_assignments cta
       JOIN staff st ON st.id = cta.staff_id
       WHERE cta.grade_id = ? AND cta.section_id = ?
       LIMIT 1`,
      [student.grade_id, student.section_id]
    );

    res.json({
      student: {
        id:           student.id,
        name:         student.name,
        roll_number:  student.roll_number,
        grade_name:   student.grade_name,
        section_name: student.section_name,
        avatar:       student.avatar,
      },
      school: { name: school?.name, logo: school?.logo },
      attendance: {
        total_days:  total,
        present,
        absent,
        late,
        percentage:  total > 0 ? ((present / total) * 100).toFixed(1) : 0,
      },
      marks,
      fees: {
        total_paid:      Number(feeStats.total_paid),
        monthly_due:     Number(feeStructureSum.total_due),
        recent_payments: recentPayments,
      },
      upcoming_holidays: holidays,
      class_teacher:     ctAssign ? { name: ctAssign.name, phone: ctAssign.phone } : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/student/attendance
router.get('/attendance', async (req, res) => {
  try {
    const studentId = req.user.student_id;

    const [records] = await db.query(
      'SELECT * FROM attendance_students WHERE student_id = ? ORDER BY date DESC',
      [studentId]
    );

    const total   = records.length;
    const present = records.filter(a => a.status === 'present').length;
    const absent  = records.filter(a => a.status === 'absent').length;
    const late    = records.filter(a => a.status === 'late').length;

    res.json({
      records,
      summary: {
        total,
        present,
        absent,
        late,
        percentage: total > 0 ? ((present / total) * 100).toFixed(1) : 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/student/marks
router.get('/marks', async (req, res) => {
  try {
    const [marks] = await db.query(
      `SELECT m.*, e.name AS exam_name, sub.name AS subject_name
       FROM marks m
       JOIN exams e ON e.id = m.exam_id
       JOIN subjects sub ON sub.id = m.subject_id
       WHERE m.student_id = ?
       ORDER BY e.name, sub.name`,
      [req.user.student_id]
    );

    const grouped = {};
    marks.forEach(m => {
      if (!grouped[m.exam_name]) grouped[m.exam_name] = [];
      grouped[m.exam_name].push(m);
    });

    res.json({ marks, grouped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/student/fees
router.get('/fees', async (req, res) => {
  try {
    const studentId = req.user.student_id;
    const schoolId  = req.user.school_id;

    const [[student]] = await db.query(
      'SELECT grade_id FROM students WHERE id = ?',
      [studentId]
    );
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const [structure] = await db.query(
      'SELECT * FROM fees_structure WHERE school_id = ? AND grade_id = ?',
      [schoolId, student.grade_id]
    );

    const [payments] = await db.query(
      `SELECT fp.*, fs.name AS fee_type
       FROM fee_payments fp
       LEFT JOIN fees_structure fs ON fs.id = fp.fee_structure_id
       WHERE fp.student_id = ?
       ORDER BY fp.payment_date DESC`,
      [studentId]
    );

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    const [[school]] = await db.query(
      'SELECT payment_methods FROM schools WHERE id = ?',
      [schoolId]
    );

    res.json({
      structure,
      payments,
      total_paid:            totalPaid,
      school_payment_methods: school?.payment_methods || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/student/pay-fee
router.post('/pay-fee', async (req, res) => {
  try {
    const { fee_structure_id, payment_method } = req.body;
    const studentId = req.user.student_id;
    const schoolId  = req.user.school_id;

    const [[feeStructure]] = await db.query(
      'SELECT * FROM fees_structure WHERE id = ?',
      [fee_structure_id]
    );
    if (!feeStructure) return res.status(404).json({ error: 'Fee structure not found' });

    const id         = uuidv4();
    const receiptNo  = `REC-${Date.now()}`;
    const today      = new Date().toISOString().split('T')[0];
    const month      = new Date().toISOString().substring(0, 7);

    await db.query(
      `INSERT INTO fee_payments (id,student_id,school_id,fee_structure_id,amount,payment_date,payment_method,status,receipt_no,month)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, studentId, schoolId, fee_structure_id, feeStructure.amount, today, payment_method||'online', 'paid', receiptNo, month]
    );

    const [[payment]] = await db.query('SELECT * FROM fee_payments WHERE id = ?', [id]);
    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/student/profile
router.get('/profile', async (req, res) => {
  try {
    const [[student]] = await db.query(
      `SELECT s.*, g.name AS grade_name, sec.name AS section_name, sch.name AS school_name
       FROM students s
       JOIN grades g ON g.id = s.grade_id
       JOIN sections sec ON sec.id = s.section_id
       JOIN schools sch ON sch.id = s.school_id
       WHERE s.id = ?`,
      [req.user.student_id]
    );
    if (!student) return res.status(404).json({ error: 'Student not found' });

    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
