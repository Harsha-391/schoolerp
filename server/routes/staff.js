import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import db from '../config/db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware, roleMiddleware('staff'));

// GET /api/staff/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const staffId  = req.user.staff_id;
    const schoolId = req.user.school_id;

    const [[staffMember]] = await db.query('SELECT * FROM staff WHERE id = ?', [staffId]);
    if (!staffMember) return res.status(404).json({ error: 'Staff not found' });

    const [[school]] = await db.query('SELECT * FROM schools WHERE id = ?', [schoolId]);

    // Assigned classes with student counts
    const [assignments] = await db.query(
      `SELECT cta.*, g.name AS grade_name, sec.name AS section_name,
              (SELECT COUNT(*) FROM students st
               WHERE st.grade_id = cta.grade_id AND st.section_id = cta.section_id AND st.school_id = ?) AS student_count
       FROM class_teacher_assignments cta
       JOIN grades g ON g.id = cta.grade_id
       JOIN sections sec ON sec.id = cta.section_id
       WHERE cta.staff_id = ?`,
      [schoolId, staffId]
    );

    // Schedule for today
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const today = days[new Date().getDay()];
    const [todaySchedule] = await db.query(
      `SELECT s.*, g.name AS grade_name, sec.name AS section_name, sub.name AS subject_name
       FROM schedules s
       JOIN grades g ON g.id = s.grade_id
       JOIN sections sec ON sec.id = s.section_id
       JOIN subjects sub ON sub.id = s.subject_id
       WHERE s.staff_id = ? AND s.day = ?
       ORDER BY s.period`,
      [staffId, today]
    );

    // My attendance stats
    const [[attStats]] = await db.query(
      `SELECT COUNT(*) AS total, SUM(status='present') AS present_days
       FROM attendance_staff WHERE staff_id = ?`,
      [staffId]
    );
    const total        = Number(attStats.total);
    const presentDays  = Number(attStats.present_days);
    const attendancePct = total > 0 ? ((presentDays / total) * 100).toFixed(1) : 0;

    // Leaves
    const [[leaveStats]] = await db.query(
      `SELECT COUNT(*) AS total, SUM(status='pending') AS pending
       FROM leaves WHERE staff_id = ?`,
      [staffId]
    );

    // Upcoming holidays
    const todayDate = new Date().toISOString().split('T')[0];
    const [holidays] = await db.query(
      `SELECT * FROM holidays WHERE school_id = ? AND date >= ? ORDER BY date LIMIT 5`,
      [schoolId, todayDate]
    );

    res.json({
      staff:                   staffMember,
      school,
      assigned_classes:        assignments.map(a => ({
        assignment_id: a.id,
        grade_id:      a.grade_id,
        section_id:    a.section_id,
        grade_name:    a.grade_name,
        section_name:  a.section_name,
        student_count: Number(a.student_count),
      })),
      today_schedule:          todaySchedule,
      attendance_percentage:   attendancePct,
      total_attendance_days:   total,
      present_days:            presentDays,
      pending_leaves:          Number(leaveStats.pending),
      total_leaves:            Number(leaveStats.total),
      upcoming_holidays:       holidays,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/staff/schedule
router.get('/schedule', async (req, res) => {
  try {
    const [schedules] = await db.query(
      `SELECT s.*, g.name AS grade_name, sec.name AS section_name, sub.name AS subject_name
       FROM schedules s
       JOIN grades g ON g.id = s.grade_id
       JOIN sections sec ON sec.id = s.section_id
       JOIN subjects sub ON sub.id = s.subject_id
       WHERE s.staff_id = ?
       ORDER BY FIELD(s.day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), s.period`,
      [req.user.staff_id]
    );

    const dayOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const grouped  = {};
    dayOrder.forEach(day => { grouped[day] = []; });
    schedules.forEach(s => { if (grouped[s.day]) grouped[s.day].push(s); });

    res.json(grouped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/staff/leave
router.post('/leave', async (req, res) => {
  try {
    const { type, start_date, end_date, reason } = req.body;
    const id         = uuidv4();
    const appliedOn  = new Date().toISOString().split('T')[0];

    await db.query(
      `INSERT INTO leaves (id,staff_id,school_id,type,start_date,end_date,reason,status,applied_on)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, req.user.staff_id, req.user.school_id, type||'casual', start_date, end_date, reason||'', 'pending', appliedOn]
    );

    const [[newLeave]] = await db.query('SELECT * FROM leaves WHERE id = ?', [id]);
    res.status(201).json(newLeave);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/staff/leaves
router.get('/leaves', async (req, res) => {
  try {
    const [leaves] = await db.query(
      'SELECT * FROM leaves WHERE staff_id = ? ORDER BY applied_on DESC',
      [req.user.staff_id]
    );
    res.json(leaves);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/staff/qr-attendance
router.get('/qr-attendance', async (req, res) => {
  const staffId  = req.user.staff_id;
  const schoolId = req.user.school_id;
  const today    = new Date().toISOString().split('T')[0];

  const qrData = JSON.stringify({
    staff_id:  staffId,
    school_id: schoolId,
    date:      today,
    timestamp: Date.now(),
  });

  try {
    const qrImage = await QRCode.toDataURL(qrData);

    const [[existing]] = await db.query(
      'SELECT id FROM attendance_staff WHERE staff_id = ? AND date = ?',
      [staffId, today]
    );

    if (!existing) {
      const checkIn = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      await db.query(
        `INSERT INTO attendance_staff (id,staff_id,school_id,date,status,check_in,check_out)
         VALUES (?,?,?,?,?,?,NULL)`,
        [uuidv4(), staffId, schoolId, today, 'present', checkIn]
      );
    }

    res.json({ qr_image: qrImage, date: today, already_marked: !!existing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate QR' });
  }
});

// GET /api/staff/my-classes
router.get('/my-classes', async (req, res) => {
  try {
    const staffId  = req.user.staff_id;
    const schoolId = req.user.school_id;

    const [assignments] = await db.query(
      `SELECT cta.*, g.name AS grade_name, sec.name AS section_name
       FROM class_teacher_assignments cta
       JOIN grades g ON g.id = cta.grade_id
       JOIN sections sec ON sec.id = cta.section_id
       WHERE cta.staff_id = ?`,
      [staffId]
    );

    const classes = await Promise.all(assignments.map(async a => {
      const [students] = await db.query(
        `SELECT st.*,
                COUNT(att.id)                             AS total_att,
                SUM(att.status = 'present')               AS present_att
         FROM students st
         LEFT JOIN attendance_students att ON att.student_id = st.id
         WHERE st.grade_id = ? AND st.section_id = ? AND st.school_id = ?
         GROUP BY st.id`,
        [a.grade_id, a.section_id, schoolId]
      );

      return {
        assignment:   a,
        grade_name:   a.grade_name,
        section_name: a.section_name,
        students:     students.map(s => ({
          ...s,
          attendance_percentage: Number(s.total_att) > 0
            ? ((Number(s.present_att) / Number(s.total_att)) * 100).toFixed(1)
            : 0,
        })),
      };
    }));

    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/staff/mark-attendance
router.post('/mark-attendance', async (req, res) => {
  try {
    const { student_id, date, status } = req.body;
    const staffId  = req.user.staff_id;
    const schoolId = req.user.school_id;

    const [[student]] = await db.query(
      'SELECT * FROM students WHERE id = ? AND school_id = ?',
      [student_id, schoolId]
    );
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const [[isClassTeacher]] = await db.query(
      `SELECT id FROM class_teacher_assignments
       WHERE staff_id = ? AND grade_id = ? AND section_id = ?`,
      [staffId, student.grade_id, student.section_id]
    );
    if (!isClassTeacher) return res.status(403).json({ error: 'You are not class teacher for this student' });

    const attendanceDate = date || new Date().toISOString().split('T')[0];

    await db.query(
      `INSERT INTO attendance_students (id,student_id,school_id,date,status,marked_by)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [uuidv4(), student_id, schoolId, attendanceDate, status||'present', staffId]
    );

    const [[record]] = await db.query(
      'SELECT * FROM attendance_students WHERE student_id = ? AND date = ?',
      [student_id, attendanceDate]
    );
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/staff/mark-bulk-attendance
router.post('/mark-bulk-attendance', async (req, res) => {
  try {
    const { records, date } = req.body;
    const staffId        = req.user.staff_id;
    const schoolId       = req.user.school_id;
    const attendanceDate = date || new Date().toISOString().split('T')[0];

    for (const r of records) {
      await db.query(
        `INSERT INTO attendance_students (id,student_id,school_id,date,status,marked_by)
         VALUES (?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE status = VALUES(status)`,
        [uuidv4(), r.student_id, schoolId, attendanceDate, r.status||'present', staffId]
      );
    }

    const [results] = await db.query(
      `SELECT * FROM attendance_students
       WHERE school_id = ? AND date = ? AND student_id IN (?)`,
      [schoolId, attendanceDate, records.map(r => r.student_id)]
    );

    res.json({ marked: results.length, records: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/staff/my-attendance
router.get('/my-attendance', async (req, res) => {
  try {
    const [attendance] = await db.query(
      'SELECT * FROM attendance_staff WHERE staff_id = ? ORDER BY date DESC',
      [req.user.staff_id]
    );
    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
