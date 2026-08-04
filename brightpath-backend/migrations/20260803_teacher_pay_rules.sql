-- Run once against the BrightPath PostgreSQL database before deploying.
ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS pay_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_salary NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Payment vouchers retain the salary rule and rate that was used to calculate them.
ALTER TABLE teacher_payments
  ADD COLUMN IF NOT EXISTS rate_used NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hours_taken NUMERIC(12,2) NOT NULL DEFAULT 0;
