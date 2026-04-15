import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcryptjs from 'bcryptjs';
import db from '../config/db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware, roleMiddleware('developer'));

const GRADE_NAMES = ['Nursery','LKG','UKG','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];

// GET /api/developer/dashboard
router.get('/dashboard', async (_req, res) => {
  try {
    const [schools]  = await db.query('SELECT * FROM schools');
    const [[{ totalStudents }]] = await db.query('SELECT COUNT(*) AS totalStudents FROM students');
    const [[{ totalStaff }]]   = await db.query('SELECT COUNT(*) AS totalStaff FROM staff');

    const [studentCounts] = await db.query(
      'SELECT school_id, COUNT(*) AS cnt FROM students GROUP BY school_id'
    );
    const [staffCounts] = await db.query(
      'SELECT school_id, COUNT(*) AS cnt FROM staff GROUP BY school_id'
    );
    const [feeTotals] = await db.query(
      "SELECT school_id, SUM(amount) AS total FROM fee_payments WHERE status='paid' GROUP BY school_id"
    );

    const stuMap  = Object.fromEntries(studentCounts.map(r => [r.school_id, r.cnt]));
    const stfMap  = Object.fromEntries(staffCounts.map(r => [r.school_id, r.cnt]));
    const feeMap  = Object.fromEntries(feeTotals.map(r => [r.school_id, Number(r.total)]));

    const schoolStats = schools.map(s => ({
      ...s,
      student_count:    stuMap[s.id] || 0,
      staff_count:      stfMap[s.id] || 0,
      platform_revenue: (stuMap[s.id] || 0) * Number(s.rate_per_student),
      fees_collected:   feeMap[s.id] || 0,
    }));

    const totalRevenue = schoolStats.reduce((sum, s) => sum + s.platform_revenue, 0);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const revenueChart = months.map(month => ({
      month,
      revenue: Math.floor(totalRevenue * (0.7 + ((months.indexOf(month) * 17) % 60) / 100) / 12),
    }));

    res.json({
      totalSchools:  schools.length,
      activeSchools: schools.filter(s => s.is_active).length,
      totalStudents: Number(totalStudents),
      totalStaff:    Number(totalStaff),
      totalRevenue,
      schoolStats,
      revenueChart,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/developer/schools
router.get('/schools', async (_req, res) => {
  try {
    const [schools] = await db.query('SELECT * FROM schools ORDER BY created_at DESC');
    const [stuCounts] = await db.query('SELECT school_id, COUNT(*) AS cnt FROM students GROUP BY school_id');
    const [stfCounts] = await db.query('SELECT school_id, COUNT(*) AS cnt FROM staff GROUP BY school_id');
    const [admins]    = await db.query("SELECT * FROM users WHERE role = 'school_admin'");

    const stuMap = Object.fromEntries(stuCounts.map(r => [r.school_id, r.cnt]));
    const stfMap = Object.fromEntries(stfCounts.map(r => [r.school_id, r.cnt]));
    const admMap = Object.fromEntries(admins.map(u => [u.school_id, u]));

    res.json(schools.map(s => ({
      ...s,
      student_count: stuMap[s.id] || 0,
      staff_count:   stfMap[s.id] || 0,
      admin:         admMap[s.id] || null,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/developer/schools
router.post('/schools', async (req, res) => {
  try {
    const { name, address, city, state, phone, email, subdomain, rate_per_student,
            payment_methods, admin_name, admin_email, admin_password, razorpay_account_id } = req.body;

    const [[existing]] = await db.query('SELECT id FROM schools WHERE subdomain = ?', [subdomain]);
    if (existing) return res.status(400).json({ error: 'Subdomain already in use' });

    const schoolId = uuidv4();
    await db.query(
      `INSERT INTO schools (id,name,address,city,state,phone,email,logo,subdomain,rate_per_student,payment_methods,razorpay_account_id,is_active,created_at)
       VALUES (?,?,?,?,?,?,?,NULL,?,?,?,?,1,NOW())`,
      [schoolId, name, address||'', city||'', state||'', phone||'', email||'',
       subdomain, rate_per_student||200,
       JSON.stringify(payment_methods || ['online','cash']),
       razorpay_account_id||null]
    );

    if (admin_email && admin_password) {
      const hash = await bcryptjs.hash(admin_password, 10);
      await db.query(
        'INSERT INTO users (id,email,password,name,role,school_id,phone,created_at) VALUES (?,?,?,?,?,?,?,NOW())',
        [uuidv4(), admin_email, hash, admin_name||'School Admin', 'school_admin', schoolId, phone||'']
      );
    }

    // Default grades + sections
    for (let i = 0; i < GRADE_NAMES.length; i++) {
      const gId = uuidv4();
      await db.query(
        'INSERT INTO grades (id,school_id,name,`order`) VALUES (?,?,?,?)',
        [gId, schoolId, GRADE_NAMES[i], i]
      );
      for (const sec of ['A', 'B']) {
        await db.query(
          'INSERT INTO sections (id,grade_id,school_id,name) VALUES (?,?,?,?)',
          [uuidv4(), gId, schoolId, sec]
        );
      }
    }

    const [[newSchool]] = await db.query('SELECT * FROM schools WHERE id = ?', [schoolId]);
    res.status(201).json(newSchool);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/developer/schools/:id
router.put('/schools/:id', async (req, res) => {
  try {
    const { admin_name, admin_email, admin_password, payment_methods, ...updates } = req.body;

    if (payment_methods) updates.payment_methods = JSON.stringify(payment_methods);

    const fields = ['name','address','city','state','phone','email','subdomain',
                    'rate_per_student','payment_methods','razorpay_account_id','is_active'];
    const toSet = Object.fromEntries(Object.entries(updates).filter(([k]) => fields.includes(k)));

    if (Object.keys(toSet).length > 0) {
      const setClause = Object.keys(toSet).map(k => `${k} = ?`).join(', ');
      await db.query(`UPDATE schools SET ${setClause} WHERE id = ?`, [...Object.values(toSet), req.params.id]);
    }

    if (admin_name || admin_email || admin_password) {
      const adminUpdates = [];
      const adminVals = [];
      if (admin_name)     { adminUpdates.push('name = ?');     adminVals.push(admin_name); }
      if (admin_email)    { adminUpdates.push('email = ?');    adminVals.push(admin_email); }
      if (admin_password) {
        const h = await bcryptjs.hash(admin_password, 10);
        adminUpdates.push('password = ?'); adminVals.push(h);
      }
      if (adminUpdates.length) {
        adminVals.push(req.params.id);
        await db.query(
          `UPDATE users SET ${adminUpdates.join(', ')} WHERE school_id = ? AND role = 'school_admin'`,
          adminVals
        );
      }
    }

    const [[school]] = await db.query('SELECT * FROM schools WHERE id = ?', [req.params.id]);
    res.json(school);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/developer/schools/:id — permanently deletes the school and ALL its data
router.delete('/schools/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [[school]] = await db.query('SELECT id, name FROM schools WHERE id = ?', [id]);
    if (!school) return res.status(404).json({ error: 'School not found' });

    // Delete in dependency order (no FK constraints, but keep it clean)
    await db.query('DELETE FROM marks                   WHERE school_id = ?', [id]);
    await db.query('DELETE FROM attendance_students     WHERE school_id = ?', [id]);
    await db.query('DELETE FROM attendance_staff        WHERE school_id = ?', [id]);
    await db.query('DELETE FROM fee_payments            WHERE school_id = ?', [id]);
    await db.query('DELETE FROM payment_requests        WHERE school_id = ?', [id]);
    await db.query('DELETE FROM other_expenses          WHERE school_id = ?', [id]);
    await db.query('DELETE FROM leaves                  WHERE school_id = ?', [id]);
    await db.query('DELETE FROM schedules               WHERE school_id = ?', [id]);
    await db.query('DELETE FROM class_teacher_assignments WHERE school_id = ?', [id]);
    await db.query('DELETE FROM exams                   WHERE school_id = ?', [id]);
    await db.query('DELETE FROM fees_structure          WHERE school_id = ?', [id]);
    await db.query('DELETE FROM school_payment_config   WHERE school_id = ?', [id]);
    await db.query('DELETE FROM holidays                WHERE school_id = ?', [id]);
    await db.query('DELETE FROM sections                WHERE school_id = ?', [id]);
    await db.query('DELETE FROM grades                  WHERE school_id = ?', [id]);
    await db.query('DELETE FROM subjects                WHERE school_id = ?', [id]);
    await db.query('DELETE FROM students                WHERE school_id = ?', [id]);
    await db.query('DELETE FROM staff                   WHERE school_id = ?', [id]);
    await db.query('DELETE FROM users                   WHERE school_id = ?', [id]);
    await db.query('DELETE FROM schools                 WHERE id = ?',        [id]);

    res.json({ message: `School "${school.name}" and all its data have been permanently deleted.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/developer/schools/:id/analytics
router.get('/schools/:id/analytics', async (req, res) => {
  try {
    const [[school]] = await db.query('SELECT * FROM schools WHERE id = ?', [req.params.id]);
    if (!school) return res.status(404).json({ error: 'School not found' });

    const sid = req.params.id;
    const [students]  = await db.query('SELECT * FROM students WHERE school_id = ?', [sid]);
    const [staffList] = await db.query('SELECT * FROM staff WHERE school_id = ?', [sid]);
    const [grades]    = await db.query('SELECT * FROM grades WHERE school_id = ?', [sid]);
    const [payments]  = await db.query('SELECT * FROM fee_payments WHERE school_id = ?', [sid]);
    const [attendance]= await db.query('SELECT * FROM attendance_students WHERE school_id = ?', [sid]);

    const gradeDistribution = grades.map(g => ({
      grade: g.name,
      count: students.filter(s => s.grade_id === g.id).length,
    })).filter(g => g.count > 0);

    const paidFees  = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
    const present   = attendance.filter(a => a.status === 'present').length;
    const avgAtt    = attendance.length > 0 ? ((present / attendance.length) * 100).toFixed(1) : 0;

    res.json({
      school,
      student_count:        students.length,
      staff_count:          staffList.length,
      grade_count:          grades.length,
      total_fees_collected: paidFees,
      paid_fees:            paidFees,
      platform_revenue:     students.length * Number(school.rate_per_student),
      avg_attendance:       avgAtt,
      grade_distribution:   gradeDistribution,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
