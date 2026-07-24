const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const db = require("./config/db");

const seedAll = async () => {
  try {
    console.log("Cleaning existing database records...");
    // Truncate dependent tables and reset sequence IDs
    await db.query(`TRUNCATE TABLE admissions, students, batches, courses RESTART IDENTITY CASCADE;`);

    console.log("Seeding Courses...");
    await db.query(`
      INSERT INTO courses (
        id, course_code, course_name, category, level, subject, duration, 
        monthly_fee, quarterly_fee, semi_annual_fee, annual_fee, status, description
      ) VALUES
      (1, 'CRS-JEE-11', 'JEE Main & Advanced 11th', 'Competitive', 'Class 11', 'PCM', '1 Year', 12500, 35000, 65000, 120000, 'Active', 'Comprehensive JEE Prep'),
      (2, 'CRS-NEET-12', 'NEET Medical Prep 12th', 'Competitive', 'Class 12', 'PCB', '1 Year', 12000, 32000, 60000, 115000, 'Active', 'Complete Medical Entrance Prep'),
      (3, 'CRS-FND-10', 'Class 10 Foundation', 'Foundation', 'Class 10', 'All Subjects', '1 Year', 8500, 24000, 45000, 80000, 'Active', 'Board Exam + Olympiad Foundation'),
      (4, 'CRS-FND-09', 'Class 9 Early Foundation', 'Foundation', 'Class 9', 'All Subjects', '1 Year', 7500, 21000, 40000, 70000, 'Active', 'Early Concept Building'),
      (5, 'CRS-BRD-12', 'CBSE Board Special', 'Academic', 'Class 12', 'PCM', '1 Year', 9000, 25000, 48000, 85000, 'Active', 'Target Board Excellence');
    `);

    console.log("Seeding Batches...");
    await db.query(`
      INSERT INTO batches (
        id, batch_code, batch_name, course_id, subject, classroom, 
        start_date, end_date, days, batch_type, start_time, end_time, 
        max_students, current_students, status
      ) VALUES
      (1, 'BTC-JEE-A1', 'Batch A - JEE 11th', 1, 'Physics/Chem/Math', 'Room 101', '2026-04-01', '2027-03-31', ARRAY['Mon', 'Wed', 'Fri'], 'Regular', '09:00:00', '12:00:00', 40, 5, 'Active'),
      (2, 'BTC-NEET-B2', 'Batch B - NEET 12th', 2, 'Physics/Chem/Bio', 'Room 102', '2025-04-01', '2026-03-31', ARRAY['Tue', 'Thu', 'Sat'], 'Regular', '10:00:00', '13:00:00', 40, 5, 'Active'),
      (3, 'BTC-FND-C3', 'Batch C - 10th Foundation', 3, 'Science/Math', 'Room 103', '2026-03-15', '2027-02-28', ARRAY['Mon', 'Wed', 'Fri'], 'Regular', '15:00:00', '17:30:00', 35, 5, 'Active'),
      (4, 'BTC-FND-D4', 'Batch D - 9th Foundation', 4, 'Science/Math', 'Room 104', '2026-04-01', '2027-02-28', ARRAY['Tue', 'Thu', 'Sat'], 'Regular', '15:00:00', '17:30:00', 35, 5, 'Active'),
      (5, 'BTC-JEE-E5', 'Batch E - JEE Repeaters', 1, 'Physics/Chem/Math', 'Room 201', '2026-06-01', '2027-04-30', ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], 'Dropper', '08:00:00', '13:00:00', 50, 3, 'Active'),
      (6, 'BTC-NEET-F6', 'Batch F - NEET Repeaters', 2, 'Physics/Chem/Bio', 'Room 202', '2026-06-01', '2027-04-30', ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], 'Dropper', '08:00:00', '13:00:00', 50, 3, 'Active'),
      (7, 'BTC-BRD-G7', 'Batch G - 12th Boards', 5, 'Physics/Chem/Math', 'Room 105', '2025-04-15', '2026-02-28', ARRAY['Sat', 'Sun'], 'Weekend', '09:00:00', '14:00:00', 30, 2, 'Active'),
      (8, 'BTC-BRD-H8', 'Batch H - 11th Boards', 5, 'Physics/Chem/Math', 'Room 106', '2026-04-10', '2027-02-28', ARRAY['Sat', 'Sun'], 'Weekend', '09:00:00', '14:00:00', 30, 2, 'Active');
    `);

    console.log("Seeding 30 Students...");
    await db.query(`
      INSERT INTO students (
        student_code, student_name, mobile, parent_name, parent_mobile,
        class_name, course_id, batch_id, fee_type, fee_amount,
        admission_date, status, fee_status, attendance, gender,
        dob, address, school_name
      ) VALUES
      ('STU-2026-001', 'Aarav Sharma', '9876543210', 'Rajesh Sharma', '9876543211', 'Class 11', 1, 1, 'Quarterly Fee', 35000.00, '2026-04-05', 'Active', 'Paid', 94.50, 'Male', '2010-05-14', 'B-12, Sector 62, Noida, UP', 'Delhi Public School'),
      ('STU-2026-002', 'Ananya Verma', '9876512345', 'Sanjay Verma', '9876512346', 'Class 11', 1, 1, 'Annual Fee', 120000.00, '2026-04-10', 'Active', 'Paid', 91.00, 'Female', '2010-08-22', 'Flat 402, Green Park, Delhi', 'Modern School, Barakhamba'),
      ('STU-2026-003', 'Devansh Tripathi', '9812345678', 'Alok Tripathi', '9812345679', 'Class 11', 1, 1, 'Monthly Fee', 12500.00, '2026-04-11', 'Active', 'Pending', 87.00, 'Male', '2010-03-12', 'Sector 18, Atta Market, Noida', 'Apeejay School'),
      ('STU-2026-004', 'Sanya Kapoor', '9899112233', 'Rohan Kapoor', '9899112234', 'Class 11', 1, 1, 'Quarterly Fee', 35000.00, '2026-04-15', 'Active', 'Paid', 95.00, 'Female', '2010-11-05', 'H-12, Lajpat Nagar, Delhi', 'Cambridge School'),
      ('STU-2026-005', 'Karthik Raja', '9711223344', 'Sundaram Raja', '9711223345', 'Class 11', 1, 1, 'Semi-Annual Fee', 65000.00, '2026-04-18', 'Active', 'Paid', 93.20, 'Male', '2010-01-30', 'A-45, Sarita Vihar, Delhi', 'Sardar Patel Vidyalaya'),
      ('STU-2026-006', 'Rohan Gupta', '9811223344', 'Manoj Gupta', '9811223345', 'Class 12', 2, 2, 'Monthly Fee', 12000.00, '2025-04-12', 'Active', 'Paid', 96.00, 'Male', '2009-02-18', 'H-45, Vikas Puri, Delhi', 'Kalka Public School'),
      ('STU-2026-007', 'Priya Singh', '9899887766', 'Vikram Singh', '9899887767', 'Class 12', 2, 2, 'Quarterly Fee', 32000.00, '2025-04-15', 'Active', 'Pending', 88.50, 'Female', '2009-11-30', 'C-8, Indirapuram, Ghaziabad', 'DPS Indirapuram'),
      ('STU-2026-008', 'Isha Deshmukh', '9871100998', 'Milind Deshmukh', '9871100999', 'Class 12', 2, 2, 'Annual Fee', 115000.00, '2025-04-02', 'Active', 'Paid', 97.00, 'Female', '2009-07-19', 'Block D, Preet Vihar, Delhi', 'Mother Teresa Public School'),
      ('STU-2026-009', 'Yash Chaudhury', '9910098765', 'Pravin Chaudhury', '9910098766', 'Class 12', 2, 2, 'Monthly Fee', 12000.00, '2025-04-20', 'Active', 'Paid', 82.40, 'Male', '2009-09-03', 'Sector 44, Noida, UP', 'Amity International School'),
      ('STU-2026-010', 'Rhea Chakraborty', '9810102030', 'Sourav Chakraborty', '9810102031', 'Class 12', 2, 2, 'Quarterly Fee', 32000.00, '2025-05-01', 'Active', 'Pending', 89.10, 'Female', '2009-04-25', 'Flat 102, Mayur Vihar Ph 2, Delhi', 'Somerville School'),
      ('STU-2026-011', 'Ishaan Patel', '9711002233', 'Kiran Patel', '9711002234', 'Class 10', 3, 3, 'Monthly Fee', 8500.00, '2026-03-20', 'Active', 'Paid', 98.00, 'Male', '2011-01-10', '12/A, Ashok Vihar, Delhi', 'DAV Public School'),
      ('STU-2026-012', 'Diya Iyer', '9818181818', 'Raman Iyer', '9818181819', 'Class 10', 3, 3, 'Quarterly Fee', 24000.00, '2026-03-22', 'Active', 'Paid', 92.00, 'Female', '2011-07-04', '45-B, Mayur Vihar Phase 1, Delhi', 'Ahlcon Public School'),
      ('STU-2026-013', 'Arnav Bansal', '9873322110', 'Vinod Bansal', '9873322111', 'Class 10', 3, 3, 'Monthly Fee', 8500.00, '2026-03-25', 'Active', 'Pending', 90.50, 'Male', '2011-06-15', 'Sector 50, Noida, UP', 'Lotus Valley International'),
      ('STU-2026-014', 'Sneha Pillai', '9958877665', 'Gopal Pillai', '9958877666', 'Class 10', 3, 3, 'Semi-Annual Fee', 45000.00, '2026-03-28', 'Active', 'Paid', 96.20, 'Female', '2011-12-01', 'B-9, East of Kailash, Delhi', 'St. George School'),
      ('STU-2026-015', 'Chirag Sethi', '9811445566', 'Anil Sethi', '9811445567', 'Class 10', 3, 3, 'Monthly Fee', 8500.00, '2026-04-02', 'Active', 'Paid', 84.00, 'Male', '2011-08-14', 'C-15, Rajouri Garden, Delhi', 'Springdales School'),
      ('STU-2026-016', 'Kabir Mehta', '9910203040', 'Alok Mehta', '9910203041', 'Class 9', 4, 4, 'Monthly Fee', 7500.00, '2026-04-01', 'Active', 'Paid', 89.00, 'Male', '2012-03-25', 'A-301, Express Heights, Noida', 'Step by Step School'),
      ('STU-2026-017', 'Sanya Joshi', '9871122334', 'Deepak Joshi', '9871122335', 'Class 9', 4, 4, 'Semi-Annual Fee', 40000.00, '2026-04-03', 'Active', 'Paid', 95.00, 'Female', '2012-09-12', 'Sector 15, Vasundhara, Ghaziabad', 'Seth Anandram Jaipuria'),
      ('STU-2026-018', 'Vihaan Malhotra', '9810908070', 'Gaurav Malhotra', '9810908071', 'Class 9', 4, 4, 'Monthly Fee', 7500.00, '2026-04-05', 'Active', 'Pending', 91.00, 'Male', '2012-02-18', 'D-33, South Ext Part 2, Delhi', 'Bal Bharati Public School'),
      ('STU-2026-019', 'Aanya Saxena', '9971234567', 'Nitin Saxena', '9971234568', 'Class 9', 4, 4, 'Quarterly Fee', 21000.00, '2026-04-07', 'Active', 'Paid', 93.80, 'Female', '2012-10-30', 'Plot 8, Vaishali, Ghaziabad', 'Sun Valley International'),
      ('STU-2026-020', 'Madhav Rastogi', '9818765432', 'Pankaj Rastogi', '9818765433', 'Class 9', 4, 4, 'Monthly Fee', 7500.00, '2026-04-10', 'Active', 'Paid', 88.00, 'Male', '2012-05-09', 'A-2, Crossings Republik, Ghaziabad', 'Gurukul The School'),
      ('STU-2026-021', 'Aditya Kumar', '9810998877', 'Sunil Kumar', '9810998878', 'Class 12', 1, 5, 'Annual Fee', 95000.00, '2026-06-10', 'Active', 'Paid', 97.50, 'Male', '2008-04-05', 'R-10, Laxmi Nagar, Delhi', 'GBSSS Laxmi Nagar'),
      ('STU-2026-022', 'Hardik Yadav', '9873011223', 'Mahesh Yadav', '9873011224', 'Class 12', 1, 5, 'Quarterly Fee', 26000.00, '2026-06-12', 'Active', 'Paid', 93.00, 'Male', '2008-11-11', 'Sector 12, Dwarka, Delhi', 'Kendriya Vidyalaya'),
      ('STU-2026-023', 'Nikhil Mittal', '9811005544', 'Satish Mittal', '9811005545', 'Class 12', 1, 5, 'Monthly Fee', 9500.00, '2026-06-14', 'Active', 'Pending', 86.20, 'Male', '2008-01-20', 'House 50, Pitampura, Delhi', 'Kundu Public School'),
      ('STU-2026-024', 'Meera Nair', '9955443322', 'Suresh Nair', '9955443323', 'Class 12', 2, 6, 'Quarterly Fee', 28000.00, '2026-06-15', 'Active', 'Pending', 85.00, 'Female', '2008-12-19', 'Flat 104, Gurugram, HR', 'Amity International School'),
      ('STU-2026-025', 'Anusha Bhat', '9871556677', 'Narayana Bhat', '9871556678', 'Class 12', 2, 6, 'Annual Fee', 105000.00, '2026-06-18', 'Active', 'Paid', 98.40, 'Female', '2008-08-14', 'C-4, Janakpuri, Delhi', 'St. Francis De Sales'),
      ('STU-2026-026', 'Tushar Aggarwal', '9818001122', 'Ashok Aggarwal', '9818001123', 'Class 12', 2, 6, 'Monthly Fee', 10000.00, '2026-06-20', 'Active', 'Paid', 91.50, 'Male', '2008-03-28', 'D-11, Model Town, Delhi', 'GD Goenka Public School'),
      ('STU-2026-027', 'Vivaan Reddy', '9718877665', 'Pratap Reddy', '9718877666', 'Class 12', 5, 7, 'Monthly Fee', 9000.00, '2025-04-18', 'Active', 'Paid', 90.00, 'Male', '2009-06-21', 'P-4, DLF Phase 3, Gurugram', 'The Heritage School'),
      ('STU-2026-028', 'Bhavya Chawla', '9810887766', 'Harish Chawla', '9810887767', 'Class 12', 5, 7, 'Quarterly Fee', 25000.00, '2025-04-22', 'Active', 'Pending', 81.00, 'Female', '2009-10-09', 'A-88, Paschim Vihar, Delhi', 'Venkateshwar Global School'),
      ('STU-2026-029', 'Tanvi Saxena', '9811992288', 'Amit Saxena', '9811992289', 'Class 11', 5, 8, 'Monthly Fee', 9000.00, '2026-04-12', 'Active', 'Pending', 83.50, 'Female', '2010-10-08', 'B-502, Ghaziabad, UP', 'Ryan International School'),
      ('STU-2026-030', 'Siddharth Kaushik', '9910443322', 'Rakesh Kaushik', '9910443323', 'Class 11', 5, 8, 'Semi-Annual Fee', 48000.00, '2026-04-14', 'Active', 'Paid', 92.70, 'Male', '2010-02-04', 'Sector 21C, Faridabad, HR', 'Eicher School');
    `);

    console.log("Seeding Admissions (synced from students table)...");
    await db.query(`
      INSERT INTO admissions (
        receipt_code, student_name, mobile, parent_name,
        class_level, course_id, batch_id, fee_type,
        fee_amount, admission_date, fee_status
      )
      SELECT 
        REPLACE(student_code, 'STU-', 'REC-') AS receipt_code,
        student_name,
        mobile,
        parent_name,
        class_name AS class_level,
        course_id,
        batch_id,
        fee_type,
        fee_amount,
        admission_date,
        fee_status
      FROM students;
    `);

    console.log("Database successfully seeded with courses, batches, students, and admissions!");
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    process.exit();
  }
};

seedAll();