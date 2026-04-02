import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import db from '../config/db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware, roleMiddleware('staff'));

// GET /api/staff/dashboard
router.get('/dashboard', (req, res) => {
  const staffId = req.user.staff_id;
  const schoolId = req.user.school_id;
  const staffMember = db.staff.find(s => s.id === staffId);

  if (!staffMember) return res.status(404).json({ error: 'Staff not found' });

  const school = db.schools.find(s => s.id === schoolId);

  // Assigned classes
  const assignments = db.class_teacher_assignments.filter(a => a.staff_id === staffId);
  const assignedClasses = assignments.map(a => {
    const grade = db.grades.find(g => g.id === a.grade_id);
    const section = db.sections.find(s => s.id === a.section_id);
    const studentCount = db.students.filter(s => s.grade_id === a.grade_id && s.section_id === a.section_id && s.school_id === schoolId).length;
    return {
      assignment_id: a.id,
      grade_id: a.grade_id,
      section_id: a.section_id,
      grade_name: grade?.name,
      section_name: section?.name,
      student_count: studentCount,
    };
  });

  // Schedule for today
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  const todaySchedule = db.schedules
    .filter(s => s.staff_id === staffId && s.day === today)
    .sort((a, b) => a.period - b.period)
    .map(s => {
      const grade = db.grades.find(g => g.id === s.grade_id);
      const section = db.sections.find(sec => sec.id === s.section_id);
      const subject = db.subjects.find(sub => sub.id === s.subject_id);
      return {
        ...s,
        grade_name: grade?.name,
        section_name: section?.name,
        subject_name: subject?.name,
      };
    });

  // My attendance
  const myAttendance = db.attendance_staff.filter(a => a.staff_id === staffId);
  const presentDays = myAttendance.filter(a => a.status === 'present').length;
  const attendancePercentage = myAttendance.length > 0 ? ((presentDays / myAttendance.length) * 100).toFixed(1) : 0;

  // Pending leaves
  const pendingLeaves = db.leaves.filter(l => l.staff_id === staffId && l.status === 'pending').length;
  const totalLeaves = db.leaves.filter(l => l.staff_id === staffId).length;

  // Upcoming holidays
  const todayDate = new Date().toISOString().split('T')[0];
  const upcomingHolidays = db.holidays
    .filter(h => h.school_id === schoolId && h.date >= todayDate)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  res.json({
    staff: staffMember,
    school,
    assigned_classes: assignedClasses,
    today_schedule: todaySchedule,
    attendance_percentage: attendancePercentage,
    total_attendance_days: myAttendance.length,
    present_days: presentDays,
    pending_leaves: pendingLeaves,
    total_leaves: totalLeaves,
    upcoming_holidays: upcomingHolidays,
  });
});

// GET /api/staff/schedule
router.get('/schedule', (req, res) => {
  const staffId = req.user.staff_id;
  const schedules = db.schedules.filter(s => s.staff_id === staffId);

  const enriched = schedules.map(s => {
    const grade = db.grades.find(g => g.id === s.grade_id);
    const section = db.sections.find(sec => sec.id === s.section_id);
    const subject = db.subjects.find(sub => sub.id === s.subject_id);
    return { ...s, grade_name: grade?.name, section_name: section?.name, subject_name: subject?.name };
  });

  // Group by day
  const grouped = {};
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  dayOrder.forEach(day => {
    grouped[day] = enriched.filter(s => s.day === day).sort((a, b) => a.period - b.period);
  });

  res.json(grouped);
});

// POST /api/staff/leave
router.post('/leave', (req, res) => {
  const { type, start_date, end_date, reason } = req.body;
  const newLeave = {
    id: uuidv4(),
    staff_id: req.user.staff_id,
    school_id: req.user.school_id,
    type: type || 'casual',
    start_date,
    end_date,
    reason: reason || '',
    status: 'pending',
    applied_on: new Date().toISOString().split('T')[0],
  };
  db.leaves.push(newLeave);
  res.status(201).json(newLeave);
});

// GET /api/staff/leaves
router.get('/leaves', (req, res) => {
  const leaves = db.leaves.filter(l => l.staff_id === req.user.staff_id);
  res.json(leaves);
});

// GET /api/staff/qr-attendance
router.get('/qr-attendance', async (req, res) => {
  const staffId = req.user.staff_id;
  const today = new Date().toISOString().split('T')[0];
  const qrData = JSON.stringify({
    staff_id: staffId,
    school_id: req.user.school_id,
    date: today,
    timestamp: Date.now(),
  });

  try {
    const qrImage = await QRCode.toDataURL(qrData);

    // Also mark attendance
    const existing = db.attendance_staff.find(a => a.staff_id === staffId && a.date === today);
    if (!existing) {
      db.attendance_staff.push({
        id: uuidv4(),
        staff_id: staffId,
        school_id: req.user.school_id,
        date: today,
        status: 'present',
        check_in: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        check_out: null,
      });
    }

    res.json({ qr_image: qrImage, date: today, already_marked: !!existing });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR' });
  }
});

// GET /api/staff/my-classes
router.get('/my-classes', (req, res) => {
  const staffId = req.user.staff_id;
  const schoolId = req.user.school_id;
  const assignments = db.class_teacher_assignments.filter(a => a.staff_id === staffId);

  const classes = assignments.map(a => {
    const grade = db.grades.find(g => g.id === a.grade_id);
    const section = db.sections.find(s => s.id === a.section_id);
    const students = db.students.filter(s => s.grade_id === a.grade_id && s.section_id === a.section_id && s.school_id === schoolId);
    return {
      assignment: a,
      grade_name: grade?.name,
      section_name: section?.name,
      students: students.map(s => {
        const attendance = db.attendance_students.filter(at => at.student_id === s.id);
        const present = attendance.filter(at => at.status === 'present').length;
        return {
          ...s,
          attendance_percentage: attendance.length > 0 ? ((present / attendance.length) * 100).toFixed(1) : 0,
          father_phone: s.father_phone,
          mother_phone: s.mother_phone,
        };
      }),
    };
  });

  res.json(classes);
});

// POST /api/staff/mark-attendance
router.post('/mark-attendance', (req, res) => {
  const { student_id, date, status } = req.body;
  const staffId = req.user.staff_id;
  const schoolId = req.user.school_id;

  // Verify teacher is class teacher of this student
  const student = db.students.find(s => s.id === student_id && s.school_id === schoolId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const isClassTeacher = db.class_teacher_assignments.some(
    a => a.staff_id === staffId && a.grade_id === student.grade_id && a.section_id === student.section_id
  );
  if (!isClassTeacher) return res.status(403).json({ error: 'You are not class teacher for this student' });

  const attendanceDate = date || new Date().toISOString().split('T')[0];
  const existing = db.attendance_students.find(a => a.student_id === student_id && a.date === attendanceDate);
  if (existing) {
    existing.status = status;
    return res.json(existing);
  }

  const newAttendance = {
    id: uuidv4(),
    student_id,
    school_id: schoolId,
    date: attendanceDate,
    status: status || 'present',
    marked_by: staffId,
  };
  db.attendance_students.push(newAttendance);
  res.status(201).json(newAttendance);
});

// POST /api/staff/mark-bulk-attendance
router.post('/mark-bulk-attendance', (req, res) => {
  const { records, date } = req.body; // records: [{ student_id, status }]
  const staffId = req.user.staff_id;
  const schoolId = req.user.school_id;
  const attendanceDate = date || new Date().toISOString().split('T')[0];
  const results = [];

  records.forEach(r => {
    const existing = db.attendance_students.find(a => a.student_id === r.student_id && a.date === attendanceDate);
    if (existing) {
      existing.status = r.status;
      results.push(existing);
    } else {
      const newA = {
        id: uuidv4(),
        student_id: r.student_id,
        school_id: schoolId,
        date: attendanceDate,
        status: r.status || 'present',
        marked_by: staffId,
      };
      db.attendance_students.push(newA);
      results.push(newA);
    }
  });

  res.json({ marked: results.length, records: results });
});

// GET /api/staff/my-attendance
router.get('/my-attendance', (req, res) => {
  const attendance = db.attendance_staff.filter(a => a.staff_id === req.user.staff_id);
  res.json(attendance);
});

export default router;
