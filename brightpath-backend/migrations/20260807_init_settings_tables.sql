-- Initialize Settings Tables for BrightPath
-- Run once against the BrightPath PostgreSQL database

-- 1. Centre Profile (Singleton - id=1)
CREATE TABLE IF NOT EXISTS settings_centre_profile (
  id SERIAL PRIMARY KEY,
  centre_name VARCHAR(255) NOT NULL DEFAULT '',
  contact_number VARCHAR(20),
  email VARCHAR(255),
  gst_no VARCHAR(50),
  address TEXT,
  receipt_prefix VARCHAR(20) DEFAULT 'RCP-',
  currency VARCHAR(50) DEFAULT 'INR (₹)',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Branches
CREATE TABLE IF NOT EXISTS settings_branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Classrooms
CREATE TABLE IF NOT EXISTS settings_classrooms (
  id SERIAL PRIMARY KEY,
  room_name VARCHAR(255) NOT NULL,
  capacity INTEGER,
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Fee Reminder Rules (Singleton - id=1)
CREATE TABLE IF NOT EXISTS settings_fee_rules (
  id SERIAL PRIMARY KEY,
  first_reminder_days INTEGER DEFAULT 3,
  second_reminder_days INTEGER DEFAULT 3,
  final_reminder_days INTEGER DEFAULT 10,
  late_fine_per_day NUMERIC(10,2) DEFAULT 20.00,
  reminder_channel VARCHAR(100) DEFAULT 'WhatsApp + SMS',
  auto_send BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Roles & Permissions
CREATE TABLE IF NOT EXISTS settings_roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(255) NOT NULL UNIQUE,
  permissions TEXT,
  user_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Notification Templates
CREATE TABLE IF NOT EXISTS settings_notification_templates (
  id SERIAL PRIMARY KEY,
  template_key VARCHAR(100) UNIQUE NOT NULL,
  label VARCHAR(255),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. Academic Year (Singleton - id=1)
CREATE TABLE IF NOT EXISTS settings_academic_year (
  id SERIAL PRIMARY KEY,
  current_year VARCHAR(20),
  session_start DATE,
  session_end DATE,
  working_days VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Holidays
CREATE TABLE IF NOT EXISTS settings_holidays (
  id SERIAL PRIMARY KEY,
  academic_year_id INTEGER DEFAULT 1,
  label VARCHAR(255),
  holiday_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (academic_year_id) REFERENCES settings_academic_year(id) ON DELETE CASCADE
);

-- Initialize singletons with default data
INSERT INTO settings_centre_profile (id, centre_name, contact_number, email, gst_no, address, receipt_prefix, currency)
VALUES (1, 'BrightPath Coaching Centre', '', '', '', '', 'RCP-', 'INR (₹)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO settings_fee_rules (id, first_reminder_days, second_reminder_days, final_reminder_days, late_fine_per_day, reminder_channel, auto_send)
VALUES (1, 3, 3, 10, 20.00, 'WhatsApp + SMS', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO settings_academic_year (id, current_year, session_start, session_end, working_days)
VALUES (1, '2026-27', NULL, NULL, 'Mon – Sat')
ON CONFLICT (id) DO NOTHING;

-- Insert default notification templates
INSERT INTO settings_notification_templates (template_key, label, content) VALUES
('fee_reminder_1', 'First Fee Reminder', 'Dear {parent_name}, your fee is due on {due_date}. Please pay at your earliest convenience.'),
('fee_reminder_2', 'Second Fee Reminder', 'Dear {parent_name}, your fee is overdue. Please contact the centre immediately.'),
('fee_reminder_3', 'Final Fee Reminder', 'URGENT: Your account is overdue by {days} days. Late fine will be applied.'),
('demo_class_confirm', 'Demo Class Confirmation', 'Hi {student_name}, your demo class is scheduled for {date} at {time}. See you there!'),
('homework_submission', 'Homework Submission', 'Hi {student_name}, homework for {subject} is due by {due_date}. Please submit on time.'),
('exam_notification', 'Exam Notification', 'Dear {student_name}, {exam_name} is scheduled for {date}. Prepare well!'),
('admission_welcome', 'Admission Welcome', 'Welcome {student_name} to BrightPath! Your admission is confirmed. Course starts on {start_date}.'),
('payment_receipt', 'Payment Receipt', 'Payment of ₹{amount} received. Receipt: {receipt_no}. Thank you for paying on time!')
ON CONFLICT (template_key) DO NOTHING;
