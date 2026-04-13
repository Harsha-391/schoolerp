import { Router } from 'express';
import bcryptjs from 'bcryptjs';
import db from '../config/db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/auth/school/:subdomain — public, for login page branding
router.get('/school/:subdomain', async (req, res) => {
  try {
    const [[school]] = await db.query(
      'SELECT id, name, subdomain, logo, city, state FROM schools WHERE subdomain = ? AND is_active = 1',
      [req.params.subdomain]
    );
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json(school);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
// Accepts: { identifier, password }
// identifier = email (developer/admin) OR mobile number (staff/student)
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    // Try by email first, then by mobile_number
    let [[user]] = await db.query('SELECT * FROM users WHERE email = ?', [identifier]);
    if (!user) {
      [[user]] = await db.query('SELECT * FROM users WHERE mobile_number = ?', [identifier]);
    }
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    // First-time login — require password change before issuing token
    if (!user.is_password_changed) {
      return res.json({
        requiresPasswordChange: true,
        userId: user.id,
        role:   user.role,
      });
    }

    const token = generateToken(user);

    let school = null;
    if (user.school_id) {
      const [[s]] = await db.query(
        'SELECT id, name, subdomain, logo FROM schools WHERE id = ?',
        [user.school_id]
      );
      school = s || null;
    }

    res.json({
      token,
      user: {
        id: user.id, email: user.email, name: user.name, role: user.role,
        school_id: user.school_id, staff_id: user.staff_id || null,
        student_id: user.student_id || null, avatar: user.avatar, phone: user.phone,
      },
      school,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/change-password
// Called when is_password_changed = 0 (first-time login)
// Body: { userId, newPassword }
router.post('/change-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'userId and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const [[user]] = await db.query(
      'SELECT id, is_password_changed FROM users WHERE id = ?',
      [userId]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.is_password_changed) {
      return res.status(403).json({
        error: 'Password has already been changed. Contact your administrator to reset it.',
      });
    }

    const hashed = await bcryptjs.hash(newPassword, 10);
    await db.query(
      'UPDATE users SET password = ?, is_password_changed = 1 WHERE id = ?',
      [hashed, userId]
    );

    res.json({ message: 'Password updated. You can now log in with your new password.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [[user]] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let school = null;
    if (user.school_id) {
      const [[s]] = await db.query(
        'SELECT id, name, subdomain, logo FROM schools WHERE id = ?',
        [user.school_id]
      );
      school = s || null;
    }

    res.json({
      user: {
        id: user.id, email: user.email, name: user.name, role: user.role,
        school_id: user.school_id, staff_id: user.staff_id || null,
        student_id: user.student_id || null, avatar: user.avatar, phone: user.phone,
      },
      school,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
