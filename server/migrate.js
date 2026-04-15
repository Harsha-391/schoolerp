/**
 * migrate.js — run once to create all tables and seed demo data.
 * Safe to re-run: CREATE TABLE IF NOT EXISTS + INSERT IGNORE.
 *
 *   cd server && node migrate.js
 */

import pool from './config/mysql.js';
import bcryptjs from 'bcryptjs';

// ─── Fixed seed IDs (INSERT IGNORE makes re-runs idempotent) ─────────────────
const ID = {
  // Users
  U_DEV:       'seed-usr-dev001',
  U_ADM_DPS:   'seed-usr-adm001',
  U_ADM_XAV:   'seed-usr-adm002',
  // Schools
  S_DPS:       'seed-scl-dps001',
  S_XAV:       'seed-scl-xav001',
  // Staff (DPS) — staff record + user record
  ST: i => `seed-stf-${String(i).padStart(5,'0')}`,
  US: i => `seed-ust-${String(i).padStart(5,'0')}`,
  // Grades — per school, by index (0=Nursery … 12=10th … 14=12th)
  GD: (school, i) => `seed-grd-${school}-${String(i).padStart(2,'0')}`,
  // Sections — per school, grade index, letter
  SC: (school, gi, l) => `seed-sec-${school}-${String(gi).padStart(2,'0')}${l}`,
  // Subjects — per school, by index
  SB: (school, i) => `seed-sub-${school}-${String(i).padStart(3,'0')}`,
  // Students + their user accounts
  STU: i => `seed-stu-${String(i).padStart(6,'0')}`,
  USTU: i => `seed-ustu-${String(i).padStart(5,'0')}`,
  // Payment configs
  PC_DPS_UPI:  'seed-pc-dpsupi',
  PC_DPS_BANK: 'seed-pc-dpsbk',
  PC_DPS_CASH: 'seed-pc-dpsca',
  PC_DPS_CHEQ: 'seed-pc-dpsch',
  PC_XAV_UPI:  'seed-pc-xavup',
  PC_XAV_BANK: 'seed-pc-xavbk',
  // Fee structures
  FS_TUIT:     'seed-fs-tuit01',
  FS_TRNP:     'seed-fs-trnp01',
  FS_LAB:      'seed-fs-lab001',
  FS_ANN:      'seed-fs-ann001',
  // Exams
  EX1:         'seed-exam-mid01',
  EX2:         'seed-exam-fin01',
  // Class teacher assignment
  CTA:         'seed-cta-00001',
};

const GRADE_NAMES = ['Nursery','LKG','UKG','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
const SUBJECT_NAMES = ['Mathematics','English','Hindi','Science','Social Studies','Computer Science','Physical Education','Art'];
const STAFF_SEED = [
  { name:'Anita Sharma',  designation:'Teacher',      department:'Mathematics', salary:45000, phone:'9800000001', email:'anita@dps.edu' },
  { name:'Vikram Singh',  designation:'Teacher',      department:'Science',     salary:42000, phone:'9800000002', email:'vikram@dps.edu' },
  { name:'Priya Patel',   designation:'Teacher',      department:'English',     salary:40000, phone:'9800000003', email:'priya@dps.edu' },
  { name:'Suresh Gupta',  designation:'Vice Principal',department:'Administration',salary:65000,phone:'9800000004',email:'suresh@dps.edu'},
  { name:'Meena Rao',     designation:'Teacher',      department:'Hindi',       salary:38000, phone:'9800000005', email:'meena@dps.edu' },
  { name:'Karan Malhotra',designation:'Librarian',    department:'Library',     salary:30000, phone:'9800000006', email:'karan@dps.edu' },
];
const STUDENT_SEED = [
  { name:'Aarav Mehta',  father:'Sunil Mehta',  mother:'Sunita Mehta',  fp:'9700000001', mp:'9700000002' },
  { name:'Ishita Verma', father:'Ajay Verma',   mother:'Neha Verma',    fp:'9700000003', mp:'9700000004' },
  { name:'Rohan Kapoor', father:'Ravi Kapoor',  mother:'Shalini Kapoor',fp:'9700000005', mp:'9700000006' },
  { name:'Sanya Nair',   father:'Krishnan Nair',mother:'Latha Nair',    fp:'9700000007', mp:'9700000008' },
  { name:'Dev Aggarwal', father:'Manoj Aggarwal',mother:'Rekha Aggarwal',fp:'9700000009',mp:'9700000010' },
  { name:'Nisha Reddy',  father:'Venkat Reddy', mother:'Lakshmi Reddy', fp:'9700000011', mp:'9700000012' },
  { name:'Arjun Desai',  father:'Himanshu Desai',mother:'Kavita Desai', fp:'9700000013', mp:'9700000014' },
  { name:'Pooja Joshi',  father:'Raghav Joshi', mother:'Anita Joshi',   fp:'9700000015', mp:'9700000016' },
];

// ─── Schema ───────────────────────────────────────────────────────────────────
async function createTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS schools (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      phone VARCHAR(20),
      email VARCHAR(100),
      logo VARCHAR(255),
      subdomain VARCHAR(50) UNIQUE NOT NULL,
      rate_per_student DECIMAL(10,2) DEFAULT 250,
      payment_methods JSON,
      razorpay_account_id VARCHAR(100),
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      role ENUM('developer','school_admin','staff','student') NOT NULL,
      school_id VARCHAR(36),
      staff_id VARCHAR(36),
      student_id VARCHAR(36),
      avatar VARCHAR(255),
      phone VARCHAR(20),
      mobile_number VARCHAR(15) UNIQUE,
      is_password_changed TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS students (
      id VARCHAR(36) PRIMARY KEY,
      school_id VARCHAR(36) NOT NULL,
      name VARCHAR(100) NOT NULL,
      roll_number VARCHAR(50),
      grade_id VARCHAR(36),
      section_id VARCHAR(36),
      father_name VARCHAR(100),
      mother_name VARCHAR(100),
      father_phone VARCHAR(20),
      mother_phone VARCHAR(20),
      address TEXT,
      dob DATE,
      gender VARCHAR(20),
      blood_group VARCHAR(10),
      admission_date DATE,
      avatar VARCHAR(255),
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS staff (
      id VARCHAR(36) PRIMARY KEY,
      school_id VARCHAR(36) NOT NULL,
      name VARCHAR(100) NOT NULL,
      designation VARCHAR(100),
      department VARCHAR(100),
      salary DECIMAL(10,2),
      phone VARCHAR(20),
      email VARCHAR(100),
      avatar VARCHAR(255),
      joining_date DATE,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS grades (
      id VARCHAR(36) PRIMARY KEY,
      school_id VARCHAR(36) NOT NULL,
      name VARCHAR(50) NOT NULL,
      \`order\` INT DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS sections (
      id VARCHAR(36) PRIMARY KEY,
      grade_id VARCHAR(36) NOT NULL,
      school_id VARCHAR(36) NOT NULL,
      name VARCHAR(10) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS subjects (
      id VARCHAR(36) PRIMARY KEY,
      school_id VARCHAR(36) NOT NULL,
      name VARCHAR(100) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS attendance_students (
      id VARCHAR(36) PRIMARY KEY,
      student_id VARCHAR(36) NOT NULL,
      school_id VARCHAR(36) NOT NULL,
      date DATE NOT NULL,
      status ENUM('present','absent','late') DEFAULT 'present',
      marked_by VARCHAR(36),
      UNIQUE KEY uniq_stu_date (student_id, date)
    )`,
    `CREATE TABLE IF NOT EXISTS attendance_staff (
      id VARCHAR(36) PRIMARY KEY,
      staff_id VARCHAR(36) NOT NULL,
      school_id VARCHAR(36) NOT NULL,
      date DATE NOT NULL,
      status ENUM('present','absent') DEFAULT 'present',
      check_in VARCHAR(10),
      check_out VARCHAR(10),
      UNIQUE KEY uniq_stf_date (staff_id, date)
    )`,
    `CREATE TABLE IF NOT EXISTS fees_structure (
      id VARCHAR(36) PRIMARY KEY,
      school_id VARCHAR(36) NOT NULL,
      grade_id VARCHAR(36),
      name VARCHAR(100) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      frequency ENUM('monthly','quarterly','annual') DEFAULT 'monthly',
      due_day INT DEFAULT 10
    )`,
    `CREATE TABLE IF NOT EXISTS fee_payments (
      id VARCHAR(36) PRIMARY KEY,
      student_id VARCHAR(36) NOT NULL,
      school_id VARCHAR(36) NOT NULL,
      fee_structure_id VARCHAR(36),
      amount DECIMAL(10,2) NOT NULL,
      payment_date DATE,
      payment_method VARCHAR(50),
      status VARCHAR(20) DEFAULT 'paid',
      receipt_no VARCHAR(100),
      month VARCHAR(7),
      transaction_id VARCHAR(100),
      payment_request_id VARCHAR(36)
    )`,
    `CREATE TABLE IF NOT EXISTS exams (
      id VARCHAR(36) PRIMARY KEY,
      school_id VARCHAR(36) NOT NULL,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(50),
      start_date DATE,
      end_date DATE,
      grade_id VARCHAR(36)
    )`,
    `CREATE TABLE IF NOT EXISTS marks (
      id VARCHAR(36) PRIMARY KEY,
      student_id VARCHAR(36) NOT NULL,
      school_id VARCHAR(36) NOT NULL,
      exam_id VARCHAR(36),
      subject_id VARCHAR(36),
      obtained_marks DECIMAL(6,2),
      total_marks DECIMAL(6,2),
      grade VARCHAR(5)
    )`,
    `CREATE TABLE IF NOT EXISTS leaves (
      id VARCHAR(36) PRIMARY KEY,
      staff_id VARCHAR(36) NOT NULL,
      school_id VARCHAR(36) NOT NULL,
      type VARCHAR(50),
      start_date DATE,
      end_date DATE,
      reason TEXT,
      status ENUM('pending','approved','rejected') DEFAULT 'pending',
      applied_on DATE
    )`,
    `CREATE TABLE IF NOT EXISTS holidays (
      id VARCHAR(36) PRIMARY KEY,
      school_id VARCHAR(36) NOT NULL,
      name VARCHAR(100) NOT NULL,
      date DATE NOT NULL,
      type VARCHAR(50)
    )`,
    `CREATE TABLE IF NOT EXISTS schedules (
      id VARCHAR(36) PRIMARY KEY,
      school_id VARCHAR(36) NOT NULL,
      grade_id VARCHAR(36),
      section_id VARCHAR(36),
      subject_id VARCHAR(36),
      staff_id VARCHAR(36),
      day VARCHAR(20),
      period INT,
      start_time VARCHAR(10),
      end_time VARCHAR(10)
    )`,
    `CREATE TABLE IF NOT EXISTS class_teacher_assignments (
      id VARCHAR(36) PRIMARY KEY,
      staff_id VARCHAR(36) NOT NULL,
      grade_id VARCHAR(36) NOT NULL,
      section_id VARCHAR(36) NOT NULL,
      school_id VARCHAR(36) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS school_payment_config (
      id VARCHAR(36) PRIMARY KEY,
      school_id VARCHAR(36) NOT NULL,
      method_type VARCHAR(50) NOT NULL,
      label VARCHAR(100),
      upi_id VARCHAR(100),
      account_holder VARCHAR(100),
      bank_name VARCHAR(100),
      account_number VARCHAR(50),
      ifsc_code VARCHAR(20),
      branch VARCHAR(100),
      instructions TEXT,
      cheque_payable_to VARCHAR(100),
      qr_image TEXT,
      is_primary TINYINT(1) DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS payment_requests (
      id VARCHAR(36) PRIMARY KEY,
      student_id VARCHAR(36),
      school_id VARCHAR(36),
      fee_structure_id VARCHAR(36),
      payment_config_id VARCHAR(36),
      amount DECIMAL(10,2),
      transaction_id VARCHAR(100),
      payment_proof_note TEXT,
      payment_method_type VARCHAR(50),
      payment_method_label VARCHAR(100),
      fee_name VARCHAR(100),
      student_name VARCHAR(100),
      student_roll VARCHAR(50),
      status ENUM('pending','approved','rejected') DEFAULT 'pending',
      submitted_at DATETIME,
      reviewed_at DATETIME,
      reviewed_by VARCHAR(100),
      reject_reason TEXT,
      receipt_no VARCHAR(100)
    )`,
    `CREATE TABLE IF NOT EXISTS other_expenses (
      id VARCHAR(36) PRIMARY KEY,
      school_id VARCHAR(36) NOT NULL,
      category VARCHAR(50),
      description VARCHAR(200),
      amount DECIMAL(10,2),
      date DATE,
      month VARCHAR(7),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  for (const sql of tables) {
    await pool.query(sql);
  }

  // ALTER existing tables if columns are missing (safe for re-runs)
  const alters = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(15) UNIQUE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_password_changed TINYINT(1) DEFAULT 1",
    "ALTER TABLE staff MODIFY COLUMN avatar MEDIUMTEXT",
    "ALTER TABLE students MODIFY COLUMN avatar MEDIUMTEXT",
  ];
  for (const sql of alters) {
    try { await pool.query(sql); } catch (_) { /* column already exists or no-op */ }
  }

  console.log('✅ All tables created');
}

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function seedData() {
  const devHash   = await bcryptjs.hash('jabbamaster397', 10);
  const adminHash = await bcryptjs.hash('school123', 10);
  const staffHash = await bcryptjs.hash('123456', 10);
  const stuHash   = await bcryptjs.hash('123456', 10);

  const now = new Date();
  const yr  = now.getFullYear();
  const mo  = now.getMonth() + 1; // 1-indexed

  // ── Users & Schools ───────────────────────────────────────────────────────
  await pool.query(
    'INSERT IGNORE INTO users (id,email,password,name,role,school_id,phone,is_password_changed,created_at) VALUES (?,?,?,?,?,?,?,1,NOW())',
    [ID.U_DEV, 'jabbamaster00@gmail.com', devHash, 'Dev Admin', 'developer', null, '9999999999']
  );
  // Always keep dev credentials current (handles re-runs on existing DB)
  await pool.query(
    'UPDATE users SET email=?, password=?, is_password_changed=1 WHERE id=?',
    ['jabbamaster00@gmail.com', devHash, ID.U_DEV]
  );

  await pool.query(
    `INSERT IGNORE INTO schools (id,name,address,city,state,phone,email,subdomain,rate_per_student,payment_methods,is_active,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,1,NOW())`,
    [ID.S_DPS,'Delhi Public School','123 Main Road, New Delhi','New Delhi','Delhi','011-1234567','admin@dps.edu','dps',250,JSON.stringify(['upi','bank_transfer','cash','cheque'])]
  );
  await pool.query(
    `INSERT IGNORE INTO schools (id,name,address,city,state,phone,email,subdomain,rate_per_student,payment_methods,is_active,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,1,NOW())`,
    [ID.S_XAV,"St. Xavier's Academy",'456 Park Street, Mumbai','Mumbai','Maharashtra','022-7654321','admin@xavier.edu','xavier',300,JSON.stringify(['upi','bank_transfer','cash'])]
  );

  await pool.query(
    'INSERT IGNORE INTO users (id,email,password,name,role,school_id,phone,is_password_changed,created_at) VALUES (?,?,?,?,?,?,?,1,NOW())',
    [ID.U_ADM_DPS,'admin@dps.edu',adminHash,'Rajesh Kumar','school_admin',ID.S_DPS,'9876543210']
  );
  await pool.query(
    'INSERT IGNORE INTO users (id,email,password,name,role,school_id,phone,is_password_changed,created_at) VALUES (?,?,?,?,?,?,?,1,NOW())',
    [ID.U_ADM_XAV,'admin@xavier.edu',adminHash,"Mary Thomas",'school_admin',ID.S_XAV,'9876543211']
  );

  // ── Grades & Sections ─────────────────────────────────────────────────────
  for (const school of ['dps','xav']) {
    const schoolId = school === 'dps' ? ID.S_DPS : ID.S_XAV;
    const sections = school === 'dps' ? ['A','B'] : ['A','B','C'];
    for (let i = 0; i < GRADE_NAMES.length; i++) {
      const gId = ID.GD(school, i);
      await pool.query(
        'INSERT IGNORE INTO grades (id,school_id,name,`order`) VALUES (?,?,?,?)',
        [gId, schoolId, GRADE_NAMES[i], i]
      );
      for (const sec of sections) {
        await pool.query(
          'INSERT IGNORE INTO sections (id,grade_id,school_id,name) VALUES (?,?,?,?)',
          [ID.SC(school,i,sec), gId, schoolId, sec]
        );
      }
    }
  }

  // ── Subjects ──────────────────────────────────────────────────────────────
  for (const school of ['dps','xav']) {
    const schoolId = school === 'dps' ? ID.S_DPS : ID.S_XAV;
    for (let i = 0; i < SUBJECT_NAMES.length; i++) {
      await pool.query(
        'INSERT IGNORE INTO subjects (id,school_id,name) VALUES (?,?,?)',
        [ID.SB(school,i), schoolId, SUBJECT_NAMES[i]]
      );
    }
  }

  // ── Staff (DPS) ───────────────────────────────────────────────────────────
  for (let i = 0; i < STAFF_SEED.length; i++) {
    const s = STAFF_SEED[i];
    await pool.query(
      `INSERT IGNORE INTO staff (id,school_id,name,designation,department,salary,phone,email,joining_date,is_active)
       VALUES (?,?,?,?,?,?,?,?,?,1)`,
      [ID.ST(i), ID.S_DPS, s.name, s.designation, s.department, s.salary, s.phone, s.email, '2023-04-01']
    );
    await pool.query(
      'INSERT IGNORE INTO users (id,email,password,name,role,school_id,staff_id,phone,mobile_number,is_password_changed,created_at) VALUES (?,?,?,?,?,?,?,?,?,0,NOW())',
      [ID.US(i), s.email, staffHash, s.name, 'staff', ID.S_DPS, ID.ST(i), s.phone, s.phone]
    );
  }

  // ── Class teacher assignment: Anita → 10th-A ─────────────────────────────
  await pool.query(
    'INSERT IGNORE INTO class_teacher_assignments (id,staff_id,grade_id,section_id,school_id) VALUES (?,?,?,?,?)',
    [ID.CTA, ID.ST(0), ID.GD('dps',12), ID.SC('dps',12,'A'), ID.S_DPS]
  );

  // ── Students (DPS, 10th-A) ────────────────────────────────────────────────
  const bloodGroups = ['A+','B+','O+','AB+'];
  for (let i = 0; i < STUDENT_SEED.length; i++) {
    const s = STUDENT_SEED[i];
    const rollNo = `DPS-2024-${String(i+1).padStart(4,'0')}`;
    await pool.query(
      `INSERT IGNORE INTO students
       (id,school_id,name,roll_number,grade_id,section_id,father_name,mother_name,
        father_phone,mother_phone,address,dob,gender,blood_group,admission_date,is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`,
      [ID.STU(i), ID.S_DPS, s.name, rollNo,
       ID.GD('dps',12), ID.SC('dps',12,'A'),
       s.father, s.mother, s.fp, s.mp,
       'New Delhi, India',
       `200${8+(i%3)}-${String((i%9)+1).padStart(2,'0')}-${String(10+i).padStart(2,'0')}`,
       i%2===0?'Male':'Female', bloodGroups[i%4], '2023-04-01']
    );
    await pool.query(
      'INSERT IGNORE INTO users (id,email,password,name,role,school_id,student_id,phone,mobile_number,is_password_changed,created_at) VALUES (?,?,?,?,?,?,?,?,?,0,NOW())',
      [ID.USTU(i), `student${i+1}@dps.edu`, stuHash, s.name, 'student', ID.S_DPS, ID.STU(i), s.fp, s.fp]
    );
  }

  // ── Payment configs ───────────────────────────────────────────────────────
  const pcRows = [
    [ID.PC_DPS_UPI, ID.S_DPS,'upi','School UPI (GPay/PhonePe)',1,'dpschool@sbi','Delhi Public School Trust',null,null,null,null,null,null,null],
    [ID.PC_DPS_BANK,ID.S_DPS,'bank_transfer','School Bank Account',0,null,'Delhi Public School Trust','State Bank of India','30912345678','SBIN0001234','Connaught Place',null,null,null],
    [ID.PC_DPS_CASH,ID.S_DPS,'cash','Cash Payment at Office',0,null,null,null,null,null,null,'Visit school accounts office (Room 102) between 9 AM - 2 PM on weekdays.',null,null],
    [ID.PC_DPS_CHEQ,ID.S_DPS,'cheque','Cheque / Demand Draft',0,null,'Delhi Public School Trust',null,null,null,null,'Make cheque/DD payable to "Delhi Public School Trust".',null,'Delhi Public School Trust'],
    [ID.PC_XAV_UPI, ID.S_XAV,'upi','School UPI',1,'xaviers@icici',"St. Xavier's Educational Trust",null,null,null,null,null,null,null],
    [ID.PC_XAV_BANK,ID.S_XAV,'bank_transfer','Bank Transfer',0,null,"St. Xavier's Educational Trust",'ICICI Bank','1234567890123','ICIC0001234','Bandra West',null,null,null],
  ];
  for (const [id,schoolId,mtype,label,isPrimary,upiId,acHolder,bankName,acNum,ifsc,branch,instr,qr,cheqPayable] of pcRows) {
    await pool.query(
      `INSERT IGNORE INTO school_payment_config
       (id,school_id,method_type,label,is_primary,upi_id,account_holder,bank_name,account_number,ifsc_code,branch,instructions,qr_image,cheque_payable_to,is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`,
      [id,schoolId,mtype,label,isPrimary,upiId,acHolder,bankName,acNum,ifsc,branch,instr,qr,cheqPayable]
    );
  }

  // ── Fee structures ────────────────────────────────────────────────────────
  const grade10DPS = ID.GD('dps', 12);
  await pool.query('INSERT IGNORE INTO fees_structure (id,school_id,grade_id,name,amount,frequency,due_day) VALUES (?,?,?,?,?,?,?)',
    [ID.FS_TUIT, ID.S_DPS, grade10DPS, 'Tuition Fee',   5000, 'monthly',   10]);
  await pool.query('INSERT IGNORE INTO fees_structure (id,school_id,grade_id,name,amount,frequency,due_day) VALUES (?,?,?,?,?,?,?)',
    [ID.FS_TRNP, ID.S_DPS, grade10DPS, 'Transport Fee', 2000, 'monthly',   10]);
  await pool.query('INSERT IGNORE INTO fees_structure (id,school_id,grade_id,name,amount,frequency,due_day) VALUES (?,?,?,?,?,?,?)',
    [ID.FS_LAB,  ID.S_DPS, grade10DPS, 'Lab Fee',       3000, 'quarterly', 10]);
  await pool.query('INSERT IGNORE INTO fees_structure (id,school_id,grade_id,name,amount,frequency,due_day) VALUES (?,?,?,?,?,?,?)',
    [ID.FS_ANN,  ID.S_DPS, grade10DPS, 'Annual Fee',   15000, 'annual',    15]);

  // ── Fee payments (current year) ────────────────────────────────────────────
  const payMethods = ['online','cash','cheque','upi'];
  const paidMonths = Math.min(mo - 1, 6);

  for (let m = 1; m <= paidMonths; m++) {
    const mm = String(m).padStart(2,'0');
    const monthKey = `${yr}-${mm}`;
    for (let si = 0; si < STUDENT_SEED.length; si++) {
      if (si === STUDENT_SEED.length - 1 && m === paidMonths) continue; // simulate 1 pending
      for (let fi = 0; fi < 2; fi++) { // monthly fees only
        const fid = fi === 0 ? ID.FS_TUIT : ID.FS_TRNP;
        const amt = fi === 0 ? 5000 : 2000;
        await pool.query(
          `INSERT IGNORE INTO fee_payments (id,student_id,school_id,fee_structure_id,amount,payment_date,payment_method,status,receipt_no,month)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [`seed-fp-m${yr}${mm}-s${si}-f${fi}`, ID.STU(si), ID.S_DPS, fid, amt,
           `${yr}-${mm}-${String(10+si).padStart(2,'0')}`,
           payMethods[(si+fi)%payMethods.length], 'paid',
           `REC-${yr}${mm}-${si}-${fi}`, monthKey]
        );
      }
    }
  }
  // Quarterly lab fee — Q1 (Jan) if past Jan
  if (mo > 1) {
    const mm = `${yr}-01`;
    for (let si = 0; si < STUDENT_SEED.length; si++) {
      await pool.query(
        `INSERT IGNORE INTO fee_payments (id,student_id,school_id,fee_structure_id,amount,payment_date,payment_method,status,receipt_no,month)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [`seed-fp-lab-${yr}01-s${si}`, ID.STU(si), ID.S_DPS, ID.FS_LAB, 3000,
         `${yr}-01-20`, payMethods[si%payMethods.length], 'paid', `REC-${yr}01-LAB-${si}`, mm]
      );
    }
  }
  // Annual fee — Jan
  if (mo > 1) {
    for (let si = 0; si < STUDENT_SEED.length; si++) {
      await pool.query(
        `INSERT IGNORE INTO fee_payments (id,student_id,school_id,fee_structure_id,amount,payment_date,payment_method,status,receipt_no,month)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [`seed-fp-ann-${yr}-s${si}`, ID.STU(si), ID.S_DPS, ID.FS_ANN, 15000,
         `${yr}-01-05`, payMethods[si%payMethods.length], 'paid', `REC-${yr}01-ANN-${si}`, `${yr}-01`]
      );
    }
  }

  // ── Exams & Marks ──────────────────────────────────────────────────────────
  await pool.query(
    'INSERT IGNORE INTO exams (id,school_id,name,type,start_date,end_date,grade_id) VALUES (?,?,?,?,?,?,?)',
    [ID.EX1, ID.S_DPS, 'Mid Term 2024', 'mid_term', '2024-09-15', '2024-09-25', grade10DPS]
  );
  await pool.query(
    'INSERT IGNORE INTO exams (id,school_id,name,type,start_date,end_date,grade_id) VALUES (?,?,?,?,?,?,?)',
    [ID.EX2, ID.S_DPS, 'Final Term 2024', 'final', '2025-02-15', '2025-02-28', grade10DPS]
  );

  const markSubjects = [0, 3, 1]; // Math, Science, English indices
  for (let si = 0; si < STUDENT_SEED.length; si++) {
    for (let j = 0; j < markSubjects.length; j++) {
      const obtained = 60 + Math.floor((si * 7 + j * 13) % 35);
      const pct = obtained;
      let grade = 'D';
      if (pct >= 90) grade = 'A+';
      else if (pct >= 80) grade = 'A';
      else if (pct >= 70) grade = 'B+';
      else if (pct >= 60) grade = 'B';
      else if (pct >= 50) grade = 'C';
      await pool.query(
        `INSERT IGNORE INTO marks (id,student_id,school_id,exam_id,subject_id,obtained_marks,total_marks,grade)
         VALUES (?,?,?,?,?,?,?,?)`,
        [`seed-mrk-e1-s${si}-su${j}`, ID.STU(si), ID.S_DPS, ID.EX1,
         ID.SB('dps', markSubjects[j]), obtained, 100, grade]
      );
    }
  }

  // ── Attendance (days 1-20 of current month) ────────────────────────────────
  for (let d = 1; d <= 20; d++) {
    const date = new Date(yr, mo - 1, d);
    if (date.getDay() === 0) continue; // skip Sunday
    const dateStr = date.toISOString().split('T')[0];
    const mm = String(mo).padStart(2,'0');
    const dd = String(d).padStart(2,'0');

    for (let si = 0; si < STUDENT_SEED.length; si++) {
      const roll = (si + d) % 10;
      const status = roll < 8 ? 'present' : (roll < 9 ? 'late' : 'absent');
      await pool.query(
        `INSERT IGNORE INTO attendance_students (id,student_id,school_id,date,status,marked_by) VALUES (?,?,?,?,?,?)`,
        [`seed-ast-${mm}${dd}-s${si}`, ID.STU(si), ID.S_DPS, dateStr, status, ID.ST(0)]
      );
    }
    for (let si = 0; si < STAFF_SEED.length; si++) {
      const status = (si + d) % 10 < 9 ? 'present' : 'absent';
      await pool.query(
        `INSERT IGNORE INTO attendance_staff (id,staff_id,school_id,date,status,check_in,check_out) VALUES (?,?,?,?,?,?,?)`,
        [`seed-asf-${mm}${dd}-s${si}`, ID.ST(si), ID.S_DPS, dateStr, status, '08:30', '15:30']
      );
    }
  }

  // ── Holidays ──────────────────────────────────────────────────────────────
  const holidays = [
    ['seed-hol-001',ID.S_DPS,'Republic Day',    `${yr}-01-26`,'national'],
    ['seed-hol-002',ID.S_DPS,'Holi',            `${yr}-03-25`,'festival'],
    ['seed-hol-003',ID.S_DPS,'Independence Day',`${yr}-08-15`,'national'],
    ['seed-hol-004',ID.S_DPS,'Diwali',          `${yr}-11-01`,'festival'],
    ['seed-hol-005',ID.S_DPS,'Christmas',       `${yr}-12-25`,'festival'],
    ['seed-hol-006',ID.S_DPS,'Summer Vacation Start',`${yr}-05-15`,'vacation'],
    ['seed-hol-007',ID.S_DPS,'Summer Vacation End',  `${yr}-06-30`,'vacation'],
  ];
  for (const row of holidays) {
    await pool.query('INSERT IGNORE INTO holidays (id,school_id,name,date,type) VALUES (?,?,?,?,?)', row);
  }

  // ── Leaves ────────────────────────────────────────────────────────────────
  await pool.query(
    'INSERT IGNORE INTO leaves (id,staff_id,school_id,type,start_date,end_date,reason,status,applied_on) VALUES (?,?,?,?,?,?,?,?,?)',
    ['seed-lv-001',ID.ST(0),ID.S_DPS,'sick','2024-03-10','2024-03-11','Feeling unwell','approved','2024-03-09']
  );
  await pool.query(
    'INSERT IGNORE INTO leaves (id,staff_id,school_id,type,start_date,end_date,reason,status,applied_on) VALUES (?,?,?,?,?,?,?,?,?)',
    ['seed-lv-002',ID.ST(0),ID.S_DPS,'casual','2024-04-20','2024-04-20','Personal work','pending','2024-04-18']
  );

  // ── Schedules ─────────────────────────────────────────────────────────────
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const periods = [
    {p:1,s:'08:00',e:'08:45'},{p:2,s:'08:45',e:'09:30'},
    {p:3,s:'09:45',e:'10:30'},{p:4,s:'10:30',e:'11:15'},
    {p:5,s:'11:30',e:'12:15'},{p:6,s:'12:15',e:'13:00'},
    {p:7,s:'13:30',e:'14:15'},{p:8,s:'14:15',e:'15:00'},
  ];
  const schedSubjs = [0, 3, 1]; // Math, Science, English
  const teacherIdxs = [0, 1, 2, 3, 4, 0]; // staff indices cycling

  for (let di = 0; di < days.length; di++) {
    for (let pi = 0; pi < periods.length; pi++) {
      const per = periods[pi];
      await pool.query(
        `INSERT IGNORE INTO schedules (id,school_id,grade_id,section_id,subject_id,staff_id,day,period,start_time,end_time)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [`seed-sch-d${di}-p${per.p}`,
         ID.S_DPS, ID.GD('dps',12), ID.SC('dps',12,'A'),
         ID.SB('dps', schedSubjs[pi % schedSubjs.length]),
         ID.ST(teacherIdxs[pi % teacherIdxs.length]),
         days[di], per.p, per.s, per.e]
      );
    }
  }

  // ── Other expenses ────────────────────────────────────────────────────────
  const expTemplates = [
    {cat:'Utilities',   desc:'Electricity Bill',       amounts:[8200,7900,9100,8500,7600,8800]},
    {cat:'Utilities',   desc:'Internet & Telephone',   amounts:[3500,3500,3500,3500,3500,3500]},
    {cat:'Maintenance', desc:'Building Maintenance',   amounts:[5000,0,12000,4000,0,6000]},
    {cat:'Stationery',  desc:'Office & Lab Supplies',  amounts:[2200,1800,2500,1900,2100,2400]},
    {cat:'Transport',   desc:'School Bus Maintenance', amounts:[4500,3200,5800,4100,3700,4900]},
    {cat:'Other',       desc:'Miscellaneous',          amounts:[1200,900,1500,1100,800,1300]},
  ];
  for (let ti = 0; ti < expTemplates.length; ti++) {
    const tpl = expTemplates[ti];
    for (let mi = 0; mi < tpl.amounts.length; mi++) {
      const amt = tpl.amounts[mi];
      if (amt === 0) continue;
      const expMonth = mi + 1;
      if (expMonth >= mo) continue; // only past months
      const mm = String(expMonth).padStart(2,'0');
      await pool.query(
        `INSERT IGNORE INTO other_expenses (id,school_id,category,description,amount,date,month) VALUES (?,?,?,?,?,?,?)`,
        [`seed-oe-t${ti}-m${mi}`, ID.S_DPS, tpl.cat, tpl.desc, amt, `${yr}-${mm}-05`, `${yr}-${mm}`]
      );
    }
  }

  console.log('✅ Seed data inserted');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function migrate() {
  console.log('🔄 Starting migration…');
  try {
    await createTables();
    await seedData();
    console.log('\n🎉 Migration complete!');
    console.log('   Developer:    developer@erp.com  / admin123');
    console.log('   School Admin: admin@dps.edu       / school123');
    console.log('   Staff:        anita@dps.edu       / staff123');
    console.log('   Student:      student1@dps.edu    / student123');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
    process.exit();
  }
}

migrate();
