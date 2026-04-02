import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import developerRoutes from './routes/developer.js';
import adminRoutes from './routes/admin.js';
import staffRoutes from './routes/staff.js';
import studentRoutes from './routes/student.js';
import paymentRoutes from './routes/payments.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
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
