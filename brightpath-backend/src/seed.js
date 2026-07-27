const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const db = require('./config/db'); // Adjust relative path if necessary

async function seedDatabase() {
  console.log('🌱 Starting Database Seeding Process...');

  try {
    // 1. CLEAR EXISTING DATA IN CORRECT ORDER
    console.log('🧹 Truncating existing tables...');
    await db.query(`
      TRUNCATE TABLE 
        fee_call_notes,
        student_pending_fees,
        student_marks,
        assessments_exams,
        teacher_payments,
        fee_receipts, 
        attendance_logs, 
        demo_classes, 
        admissions, 
        enquiries, 
        students, 
        batches, 
        courses, 
        teachers 
      RESTART IDENTITY CASCADE;
    `);
    console.log('✅ Existing data cleared successfully.');

    // 2. SEED COURSES
    console.log('📚 Inserting Courses...');
    const coursesQuery = `
      INSERT INTO courses (
        course_code, course_name, category, level, subject, duration, 
        monthly_fee, quarterly_fee, semi_annual_fee, annual_fee, status, description
      ) VALUES 
      ('CRS-PCM12', 'Class 12th PCM Super 30', 'Classroom', 'Class 12', 'Physics, Chemistry, Maths', '1 Year', 4500, 12500, 23000, 42000, 'Active', 'Comprehensive board + entrance preparation for Class 12 Science'),
      ('CRS-NEET11', 'NEET Dropper / Target Batch', 'Medical', 'Target', 'Physics, Chemistry, Biology', '1 Year', 5500, 15500, 29000, 52000, 'Active', 'Intensive problem-solving and daily mock tests for NEET aspirants'),
      ('CRS-FOUND10', 'Class 10th Foundation Board Prep', 'Foundation', 'Class 10', 'Science, Maths, SST', '10 Months', 3500, 9500, 18000, 32000, 'Active', 'Strong foundation for CBSE/ICSE Class 10 Board exams'),
      ('CRS-BIO11', 'Class 11th Biology Target', 'Medical', 'Class 11', 'Biology', '1 Year', 4000, 11000, 20000, 38000, 'Active', 'Specialized NCERT & NEET Biology depth for Class 11')
      RETURNING id, course_name;
    `;
    const coursesRes = await db.query(coursesQuery);
    const courses = coursesRes.rows;

    // 3. SEED TEACHERS
    console.log('👨‍🏫 Inserting Teachers...');
    const teachersQuery = `
      INSERT INTO teachers (
        teacher_name, teacher_code, mobile, email, qualification, experience, subjects, payment_type, joining_date, status
      ) VALUES 
      ('Dr. Rajesh Verma', 'TCH-101', '9876543210', 'rajesh.verma@coaching.com', 'Ph.D in Physics (IIT Delhi)', 12, 'Physics', 'Monthly Salary', '2021-04-15', 'Active'),
      ('Ananya Sharma', 'TCH-102', '9876543211', 'ananya.s@coaching.com', 'M.Sc Organic Chemistry', 8, 'Chemistry', 'Hourly Basis', '2022-06-01', 'Active'),
      ('Vikramaditya Singh', 'TCH-103', '9876543212', 'vikram.maths@coaching.com', 'M.Tech (IIT Bombay)', 10, 'Mathematics', 'Monthly Salary', '2020-01-10', 'Active'),
      ('Dr. Sunita Rao', 'TCH-104', '9876543213', 'sunita.biology@coaching.com', 'M.D. / M.Sc Zoology', 15, 'Biology', 'Monthly Salary', '2019-08-20', 'Active')
      RETURNING id, teacher_name;
    `;
    const teachersRes = await db.query(teachersQuery);
    const teachers = teachersRes.rows;

    // 4. SEED BATCHES
    // Dr. Rajesh Verma  -> Morning Achievers PCM (Class 12th PCM)
    // Ananya Sharma     -> Alpha Medical NEET (NEET Dropper)
    // Vikramaditya Singh-> Class 10 Board Boosters (Class 10th Foundation)
    // Dr. Sunita Rao    -> Beta Medical Biology (Class 11th Biology Target)
    console.log('🏫 Inserting Batches...');
    const batchesQuery = `
      INSERT INTO batches (
        batch_code, batch_name, course_id, subject, teacher_id, classroom, 
        start_date, end_date, days, batch_type, start_time, end_time, max_students, current_students, status
      ) VALUES 
      ('BT-PCM12-A', 'Morning Achievers PCM', $1, 'Physics & Maths', $2, 'Room 101', '2026-04-01', '2027-03-31', 'Mon,Wed,Fri', 'Regular', '08:00', '10:30', 30, 2, 'Active'),
      ('BT-NEET-MED', 'Alpha Medical NEET', $3, 'Chemistry', $4, 'Room 203', '2026-05-10', '2027-04-30', 'Tue,Thu,Sat', 'Intensive', '10:30', '13:30', 40, 1, 'Active'),
      ('BT-FND10-EVE', 'Class 10 Board Boosters', $5, 'Science & Maths', $6, 'Room 102', '2026-04-15', '2027-02-28', 'Mon,Tue,Wed,Thu,Fri', 'Regular', '16:00', '18:00', 35, 2, 'Active'),
      ('BT-BIO11-EVE', 'Beta Medical Biology', $7, 'Biology', $8, 'Room 204', '2026-05-01', '2027-03-31', 'Mon,Wed,Fri', 'Regular', '14:00', '16:00', 30, 0, 'Active')
      RETURNING id, batch_name;
    `;
    const batchValues = [
      courses[0].id, teachers[0].id,  // Dr. Rajesh Verma
      courses[1].id, teachers[1].id,  // Ananya Sharma
      courses[2].id, teachers[2].id,  // Vikramaditya Singh
      courses[3].id, teachers[3].id   // Dr. Sunita Rao
    ];
    const batchesRes = await db.query(batchesQuery, batchValues);
    const batches = batchesRes.rows;

    // 5. SEED STUDENTS
    console.log('🎓 Inserting Students...');
    const studentsQuery = `
      INSERT INTO students (
        student_code, student_name, mobile, parent_name, parent_mobile, class_name, 
        course_id, batch_id, fee_type, fee_amount, admission_date, status, 
        fee_status, attendance, gender, dob, address, school_name
      ) VALUES 
      ('STU-2026-01', 'Aarav Mehta', '9988776655', 'Sanjay Mehta', '9988776600', 'Class 12', $1, $4, 'Quarterly', 12500, '2026-04-02', 'Active', 'Paid', 92.00, 'Male', '2008-05-14', 'B-12, Green Park, New Delhi', 'Delhi Public School'),
      ('STU-2026-02', 'Riya Sen', '9988776654', 'Amit Sen', '9988776601', 'Class 12', $1, $4, 'Monthly', 4500, '2026-04-05', 'Active', 'Paid', 88.00, 'Female', '2008-09-21', 'H-45, South Ext, New Delhi', 'Modern School Barakhamba'),
      ('STU-2026-03', 'Ishaan Agarwal', '9988776653', 'Pankaj Agarwal', '9988776602', 'Target NEET', $2, $5, 'Annual', 52000, '2026-05-12', 'Active', 'Pending', 95.00, 'Male', '2007-11-03', 'C-88, Rohini Sec-9, New Delhi', 'Kalka Public School'),
      ('STU-2026-04', 'Ananya Gupta', '9988776652', 'Rajesh Gupta', '9988776603', 'Class 10', $3, $6, 'Quarterly', 9500, '2026-04-18', 'Active', 'Paid', 90.00, 'Female', '2010-02-18', 'Plot 14, Dwarka Sec-12, New Delhi', 'Springdales School'),
      ('STU-2026-05', 'Siddharth Malhotra', '9811223366', 'Rakesh Malhotra', '9811223360', 'Class 10', $3, $6, 'Quarterly', 9500, '2026-07-10', 'Active', 'Paid', 94.00, 'Male', '2010-06-12', 'E-22, Lajpat Nagar, New Delhi', 'Apeejay School')
      RETURNING id, student_code, student_name;
    `;
    const studentValues = [
      courses[0].id, courses[1].id, courses[2].id,
      batches[0].id, batches[1].id, batches[2].id
    ];
    const studentsRes = await db.query(studentsQuery, studentValues);
    const students = studentsRes.rows;

    // 6. SEED ADMISSIONS
    console.log('📝 Inserting Admissions...');
    await db.query(`
      INSERT INTO admissions (
        receipt_code, student_name, mobile, parent_name, class_level, 
        course_id, batch_id, fee_type, fee_amount, admission_date, fee_status
      ) VALUES 
      ('ADM-24001', 'Aarav Mehta', '9988776655', 'Sanjay Mehta', 'Class 12', $1, $4, 'Quarterly', 12500, '2026-04-02', 'Paid'),
      ('ADM-24002', 'Riya Sen', '9988776654', 'Amit Sen', 'Class 12', $1, $4, 'Monthly', 4500, '2026-04-05', 'Paid'),
      ('DEMO-ADM-01', 'Ishaan Agarwal', '9988776653', 'Pankaj Agarwal', 'Target NEET', $2, $5, 'Annual', 52000, '2026-05-12', 'Pending'),
      ('ADM-24003', 'Ananya Gupta', '9988776652', 'Rajesh Gupta', 'Class 10', $3, $6, 'Quarterly', 9500, '2026-04-18', 'Paid'),
      ('ADM-24004', 'Siddharth Malhotra', '9811223366', 'Rakesh Malhotra', 'Class 10', $3, $6, 'Quarterly', 9500, '2026-07-10', 'Paid');
    `, [courses[0].id, courses[1].id, courses[2].id, batches[0].id, batches[1].id, batches[2].id]);

    // 7. SEED ENQUIRIES
    console.log('❓ Inserting Enquiries...');
    await db.query(`
      INSERT INTO enquiries (
        student_name, parent_name, mobile, class_level, course_interest, 
        source, preferred_timing, followup_date, counselor, status, remarks, created_at
      ) VALUES 
      ('Kavya Joshi', 'Sunil Joshi', '9811223344', 'Class 11', 'Class 11 Biology', 'Walk-in', 'Evening', '2026-07-28', 'Priya Sharma', 'Interested', 'Wants a free demo class with Dr. Sunita Rao', CURRENT_DATE),
      ('Rohan Kapoor', 'Vikas Kapoor', '9811223355', 'Class 12', 'NEET Dropper', 'Google Ads', 'Morning', '2026-07-26', 'Priya Sharma', 'Demo Scheduled', 'Attending Chemistry demo with Ananya Sharma', CURRENT_DATE - 2),
      ('Siddharth Malhotra', 'Rakesh Malhotra', '9811223366', 'Class 10', 'Class 10 Foundation', 'Friend Referral', 'Evening', '2026-07-20', 'Amit Kumar', 'Converted', 'Joined batch BT-FND10-EVE', CURRENT_DATE - 15);
    `);

    // 8. SEED DEMO CLASSES
    console.log('🎥 Inserting Demo Classes...');
    await db.query(`
      INSERT INTO demo_classes (
        student_name, course_name, batch_name, teacher_name, demo_date, demo_time, status, feedback
      ) VALUES 
      ('Kavya Joshi', 'Class 11th Biology Target', 'Beta Medical Biology', 'Dr. Sunita Rao', '2026-07-28', '02:00 PM', 'Scheduled', 'Demo session on Cell Division and Genetics'),
      ('Rohan Kapoor', 'NEET Dropper / Target Batch', 'Alpha Medical NEET', 'Ananya Sharma', '2026-07-26', '10:30 AM', 'Scheduled', 'Focus on Organic Chemistry concepts'),
      ('Aarav Mehta', 'Class 12th PCM Super 30', 'Morning Achievers PCM', 'Dr. Rajesh Verma', '2026-07-22', '08:00 AM', 'Completed', 'Very happy with Physics explanation.');
    `);

    // 9. SEED ATTENDANCE LOGS
    console.log('📋 Inserting Attendance Logs...');
    await db.query(`
      INSERT INTO attendance_logs (student_id, batch_name, attendance_date, status) VALUES 
      ($1, 'Morning Achievers PCM', '2026-07-24', 'Present'),
      ($2, 'Morning Achievers PCM', '2026-07-24', 'Present'),
      ($3, 'Alpha Medical NEET', '2026-07-24', 'Absent'),
      ($4, 'Class 10 Board Boosters', '2026-07-24', 'Present'),
      ($5, 'Class 10 Board Boosters', '2026-07-24', 'Present'),
      ($1, 'Morning Achievers PCM', '2026-07-25', 'Present'),
      ($2, 'Morning Achievers PCM', '2026-07-25', 'Late'),
      ($5, 'Class 10 Board Boosters', '2026-07-25', 'Present');
    `, [
      students[0].id.toString(),
      students[1].id.toString(),
      students[2].id.toString(),
      students[3].id.toString(),
      students[4].id.toString()
    ]);

    // 10. SEED FEE RECEIPTS
    console.log('💰 Inserting Fee Receipts...');
    await db.query(`
      INSERT INTO fee_receipts (
        id, student_id, student_name, batch_name, fee_type, period, 
        due_amount, discount, fine, paid_amount, payment_mode, 
        transaction_id, collected_by, payment_date, balance, remarks
      ) VALUES 
      ('RCP-24001', $1, 'Aarav Mehta', 'Morning Achievers PCM', 'Quarterly', 'Q1 (Apr-Jun)', 12500, 500, 0, 12000, 'UPI', 'TXN-99881122', 'Admin Desk', '2026-04-02', 0, 'Early bird discount applied'),
      ('RCP-24004', $2, 'Riya Sen', 'Morning Achievers PCM', 'Monthly', 'July 2026', 4500, 0, 0, 4500, 'UPI', 'TXN-776655', 'Admin Desk', '2026-07-04', 0, 'Paid for July'),
      ('RCP-24003', $3, 'Ananya Gupta', 'Class 10 Board Boosters', 'Quarterly', 'Q1 (Apr-Jun)', 9500, 0, 0, 9500, 'Net Banking', 'NET-882233', 'Priya Sharma', '2026-04-18', 0, 'Paid online'),
      ('RCP-24005', $4, 'Siddharth Malhotra', 'Class 10 Board Boosters', 'Quarterly', 'Q2 (Jul-Sep)', 9500, 0, 0, 9500, 'UPI', 'TXN-55443322', 'Amit Kumar', '2026-07-10', 0, 'Admission fee paid upon conversion');
    `, [
      students[0].id.toString(),
      students[1].id.toString(),
      students[3].id.toString(),
      students[4].id.toString()
    ]);

    // 11. SEED TEACHER PAYMENTS
    console.log('💵 Inserting Teacher Payments...');
    await db.query(`
      INSERT INTO teacher_payments (
        id, teacher_name, payment_month, pay_type, classes_assigned, classes_taken, classes_cancelled,
        student_count, batch_collection, gross_amount, deductions, advance_paid, net_payable,
        paid_amount, balance_due, status, payment_mode, transaction_id, payment_date, voucher_number, remarks
      ) VALUES 
      ('TCH-1001', 'Dr. Rajesh Verma', 'May 2026', 'Fixed Salary', 24, 24, 0, 30, 135000, 65000, 2000, 0, 63000, 63000, 0, 'Paid', 'Bank Transfer', 'TXN-PAY-001', '2026-06-01', 'VOUCH-501', 'Full salary disbursed'),
      ('TCH-1002', 'Ananya Sharma', 'May 2026', 'Hourly Basis', 20, 18, 2, 40, 220000, 36000, 0, 5000, 31000, 20000, 11000, 'Partial', 'UPI', 'TXN-PAY-002', '2026-06-02', 'VOUCH-502', 'Advance deducted, balance pending'),
      ('TCH-1003', 'Vikramaditya Singh', 'May 2026', 'Fixed Salary', 22, 20, 2, 35, 122500, 55000, 1000, 0, 54000, 0, 54000, 'Unpaid', NULL, NULL, NULL, 'VOUCH-503', 'Payment pending management clearance'),
      ('TCH-1004', 'Dr. Sunita Rao', 'May 2026', 'Fixed Salary', 20, 20, 0, 25, 100000, 60000, 1500, 0, 58500, 58500, 0, 'Paid', 'Bank Transfer', 'TXN-PAY-004', '2026-06-01', 'VOUCH-504', 'Full salary disbursed');
    `);

    // 12. SEED EXAMS
    console.log('📝 Inserting Exams...');
    await db.query(`
      INSERT INTO assessments_exams (
        id, test_name, course_name, batch_name, subject_name, teacher_name, 
        test_date, total_marks, passing_marks, status, syllabus
      ) VALUES 
      ('EX-2001', 'Weekly Test 1 - Electrostatics', 'Class 12th PCM Super 30', 'Morning Achievers PCM', 'Physics', 'Dr. Rajesh Verma', '2026-05-15', 50, 20, 'Completed', 'Electric Charges, Coulomb''s Law, Gauss Theorem'),
      ('EX-2002', 'NEET Mock Unit Test 2', 'NEET Dropper / Target Batch', 'Alpha Medical NEET', 'Chemistry', 'Ananya Sharma', '2026-06-10', 100, 40, 'Completed', 'Organic Chemistry & Hydrocarbons'),
      ('EX-2003', 'Mid-Term Board Mock Test', 'Class 10th Foundation Board Prep', 'Class 10 Board Boosters', 'Mathematics', 'Vikramaditya Singh', '2026-08-05', 80, 32, 'Scheduled', 'Quadratic Equations, Triangles, Trigonometry'),
      ('EX-2004', 'Cell Biology Unit Test', 'Class 11th Biology Target', 'Beta Medical Biology', 'Biology', 'Dr. Sunita Rao', '2026-06-20', 50, 20, 'Completed', 'Cell Structure, Biomolecules, Cell Cycle');
    `);

    // 13. SEED STUDENT MARKS
    console.log('📊 Inserting Student Marks...');
    await db.query(`
      INSERT INTO student_marks (
        exam_id, exam_name, batch_name, subject_name, student_id, student_name, 
        marks_obtained, total_marks, grade, remarks
      ) VALUES 
      ('EX-2001', 'Weekly Test 1 - Electrostatics', 'Morning Achievers PCM', 'Physics', 'STU-2026-01', 'Aarav Mehta', 45.0, 50.0, 'A+', 'Excellent conceptual understanding'),
      ('EX-2001', 'Weekly Test 1 - Electrostatics', 'Morning Achievers PCM', 'Physics', 'STU-2026-02', 'Riya Sen', 38.0, 50.0, 'B+', 'Good performance, work on numericals'),
      ('EX-2002', 'NEET Mock Unit Test 2', 'Alpha Medical NEET', 'Chemistry', 'STU-2026-03', 'Ishaan Agarwal', 92.0, 100.0, 'A+', 'Outstanding score, top of batch');
    `);



    console.log('🎉 Database Seeding Completed Successfully!');
  } catch (error) {
    console.error('❌ Error Seeding Database:', error);
  } finally {
    if (db.end) {
      await db.end();
    }
    process.exit();
  }
}

seedDatabase();