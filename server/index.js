import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import developerRoutes from './routes/developer.js';
import adminRoutes from './routes/admin.js';
import staffRoutes from './routes/staff.js';
import studentRoutes from './routes/student.js';
import paymentRoutes from './routes/payments.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Allow the base origin and any subdomain of it.
// e.g. CORS_ORIGIN=http://localhost:5173 → also allows http://dps.localhost:5173
const corsBase = process.env.CORS_ORIGIN || 'http://localhost:5173';
const corsBaseHost = corsBase.replace(/^https?:\/\//, ''); // strip protocol

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // non-browser / same-origin requests
    const originHost = origin.replace(/^https?:\/\//, '');
    if (originHost === corsBaseHost || originHost.endsWith('.' + corsBaseHost)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting on auth endpoints (20 requests per 15 minutes per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 School ERP Server running on http://localhost:${PORT}`);
  console.log(`\n📋 Login Credentials:`);
  console.log(`   Developer:     developer@erp.com / admin123`);
  console.log(`   School Admin:  admin@dps.edu / school123`);
  console.log(`   Staff:         anita@dps.edu / staff123`);
  console.log(`   Student:       student1@dps.edu / student123`);
  console.log(`\n📡 API Routes:`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/developer/*`);
  console.log(`   GET  /api/admin/*`);
  console.log(`   GET  /api/staff/*`);
  console.log(`   GET  /api/student/*`);
  console.log(`   POST /api/payments/*`);
});
