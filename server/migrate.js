import pool from './config/mysql.js';

async function migrate() {
  console.log('🔄 Starting Database Migration...');
  try {
    // 1. Schools
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schools (
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
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Users (Auth table)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role ENUM('developer', 'school_admin', 'staff', 'student') NOT NULL,
        school_id VARCHAR(36),
        staff_id VARCHAR(36),
        student_id VARCHAR(36),
        avatar VARCHAR(255),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Students
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
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
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Staff
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff (
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
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Base Tables Created Successfully!');
    console.log('⚠️ We still need to create grades, attendance, payments, and schedules tables, and migrate all API routes.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit();
  }
}

migrate();
