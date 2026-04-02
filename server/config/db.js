/**
 * In-Memory Database for School ERP Prototype
 * Uses JSON data structures instead of MySQL for easy prototyping
 * Can be swapped to real MySQL later using mysql2
 */

import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
const db = {
  schools: [],
  users: [],
  students: [],
  staff: [],
  grades: [],
  sections: [],
  subjects: [],
  attendance_students: [],
  attendance_staff: [],
  fees_structure: [],
  fee_payments: [],
  marks: [],
  exams: [],
  leaves: [],
  holidays: [],
  schedules: [],
  class_teacher_assignments: [],
  school_payment_config: [],  // Each school's bank/UPI/QR details
  payment_requests: [],       // Student payment submissions awaiting verification
};

// ============ SEED DATA ============

async function seedDatabase() {
  // Developer admin
  const devPasswordHash = await bcryptjs.hash('admin123', 10);
  db.users.push({
    id: uuidv4(),
    email: 'developer@erp.com',
    password: devPasswordHash,
    name: 'Dev Admin',
    role: 'developer',
    school_id: null,
    avatar: null,
    phone: '9999999999',
    created_at: new Date().toISOString(),
  });

  // Seed 2 schools
  const school1Id = uuidv4();
  const school2Id = uuidv4();

  db.schools.push(
    {
      id: school1Id,
      name: 'Delhi Public School',
      address: '123 Main Road, New Delhi',
      city: 'New Delhi',
      state: 'Delhi',
      phone: '011-1234567',
      email: 'admin@dps.edu',
      logo: null,
      subdomain: 'dps',
      rate_per_student: 250,
      payment_methods: ['upi', 'bank_transfer', 'cash', 'cheque'],
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: school2Id,
      name: 'St. Xavier\'s Academy',
      address: '456 Park Street, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      phone: '022-7654321',
      email: 'admin@xavier.edu',
      logo: null,
      subdomain: 'xavier',
      rate_per_student: 300,
      payment_methods: ['upi', 'bank_transfer', 'cash'],
      is_active: true,
      created_at: new Date().toISOString(),
    }
  );

  // School payment configurations (bank details, UPI, QR)
  db.school_payment_config.push(
    {
      id: uuidv4(),
      school_id: school1Id,
      method_type: 'upi',
      label: 'School UPI (GPay/PhonePe)',
      upi_id: 'dpschool@sbi',
      account_holder: 'Delhi Public School Trust',
      is_primary: true,
      is_active: true,
      qr_image: null,
    },
    {
      id: uuidv4(),
      school_id: school1Id,
      method_type: 'bank_transfer',
      label: 'School Bank Account (NEFT/RTGS)',
      bank_name: 'State Bank of India',
      account_number: '30912345678',
      ifsc_code: 'SBIN0001234',
      account_holder: 'Delhi Public School Trust',
      branch: 'Connaught Place, New Delhi',
      is_primary: false,
      is_active: true,
    },
    {
      id: uuidv4(),
      school_id: school1Id,
      method_type: 'cash',
      label: 'Cash Payment at Office',
      instructions: 'Visit the school accounts office (Room 102) between 9 AM - 2 PM on weekdays. Collect receipt immediately.',
      is_primary: false,
      is_active: true,
    },
    {
      id: uuidv4(),
      school_id: school1Id,
      method_type: 'cheque',
      label: 'Cheque / Demand Draft',
      instructions: 'Make cheque/DD payable to "Delhi Public School Trust". Drop at accounts office or hand to class teacher.',
      cheque_payable_to: 'Delhi Public School Trust',
      is_primary: false,
      is_active: true,
    },
    {
      id: uuidv4(),
      school_id: school2Id,
      method_type: 'upi',
      label: 'School UPI',
      upi_id: 'xaviers@icici',
      account_holder: 'St. Xavier\'s Educational Trust',
      is_primary: true,
      is_active: true,
      qr_image: null,
    },
    {
      id: uuidv4(),
      school_id: school2Id,
      method_type: 'bank_transfer',
      label: 'Bank Transfer',
      bank_name: 'ICICI Bank',
      account_number: '1234567890123',
      ifsc_code: 'ICIC0001234',
      account_holder: 'St. Xavier\'s Educational Trust',
      branch: 'Bandra West, Mumbai',
      is_primary: false,
      is_active: true,
    }
  );

  // School admins
  const adminHash = await bcryptjs.hash('school123', 10);
  const admin1Id = uuidv4();
  const admin2Id = uuidv4();

  db.users.push(
    {
      id: admin1Id,
      email: 'admin@dps.edu',
      password: adminHash,
      name: 'Rajesh Kumar',
      role: 'school_admin',
      school_id: school1Id,
      avatar: null,
      phone: '9876543210',
      created_at: new Date().toISOString(),
    },
    {
      id: admin2Id,
      email: 'admin@xavier.edu',
      password: adminHash,
      name: 'Mary Thomas',
      role: 'school_admin',
      school_id: school2Id,
      avatar: null,
      phone: '9876543211',
      created_at: new Date().toISOString(),
    }
  );

  // Grades for school 1
  const grades1 = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
  grades1.forEach((g, idx) => {
    const gId = uuidv4();
    db.grades.push({
      id: gId,
      school_id: school1Id,
      name: g,
      order: idx,
    });
    // Add sections
    ['A', 'B'].forEach(sec => {
      db.sections.push({
        id: uuidv4(),
        grade_id: gId,
        school_id: school1Id,
        name: sec,
      });
    });
  });

  // Grades for school 2
  grades1.forEach((g, idx) => {
    const gId = uuidv4();
    db.grades.push({
      id: gId,
      school_id: school2Id,
      name: g,
      order: idx,
    });
    ['A', 'B', 'C'].forEach(sec => {
      db.sections.push({
        id: uuidv4(),
        grade_id: gId,
        school_id: school2Id,
        name: sec,
      });
    });
  });

  // Subjects
  const subjectNames = ['Mathematics', 'English', 'Hindi', 'Science', 'Social Studies', 'Computer Science', 'Physical Education', 'Art'];
  subjectNames.forEach(s => {
    db.subjects.push({ id: uuidv4(), school_id: school1Id, name: s });
    db.subjects.push({ id: uuidv4(), school_id: school2Id, name: s });
  });

  // Staff for school 1
  const staffHash = await bcryptjs.hash('staff123', 10);
  const staffMembers = [
    { name: 'Anita Sharma', designation: 'Teacher', department: 'Mathematics', salary: 45000, phone: '9800000001', email: 'anita@dps.edu' },
    { name: 'Vikram Singh', designation: 'Teacher', department: 'Science', salary: 42000, phone: '9800000002', email: 'vikram@dps.edu' },
    { name: 'Priya Patel', designation: 'Teacher', department: 'English', salary: 40000, phone: '9800000003', email: 'priya@dps.edu' },
    { name: 'Suresh Gupta', designation: 'Vice Principal', department: 'Administration', salary: 65000, phone: '9800000004', email: 'suresh@dps.edu' },
    { name: 'Meena Rao', designation: 'Teacher', department: 'Hindi', salary: 38000, phone: '9800000005', email: 'meena@dps.edu' },
    { name: 'Karan Malhotra', designation: 'Librarian', department: 'Library', salary: 30000, phone: '9800000006', email: 'karan@dps.edu' },
  ];

  for (const s of staffMembers) {
    const staffId = uuidv4();
    db.staff.push({
      id: staffId,
      school_id: school1Id,
      name: s.name,
      designation: s.designation,
      department: s.department,
      salary: s.salary,
      phone: s.phone,
      email: s.email,
      avatar: null,
      joining_date: '2023-04-01',
      is_active: true,
    });
    db.users.push({
      id: uuidv4(),
      email: s.email,
      password: staffHash,
      name: s.name,
      role: 'staff',
      school_id: school1Id,
      staff_id: staffId,
      avatar: null,
      phone: s.phone,
      created_at: new Date().toISOString(),
    });
  }

  // Class teacher assignments
  const grade10 = db.grades.find(g => g.school_id === school1Id && g.name === '10th');
  const sectionA_10 = db.sections.find(s => s.grade_id === grade10?.id && s.name === 'A');
  const anita = db.staff.find(s => s.name === 'Anita Sharma');
  if (grade10 && sectionA_10 && anita) {
    db.class_teacher_assignments.push({
      id: uuidv4(),
      staff_id: anita.id,
      grade_id: grade10.id,
      section_id: sectionA_10.id,
      school_id: school1Id,
    });
  }

  // Students for school 1
  const studentHash = await bcryptjs.hash('student123', 10);
  const studentNames = [
    { name: 'Aarav Mehta', father: 'Sunil Mehta', mother: 'Sunita Mehta', fatherPhone: '9700000001', motherPhone: '9700000002' },
    { name: 'Ishita Verma', father: 'Ajay Verma', mother: 'Neha Verma', fatherPhone: '9700000003', motherPhone: '9700000004' },
    { name: 'Rohan Kapoor', father: 'Ravi Kapoor', mother: 'Shalini Kapoor', fatherPhone: '9700000005', motherPhone: '9700000006' },
    { name: 'Sanya Nair', father: 'Krishnan Nair', mother: 'Latha Nair', fatherPhone: '9700000007', motherPhone: '9700000008' },
    { name: 'Dev Aggarwal', father: 'Manoj Aggarwal', mother: 'Rekha Aggarwal', fatherPhone: '9700000009', motherPhone: '9700000010' },
    { name: 'Nisha Reddy', father: 'Venkat Reddy', mother: 'Lakshmi Reddy', fatherPhone: '9700000011', motherPhone: '9700000012' },
    { name: 'Arjun Desai', father: 'Himanshu Desai', mother: 'Kavita Desai', fatherPhone: '9700000013', motherPhone: '9700000014' },
    { name: 'Pooja Joshi', father: 'Raghav Joshi', mother: 'Anita Joshi', fatherPhone: '9700000015', motherPhone: '9700000016' },
  ];

  if (grade10 && sectionA_10) {
    for (let i = 0; i < studentNames.length; i++) {
      const s = studentNames[i];
      const studentId = uuidv4();
      const rollNo = `DPS-2024-${String(i + 1).padStart(4, '0')}`;
      db.students.push({
        id: studentId,
        school_id: school1Id,
        name: s.name,
        roll_number: rollNo,
        grade_id: grade10.id,
        section_id: sectionA_10.id,
        father_name: s.father,
        mother_name: s.mother,
        father_phone: s.fatherPhone,
        mother_phone: s.motherPhone,
        address: 'New Delhi, India',
        dob: `200${8 + (i % 3)}-0${(i % 9) + 1}-${10 + i}`,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        blood_group: ['A+', 'B+', 'O+', 'AB+'][i % 4],
        admission_date: '2023-04-01',
        avatar: null,
        is_active: true,
      });
      db.users.push({
        id: uuidv4(),
        email: `student${i + 1}@dps.edu`,
        password: studentHash,
        name: s.name,
        role: 'student',
        school_id: school1Id,
        student_id: studentId,
        avatar: null,
        phone: s.fatherPhone,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Fee structure
  if (grade10) {
    db.fees_structure.push(
      { id: uuidv4(), school_id: school1Id, grade_id: grade10.id, name: 'Tuition Fee', amount: 5000, frequency: 'monthly', due_day: 10 },
      { id: uuidv4(), school_id: school1Id, grade_id: grade10.id, name: 'Transport Fee', amount: 2000, frequency: 'monthly', due_day: 10 },
      { id: uuidv4(), school_id: school1Id, grade_id: grade10.id, name: 'Lab Fee', amount: 3000, frequency: 'quarterly', due_day: 10 },
      { id: uuidv4(), school_id: school1Id, grade_id: grade10.id, name: 'Annual Fee', amount: 15000, frequency: 'annual', due_day: 15 },
    );
  }

  // Fee payments for some students
  const students = db.students.filter(s => s.school_id === school1Id);
  const feeStructures = db.fees_structure.filter(f => f.school_id === school1Id);
  students.slice(0, 5).forEach((student, idx) => {
    feeStructures.slice(0, 2).forEach(fee => {
      db.fee_payments.push({
        id: uuidv4(),
        student_id: student.id,
        school_id: school1Id,
        fee_structure_id: fee.id,
        amount: fee.amount,
        payment_date: `2024-0${idx + 1}-15`,
        payment_method: ['online', 'cash', 'cheque'][idx % 3],
        status: 'paid',
        receipt_no: `REC-${Date.now()}-${idx}`,
        month: `2024-0${idx + 1}`,
      });
    });
  });

  // Exams
  const exam1Id = uuidv4();
  const exam2Id = uuidv4();
  db.exams.push(
    { id: exam1Id, school_id: school1Id, name: 'Mid Term 2024', type: 'mid_term', start_date: '2024-09-15', end_date: '2024-09-25', grade_id: grade10?.id },
    { id: exam2Id, school_id: school1Id, name: 'Final Term 2024', type: 'final', start_date: '2025-02-15', end_date: '2025-02-28', grade_id: grade10?.id },
  );

  // Marks
  const mathSubject = db.subjects.find(s => s.school_id === school1Id && s.name === 'Mathematics');
  const sciSubject = db.subjects.find(s => s.school_id === school1Id && s.name === 'Science');
  const engSubject = db.subjects.find(s => s.school_id === school1Id && s.name === 'English');

  students.forEach((student, idx) => {
    [mathSubject, sciSubject, engSubject].forEach(sub => {
      if (sub) {
        db.marks.push({
          id: uuidv4(),
          student_id: student.id,
          school_id: school1Id,
          exam_id: exam1Id,
          subject_id: sub.id,
          obtained_marks: 60 + Math.floor(Math.random() * 35),
          total_marks: 100,
          grade: '',
        });
      }
    });
  });

  // Calculate grades
  db.marks.forEach(m => {
    const pct = (m.obtained_marks / m.total_marks) * 100;
    if (pct >= 90) m.grade = 'A+';
    else if (pct >= 80) m.grade = 'A';
    else if (pct >= 70) m.grade = 'B+';
    else if (pct >= 60) m.grade = 'B';
    else if (pct >= 50) m.grade = 'C';
    else m.grade = 'D';
  });

  // Attendance
  const today = new Date();
  for (let d = 1; d <= 20; d++) {
    const date = new Date(today.getFullYear(), today.getMonth(), d);
    if (date.getDay() === 0) continue; // skip Sunday
    const dateStr = date.toISOString().split('T')[0];
    students.forEach(student => {
      db.attendance_students.push({
        id: uuidv4(),
        student_id: student.id,
        school_id: school1Id,
        date: dateStr,
        status: Math.random() > 0.15 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late'),
        marked_by: anita?.id || null,
      });
    });
    db.staff.filter(s => s.school_id === school1Id).forEach(staffMember => {
      db.attendance_staff.push({
        id: uuidv4(),
        staff_id: staffMember.id,
        school_id: school1Id,
        date: dateStr,
        status: Math.random() > 0.1 ? 'present' : 'absent',
        check_in: '08:30',
        check_out: '15:30',
      });
    });
  }

  // Holidays
  db.holidays.push(
    { id: uuidv4(), school_id: school1Id, name: 'Republic Day', date: '2024-01-26', type: 'national' },
    { id: uuidv4(), school_id: school1Id, name: 'Holi', date: '2024-03-25', type: 'festival' },
    { id: uuidv4(), school_id: school1Id, name: 'Independence Day', date: '2024-08-15', type: 'national' },
    { id: uuidv4(), school_id: school1Id, name: 'Diwali', date: '2024-11-01', type: 'festival' },
    { id: uuidv4(), school_id: school1Id, name: 'Christmas', date: '2024-12-25', type: 'festival' },
    { id: uuidv4(), school_id: school1Id, name: 'Summer Vacation Start', date: '2024-05-15', type: 'vacation' },
    { id: uuidv4(), school_id: school1Id, name: 'Summer Vacation End', date: '2024-06-30', type: 'vacation' },
  );

  // Leaves
  if (anita) {
    db.leaves.push(
      { id: uuidv4(), staff_id: anita.id, school_id: school1Id, type: 'sick', start_date: '2024-03-10', end_date: '2024-03-11', reason: 'Feeling unwell', status: 'approved', applied_on: '2024-03-09' },
      { id: uuidv4(), staff_id: anita.id, school_id: school1Id, type: 'casual', start_date: '2024-04-20', end_date: '2024-04-20', reason: 'Personal work', status: 'pending', applied_on: '2024-04-18' },
    );
  }

  // Schedules for school 1
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [
    { period: 1, start: '08:00', end: '08:45' },
    { period: 2, start: '08:45', end: '09:30' },
    { period: 3, start: '09:45', end: '10:30' },
    { period: 4, start: '10:30', end: '11:15' },
    { period: 5, start: '11:30', end: '12:15' },
    { period: 6, start: '12:15', end: '13:00' },
    { period: 7, start: '13:30', end: '14:15' },
    { period: 8, start: '14:15', end: '15:00' },
  ];

  if (grade10 && sectionA_10) {
    const scheduleSubjects = [mathSubject, sciSubject, engSubject].filter(Boolean);
    const staffList = db.staff.filter(s => s.school_id === school1Id && s.designation === 'Teacher');
    days.forEach(day => {
      periods.forEach((p, idx) => {
        const sub = scheduleSubjects[idx % scheduleSubjects.length];
        const teacher = staffList[idx % staffList.length];
        if (sub && teacher) {
          db.schedules.push({
            id: uuidv4(),
            school_id: school1Id,
            grade_id: grade10.id,
            section_id: sectionA_10.id,
            subject_id: sub.id,
            staff_id: teacher.id,
            day: day,
            period: p.period,
            start_time: p.start,
            end_time: p.end,
          });
        }
      });
    });
  }

  console.log('✅ Database seeded successfully');
  console.log(`   📚 ${db.schools.length} schools`);
  console.log(`   👤 ${db.users.length} users`);
  console.log(`   🎓 ${db.students.length} students`);
  console.log(`   👨‍🏫 ${db.staff.length} staff`);
  console.log(`   📊 ${db.grades.length} grades`);
  console.log(`   📝 ${db.marks.length} marks records`);
  console.log(`   ✅ ${db.attendance_students.length} attendance records`);
}

// Initialize
seedDatabase();

export default db;
