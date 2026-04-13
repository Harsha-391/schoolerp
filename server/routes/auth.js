import { Router } from 'express';
import bcryptjs from 'bcryptjs';
import db from '../config/db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/auth/school/:subdomain — public, no auth required
// Used by the frontend to resolve a subdomain → school info for login page branding
router.get('/school/:subdomain', (req, res) => {
  const school = db.schools.find(s => s.subdomain === req.params.subdomain && s.is_active);
  if (!school) return res.status(404).json({ error: 'School not found' });
  res.json({
    id: school.id,
    name: school.name,
    subdomain: school.subdomain,
    logo: school.logo,
    city: school.city,
    state: school.state,
  });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    // Get school info if applicable
    let school = null;
    if (user.school_id) {
      school = db.schools.find(s => s.id === user.school_id);
    }

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        school_id: user.school_id,
        staff_id: user.staff_id || null,
        student_id: user.student_id || null,
        avatar: user.avatar,
        phone: user.phone,
      },
      school: school ? {
        id: school.id,
        name: school.name,
        subdomain: school.subdomain,
        logo: school.logo,
      } : null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let school = null;
  if (user.school_id) {
    school = db.schools.find(s => s.id === user.school_id);
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      school_id: user.school_id,
      staff_id: user.staff_id || null,
      student_id: user.student_id || null,
      avatar: user.avatar,
      phone: user.phone,
    },
    school: school ? {
      id: school.id,
      name: school.name,
      subdomain: school.subdomain,
      logo: school.logo,
    } : null,
  });
});

export default router;
