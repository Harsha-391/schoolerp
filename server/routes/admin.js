import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcryptjs from 'bcryptjs';
import db from '../config/db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware, roleMiddleware('school_admin'));

// ── Dashboard ──────────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const schoolId = req.user.school_id;

    const [[school]]     = await db.query('SELECT * FROM schools WHERE id = ?', [schoolId]);
    const [[{ total_students }]] = await db.query('SELECT COUNT(*) AS total_students FROM students WHERE school_id = ? AND is_active = 1', [schoolId]);
    const [[{ total_staff }]]    = await db.query('SELECT COUNT(*) AS total_staff FROM staff WHERE school_id = ? AND is_active = 1', [schoolId]);
    const [[{ total_grades }]]   = await db.query('SELECT COUNT(*) AS total_grades FROM grades WHERE school_id = ?', [schoolId]);
    const [[{ total_fees }]]     = await db.query("SELECT COALESCE(SUM(amount),0) AS total_fees FROM fee_payments WHERE school_id = ? AND status = 'paid'", [schoolId]);

    const [attRows] = await db.query("SELECT status FROM attendance_students WHERE school_id = ?", [schoolId]);
    const present   = attRows.filter(a => a.status === 'present').length;
    const avgAtt    = attRows.length > 0 ? ((present / attRows.length) * 100).toFixed(1) : 0;

    const [grades] = await db.query('SELECT id, name FROM grades WHERE school_id = ?', [schoolId]);
    const [stuByGrade] = await db.query('SELECT grade_id, COUNT(*) AS cnt FROM students WHERE school_id = ? AND is_active = 1 GROUP BY grade_id', [schoolId]);
    const gradeMap = Object.fromEntries(stuByGrade.map(r => [r.grade_id, r.cnt]));
    const gradeDistribution = grades.map(g => ({ name: g.name, students: gradeMap[g.id] || 0 })).filter(g => g.students > 0);

    const [recentPayments] = await db.query(
      `SELECT fp.*, s.name AS student_name, fs.name AS fee_type
       FROM fee_payments fp
       LEFT JOIN students s  ON fp.student_id      = s.id
       LEFT JOIN fees_structure fs ON fp.fee_structure_id = fs.id
       WHERE fp.school_id = ?
       ORDER BY fp.payment_date DESC LIMIT 10`,
      [schoolId]
    );

    res.json({
      school, total_students, total_staff, total_grades,
      total_fees_collected: Number(total_fees),
      avg_attendance: avgAtt,
      grade_distribution: gradeDistribution,
      recent_payments: recentPayments,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Staff ──────────────────────────────────────────────────────────────────────
router.get('/staff', async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const [staffList] = await db.query('SELECT * FROM staff WHERE school_id = ?', [schoolId]);

    const [attCounts] = await db.query(
      "SELECT staff_id, COUNT(*) AS total, SUM(status='present') AS present_count FROM attendance_staff WHERE school_id = ? GROUP BY staff_id",
      [schoolId]
    );
    const [leaveCounts] = await db.query(
      "SELECT staff_id, COUNT(*) AS total_leaves, SUM(status='pending') AS pending_leaves FROM leaves WHERE school_id = ? GROUP BY staff_id",
      [schoolId]
    );
    const [assignments] = await db.query(
      `SELECT cta.staff_id, g.name AS grade_name, sec.name AS section_name
       FROM class_teacher_assignments cta
       JOIN grades   g   ON cta.grade_id   = g.id
       JOIN sections sec ON cta.section_id = sec.id
       WHERE cta.school_id = ?`,
      [schoolId]
    );

    const attMap  = Object.fromEntries(attCounts.map(r => [r.staff_id, r]));
    const lvMap   = Object.fromEntries(leaveCounts.map(r => [r.staff_id, r]));
    const asgMap  = Object.fromEntries(assignments.map(r => [r.staff_id, `${r.grade_name} - ${r.section_name}`]));

    res.json(staffList.map(s => {
      const att = attMap[s.id] || { total: 0, present_count: 0 };
      const lv  = lvMap[s.id]  || { total_leaves: 0, pending_leaves: 0 };
      return {
        ...s,
        attendance_percentage: att.total > 0 ? ((att.present_count / att.total) * 100).toFixed(1) : 0,
        total_leaves:   Number(lv.total_leaves),
        pending_leaves: Number(lv.pending_leaves),
        assigned_class: asgMap[s.id] || null,
      };
    }));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/staff', async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { name, email, phone, mobile_number, designation, department, salary, joining_date } = req.body;
    const staffId = uuidv4();
    const mobile  = mobile_number || phone || null;

    await db.query(
      `INSERT INTO staff (id,school_id,name,designation,department,salary,phone,email,joining_date,is_active)
       VALUES (?,?,?,?,?,?,?,?,?,1)`,
      [staffId, schoolId, name, designation||'Teacher', department||'', salary||0, phone||'', email||'', joining_date||new Date().toISOString().split('T')[0]]
    );
    // Create login: mobile number is the identifier, default password 123456, must change on first login
    const loginEmail = email || `${staffId.substring(0,8)}@staff.erp`;
    const hash = await bcryptjs.hash('123456', 10);
    await db.query(
      'INSERT INTO users (id,email,password,name,role,school_id,staff_id,phone,mobile_number,is_password_changed,created_at) VALUES (?,?,?,?,?,?,?,?,?,0,NOW())',
      [uuidv4(), loginEmail, hash, name, 'staff', schoolId, staffId, phone||'', mobile]
    );
    const [[newStaff]] = await db.query('SELECT * FROM staff WHERE id = ?', [staffId]);
    res.status(201).json({ ...newStaff, login_mobile: mobile, default_password: '123456' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/staff/:id', async (req, res) => {
  try {
    const { name, designation, department, salary, phone, email, joining_date, is_active } = req.body;
    await db.query(
      `UPDATE staff SET name=?,designation=?,department=?,salary=?,phone=?,email=?,joining_date=?,is_active=?
       WHERE id=? AND school_id=?`,
      [name, designation, department, salary, phone, email, joining_date, is_active??1, req.params.id, req.user.school_id]
    );
    const [[staff]] = await db.query('SELECT * FROM staff WHERE id = ?', [req.params.id]);
    res.json(staff);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/staff/:id/avatar', async (req, res) => {
  try {
    const { avatar } = req.body; // base64 data URL
    await db.query('UPDATE staff SET avatar=? WHERE id=? AND school_id=?',
      [avatar, req.params.id, req.user.school_id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Students ───────────────────────────────────────────────────────────────────
router.get('/students', async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { grade_id, section_id } = req.query;

    let sql = `SELECT s.*, g.name AS grade_name, sec.name AS section_name FROM students s
               LEFT JOIN grades   g   ON s.grade_id   = g.id
               LEFT JOIN sections sec ON s.section_id = sec.id
               WHERE s.school_id = ?`;
    const params = [schoolId];
    if (grade_id)   { sql += ' AND s.grade_id = ?';   params.push(grade_id); }
    if (section_id) { sql += ' AND s.section_id = ?'; params.push(section_id); }

    const [students] = await db.query(sql, params);

    const [attCounts] = await db.query(
      "SELECT student_id, COUNT(*) AS total, SUM(status='present') AS present_count FROM attendance_students WHERE school_id = ? GROUP BY student_id",
      [schoolId]
    );
    const [feeTotals] = await db.query(
      'SELECT student_id, SUM(amount) AS total_paid FROM fee_payments WHERE school_id = ? GROUP BY student_id',
      [schoolId]
    );

    const attMap = Object.fromEntries(attCounts.map(r => [r.student_id, r]));
    const feeMap = Object.fromEntries(feeTotals.map(r => [r.student_id, r.total_paid]));

    res.json(students.map(s => ({
      ...s,
      attendance_percentage: (attMap[s.id]?.total > 0) ? ((attMap[s.id].present_count / attMap[s.id].total) * 100).toFixed(1) : 0,
      total_fees_paid: Number(feeMap[s.id] || 0),
    })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/students', async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { name, grade_id, section_id, father_name, mother_name, father_phone, mother_phone,
            address, dob, gender, blood_group, email, mobile_number } = req.body;
    const studentId = uuidv4();
    const rollNo    = `${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
    const mobile    = mobile_number || father_phone || null;

    await db.query(
      `INSERT INTO students (id,school_id,name,roll_number,grade_id,section_id,father_name,mother_name,
        father_phone,mother_phone,address,dob,gender,blood_group,admission_date,is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`,
      [studentId, schoolId, name, rollNo, grade_id, section_id,
       father_name||'', mother_name||'', father_phone||'', mother_phone||'',
       address||'', dob||null, gender||'', blood_group||'',
       new Date().toISOString().split('T')[0]]
    );
    // Create login: mobile number is the identifier, default password 123456, must change on first login
    const loginEmail = email || `${rollNo.toLowerCase()}@student.erp`;
    const hash = await bcryptjs.hash('123456', 10);
    await db.query(
      'INSERT INTO users (id,email,password,name,role,school_id,student_id,phone,mobile_number,is_password_changed,created_at) VALUES (?,?,?,?,?,?,?,?,?,0,NOW())',
      [uuidv4(), loginEmail, hash, name, 'student', schoolId, studentId, father_phone||'', mobile]
    );
    const [[newStudent]] = await db.query('SELECT * FROM students WHERE id = ?', [studentId]);
    res.status(201).json({ ...newStudent, login_mobile: mobile, default_password: '123456' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/students/:id/avatar', async (req, res) => {
  try {
    const { avatar } = req.body;
    await db.query('UPDATE students SET avatar=? WHERE id=? AND school_id=?',
      [avatar, req.params.id, req.user.school_id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.get('/students/:id', async (req, res) => {
  try {
    const [[student]] = await db.query(
      `SELECT s.*, g.name AS grade_name, sec.name AS section_name
       FROM students s
       LEFT JOIN grades   g   ON s.grade_id   = g.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       WHERE s.id = ? AND s.school_id = ?`,
      [req.params.id, req.user.school_id]
    );
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const [attendance] = await db.query('SELECT * FROM attendance_students WHERE student_id = ?', [req.params.id]);
    const [marks]      = await db.query(
      `SELECT m.*, e.name AS exam_name, sub.name AS subject_name
       FROM marks m
       LEFT JOIN exams    e   ON m.exam_id    = e.id
       LEFT JOIN subjects sub ON m.subject_id = sub.id
       WHERE m.student_id = ?`,
      [req.params.id]
    );
    const [payments] = await db.query('SELECT * FROM fee_payments WHERE student_id = ?', [req.params.id]);

    res.json({ ...student, attendance, marks, payments });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Grades & Sections ──────────────────────────────────────────────────────────
router.get('/grades', async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const [grades]   = await db.query('SELECT * FROM grades WHERE school_id = ? ORDER BY `order`', [schoolId]);
    const [sections] = await db.query('SELECT * FROM sections WHERE school_id = ?', [schoolId]);
    const [stuCounts]= await db.query(
      'SELECT grade_id, COUNT(*) AS cnt FROM students WHERE school_id = ? AND is_active = 1 GROUP BY grade_id',
      [schoolId]
    );
    const countMap = Object.fromEntries(stuCounts.map(r => [r.grade_id, r.cnt]));
    res.json(grades.map(g => ({
      ...g,
      sections:      sections.filter(s => s.grade_id === g.id),
      student_count: countMap[g.id] || 0,
    })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/grades', async (req, res) => {
  try {
    const { name, order: gradeOrder } = req.body;
    const schoolId = req.user.school_id;
    const id = uuidv4();
    const [[{ maxOrder }]] = await db.query('SELECT COALESCE(MAX(`order`),0) AS maxOrder FROM grades WHERE school_id = ?', [schoolId]);
    await db.query('INSERT INTO grades (id,school_id,name,`order`) VALUES (?,?,?,?)',
      [id, schoolId, name, gradeOrder ?? (maxOrder + 1)]);
    const [[row]] = await db.query('SELECT * FROM grades WHERE id = ?', [id]);
    res.status(201).json({ ...row, sections: [], student_count: 0 });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/grades/:id', async (req, res) => {
  try {
    const [[{ cnt }]] = await db.query(
      'SELECT COUNT(*) AS cnt FROM students WHERE grade_id = ? AND school_id = ? AND is_active = 1',
      [req.params.id, req.user.school_id]
    );
    if (cnt > 0) return res.status(400).json({ error: 'Cannot delete grade with active students' });
    await db.query('DELETE FROM sections WHERE grade_id = ? AND school_id = ?', [req.params.id, req.user.school_id]);
    await db.query('DELETE FROM grades WHERE id = ? AND school_id = ?', [req.params.id, req.user.school_id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/grades/:id/sections', async (req, res) => {
  try {
    const { name } = req.body;
    const schoolId = req.user.school_id;
    const id = uuidv4();
    await db.query('INSERT INTO sections (id,grade_id,school_id,name) VALUES (?,?,?,?)',
      [id, req.params.id, schoolId, name]);
    const [[row]] = await db.query('SELECT * FROM sections WHERE id = ?', [id]);
    res.status(201).json(row);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/sections/:id', async (req, res) => {
  try {
    const [[{ cnt }]] = await db.query(
      'SELECT COUNT(*) AS cnt FROM students WHERE section_id = ? AND school_id = ? AND is_active = 1',
      [req.params.id, req.user.school_id]
    );
    if (cnt > 0) return res.status(400).json({ error: 'Cannot delete section with active students' });
    await db.query('DELETE FROM sections WHERE id = ? AND school_id = ?', [req.params.id, req.user.school_id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Fees ───────────────────────────────────────────────────────────────────────
router.get('/fees/structure', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT fs.*, g.name AS grade_name FROM fees_structure fs
       LEFT JOIN grades g ON fs.grade_id = g.id
       WHERE fs.school_id = ?`,
      [req.user.school_id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/fees/structure', async (req, res) => {
  try {
    const { grade_id, name, amount, frequency, due_day } = req.body;
    const id = uuidv4();
    await db.query(
      'INSERT INTO fees_structure (id,school_id,grade_id,name,amount,frequency,due_day) VALUES (?,?,?,?,?,?,?)',
      [id, req.user.school_id, grade_id, name, amount, frequency||'monthly', due_day||10]
    );
    const [[row]] = await db.query('SELECT * FROM fees_structure WHERE id = ?', [id]);
    res.status(201).json(row);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.get('/fees/payments', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT fp.*, s.name AS student_name, s.roll_number AS student_roll, fs.name AS fee_type
       FROM fee_payments fp
       LEFT JOIN students      s  ON fp.student_id       = s.id
       LEFT JOIN fees_structure fs ON fp.fee_structure_id = fs.id
       WHERE fp.school_id = ?
       ORDER BY fp.payment_date DESC`,
      [req.user.school_id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Exams & Marks ──────────────────────────────────────────────────────────────
router.get('/exams', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM exams WHERE school_id = ?', [req.user.school_id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/exams', async (req, res) => {
  try {
    const id = uuidv4();
    const { name, type, start_date, end_date, grade_id } = req.body;
    await db.query(
      'INSERT INTO exams (id,school_id,name,type,start_date,end_date,grade_id) VALUES (?,?,?,?,?,?,?)',
      [id, req.user.school_id, name, type, start_date, end_date, grade_id]
    );
    const [[row]] = await db.query('SELECT * FROM exams WHERE id = ?', [id]);
    res.status(201).json(row);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/exams/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM marks WHERE exam_id = ? AND school_id = ?', [req.params.id, req.user.school_id]);
    await db.query('DELETE FROM exams WHERE id = ? AND school_id = ?', [req.params.id, req.user.school_id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/marks', async (req, res) => {
  try {
    const { student_id, exam_id, subject_id, obtained_marks, total_marks } = req.body;
    const pct = (obtained_marks / total_marks) * 100;
    let grade = 'D';
    if (pct >= 90) grade = 'A+';
    else if (pct >= 80) grade = 'A';
    else if (pct >= 70) grade = 'B+';
    else if (pct >= 60) grade = 'B';
    else if (pct >= 50) grade = 'C';
    const id = uuidv4();
    await db.query(
      'INSERT INTO marks (id,student_id,school_id,exam_id,subject_id,obtained_marks,total_marks,grade) VALUES (?,?,?,?,?,?,?,?)',
      [id, student_id, req.user.school_id, exam_id, subject_id, obtained_marks, total_marks, grade]
    );
    const [[row]] = await db.query('SELECT * FROM marks WHERE id = ?', [id]);
    res.status(201).json(row);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Holidays ───────────────────────────────────────────────────────────────────
router.get('/holidays', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM holidays WHERE school_id = ? ORDER BY date', [req.user.school_id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/holidays', async (req, res) => {
  try {
    const id = uuidv4();
    const { name, date, type } = req.body;
    await db.query('INSERT INTO holidays (id,school_id,name,date,type) VALUES (?,?,?,?,?)',
      [id, req.user.school_id, name, date, type]);
    const [[row]] = await db.query('SELECT * FROM holidays WHERE id = ?', [id]);
    res.status(201).json(row);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Leaves ─────────────────────────────────────────────────────────────────────
router.get('/leaves', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.*, s.name AS staff_name, s.designation
       FROM leaves l
       LEFT JOIN staff s ON l.staff_id = s.id
       WHERE l.school_id = ?
       ORDER BY l.applied_on DESC`,
      [req.user.school_id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/leaves/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await db.query('UPDATE leaves SET status = ? WHERE id = ? AND school_id = ?',
      [status, req.params.id, req.user.school_id]);
    const [[row]] = await db.query('SELECT * FROM leaves WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Attendance ─────────────────────────────────────────────────────────────────
router.get('/attendance/students', async (req, res) => {
  try {
    const { date, grade_id, section_id } = req.query;
    let sql = `SELECT a.*, s.name AS student_name, s.roll_number
               FROM attendance_students a
               LEFT JOIN students s ON a.student_id = s.id
               WHERE a.school_id = ?`;
    const params = [req.user.school_id];
    if (date)       { sql += ' AND a.date = ?';        params.push(date); }
    if (grade_id)   { sql += ' AND s.grade_id = ?';    params.push(grade_id); }
    if (section_id) { sql += ' AND s.section_id = ?';  params.push(section_id); }
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Subjects ───────────────────────────────────────────────────────────────────
router.get('/subjects', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM subjects WHERE school_id = ?', [req.user.school_id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Finance Analytics ──────────────────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

router.get('/finance/analytics', async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Monthly income
    const [incomeRows] = await db.query(
      `SELECT MONTH(payment_date) AS m, SUM(amount) AS income
       FROM fee_payments WHERE school_id=? AND status='paid' AND YEAR(payment_date)=?
       GROUP BY MONTH(payment_date)`,
      [schoolId, year]
    );
    // Monthly other expenses
    const [otherRows] = await db.query(
      `SELECT MONTH(date) AS m, SUM(amount) AS total
       FROM other_expenses WHERE school_id=? AND YEAR(date)=?
       GROUP BY MONTH(date)`,
      [schoolId, year]
    );
    // Monthly salary cost (fixed)
    const [[{ monthly_salary }]] = await db.query(
      'SELECT COALESCE(SUM(salary),0) AS monthly_salary FROM staff WHERE school_id=? AND is_active=1',
      [schoolId]
    );
    // Income by fee type
    const [byFeeType] = await db.query(
      `SELECT fs.name, SUM(fp.amount) AS amount
       FROM fee_payments fp JOIN fees_structure fs ON fp.fee_structure_id=fs.id
       WHERE fp.school_id=? AND fp.status='paid' AND YEAR(fp.payment_date)=?
       GROUP BY fs.name`,
      [schoolId, year]
    );
    // Income by payment method
    const [byMethod] = await db.query(
      `SELECT payment_method AS method, SUM(amount) AS amount
       FROM fee_payments WHERE school_id=? AND status='paid' AND YEAR(payment_date)=?
       GROUP BY payment_method`,
      [schoolId, year]
    );
    // Other expenses by category
    const [byCategory] = await db.query(
      `SELECT category, SUM(amount) AS amount
       FROM other_expenses WHERE school_id=? AND YEAR(date)=?
       GROUP BY category`,
      [schoolId, year]
    );
    // Salary breakdown
    const [salaryBreakdown] = await db.query(
      'SELECT id, name, designation, department, salary AS monthly_salary FROM staff WHERE school_id=? AND is_active=1 ORDER BY salary DESC',
      [schoolId]
    );

    // Build 12-month array
    const incomeMap = Object.fromEntries(incomeRows.map(r => [r.m, Number(r.income)]));
    const otherMap  = Object.fromEntries(otherRows.map(r => [r.m, Number(r.total)]));
    const now = new Date();

    const monthly = MONTH_NAMES.map((name, idx) => {
      const monthNum = idx + 1;
      const isPast = (year < now.getFullYear()) || (year === now.getFullYear() && monthNum <= now.getMonth() + 1);
      const income        = incomeMap[monthNum] || 0;
      const salaryExpense = isPast ? Number(monthly_salary) : 0;
      const otherExpense  = otherMap[monthNum] || 0;
      const totalExpense  = salaryExpense + otherExpense;
      const profit        = income - totalExpense;
      return {
        month: name, month_num: monthNum, month_key: `${year}-${String(monthNum).padStart(2,'0')}`,
        income, salary_expense: salaryExpense, other_expense: otherExpense,
        total_expense: totalExpense, profit,
        profit_margin: income > 0 ? parseFloat(((profit / income) * 100).toFixed(1)) : 0,
      };
    });

    const totalIncome  = monthly.reduce((s, m) => s + m.income, 0);
    const totalSalary  = monthly.reduce((s, m) => s + m.salary_expense, 0);
    const totalOther   = monthly.reduce((s, m) => s + m.other_expense, 0);
    const totalExpenses = totalSalary + totalOther;
    const netProfit    = totalIncome - totalExpenses;

    res.json({
      year,
      summary: {
        total_income: totalIncome, total_salary_expense: totalSalary,
        total_other_expense: totalOther, total_expenses: totalExpenses,
        net_profit: netProfit,
        profit_margin: totalIncome > 0 ? parseFloat(((netProfit / totalIncome) * 100).toFixed(1)) : 0,
        monthly_salary_cost: Number(monthly_salary),
        total_staff: salaryBreakdown.length,
      },
      monthly,
      income_by_fee_type: byFeeType.map(r => ({ name: r.name, amount: Number(r.amount) })),
      income_by_method:   byMethod.map(r => ({ method: r.method, amount: Number(r.amount) })),
      salary_breakdown:   salaryBreakdown.map(s => ({ ...s, monthly_salary: Number(s.monthly_salary), annual_cost: Number(s.monthly_salary) * 12 })),
      other_by_category:  byCategory.map(r => ({ category: r.category, amount: Number(r.amount) })),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.get('/finance/expenses', async (req, res) => {
  try {
    const { year, month } = req.query;
    let sql = 'SELECT * FROM other_expenses WHERE school_id = ?';
    const params = [req.user.school_id];
    if (year && month) { sql += ' AND month = ?'; params.push(`${year}-${String(month).padStart(2,'0')}`); }
    else if (year)     { sql += ' AND YEAR(date) = ?'; params.push(year); }
    sql += ' ORDER BY date DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/finance/expenses', async (req, res) => {
  try {
    const { category, description, amount, date } = req.body;
    if (!category || !amount || !date) return res.status(400).json({ error: 'category, amount and date are required' });
    const id = uuidv4();
    const month = date.substring(0, 7);
    await db.query(
      'INSERT INTO other_expenses (id,school_id,category,description,amount,date,month) VALUES (?,?,?,?,?,?,?)',
      [id, req.user.school_id, category, description||'', Number(amount), date, month]
    );
    const [[row]] = await db.query('SELECT * FROM other_expenses WHERE id = ?', [id]);
    res.status(201).json(row);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/finance/expenses/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM other_expenses WHERE id = ? AND school_id = ?',
      [req.params.id, req.user.school_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

export default router;
