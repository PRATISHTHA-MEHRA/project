// models/settingsModel.js
const pool = require('../config/db');

// models/settingsModel.js
const SettingsModel = {
  getProfile: () => pool.query('SELECT * FROM settings_centre_profile WHERE id = 1'),

  updateProfile: (b) => pool.query(
    `UPDATE settings_centre_profile SET 
       centre_name = $1,
       contact_number = $2,
       email = $3,
       gst_no = $4,
       address = $5,
       receipt_prefix = $6,
       currency = $7,
       tagline = $8,
       phone = $9,
       updated_at = NOW()
     WHERE id = 1
     RETURNING *`,
    [
      b.centre_name || '',
      b.contact_number || '',
      b.email || '',
      b.gst_no || '',
      b.address || '',
      b.receipt_prefix || 'RCP-',
      b.currency || 'INR (₹)',
      b.tagline || '',
      b.phone || ''
    ]
  ),


  // ---------- Branches ----------
  getBranches: () => pool.query('SELECT id, COALESCE(name, branch_name) as name, COALESCE(location, address) as location, COALESCE(status, (CASE WHEN is_active = true THEN \'Active\' ELSE \'Inactive\' END)) as status FROM settings_branches ORDER BY id'),
  addBranch: (b) => pool.query(
    'INSERT INTO settings_branches (name, location, status) VALUES ($1, $2, $3) RETURNING id, name, location, status',
    [b.name, b.location, b.status || 'Active']
  ),
  updateBranch: (id, b) => pool.query(
    'UPDATE settings_branches SET name=$1, location=$2, status=$3 WHERE id=$4 RETURNING id, name, location, status',
    [b.name, b.location, b.status, id]
  ),
  deleteBranch: (id) => pool.query('DELETE FROM settings_branches WHERE id=$1', [id]),

  // ---------- Classrooms ----------
  getClassrooms: () => pool.query('SELECT id, name as room_name, capacity, (CASE WHEN is_active = true THEN \'Active\' ELSE \'Inactive\' END) as status FROM settings_classrooms ORDER BY id'),
  addClassroom: (c) => pool.query(
    'INSERT INTO settings_classrooms (name, capacity, is_active) VALUES ($1, $2, $3) RETURNING id, name as room_name, capacity, (CASE WHEN is_active = true THEN \'Active\' ELSE \'Inactive\' END) as status',
    [c.room_name, c.capacity, c.status === 'Active' || true]
  ),
  updateClassroom: (id, c) => pool.query(
    'UPDATE settings_classrooms SET name=$1, capacity=$2, is_active=$3 WHERE id=$4 RETURNING id, name as room_name, capacity, (CASE WHEN is_active = true THEN \'Active\' ELSE \'Inactive\' END) as status',
    [c.room_name, c.capacity, c.status === 'Active', id]
  ),
  deleteClassroom: (id) => pool.query('DELETE FROM settings_classrooms WHERE id=$1', [id]),

  // ---------- Fee Reminder Rules (singleton, id=1) ----------
  getFeeRules: () => pool.query('SELECT * FROM settings_fee_rules WHERE id = 1'),
  updateFeeRules: (r) => pool.query(
    `UPDATE settings_fee_rules SET 
       first_reminder_days = $1,
       second_reminder_days = $2,
       final_reminder_days = $3,
       late_fine_per_day = $4,
       reminder_channel = $5,
       auto_send = $6,
       updated_at = NOW()
     WHERE id = 1
     RETURNING *`,
    [r.first_reminder_days, r.second_reminder_days, r.final_reminder_days, r.late_fine_per_day, r.reminder_channel, r.auto_send]
  ),

  // ---------- Roles & Permissions ----------
  getRoles: () => pool.query('SELECT id, role_name, permissions, 0 as user_count, (CASE WHEN is_active = true THEN \'Active\' ELSE \'Inactive\' END) as status FROM settings_roles ORDER BY id'),
  addRole: (r) => pool.query(
    'INSERT INTO settings_roles (role_name, permissions, is_active) VALUES ($1, $2, $3) RETURNING id, role_name, permissions, 0 as user_count, (CASE WHEN is_active = true THEN \'Active\' ELSE \'Inactive\' END) as status',
    [r.role_name, r.permissions, r.status === 'Active' || true]
  ),
  updateRole: (id, r) => pool.query(
    'UPDATE settings_roles SET role_name=$1, permissions=$2, is_active=$3 WHERE id=$4 RETURNING id, role_name, permissions, 0 as user_count, (CASE WHEN is_active = true THEN \'Active\' ELSE \'Inactive\' END) as status',
    [r.role_name, r.permissions, r.status === 'Active', id]
  ),
  deleteRole: (id) => pool.query('DELETE FROM settings_roles WHERE id=$1', [id]),

  // ---------- Notification Templates ----------
  getTemplates: () => pool.query('SELECT id, template_name as template_key, template_name as label, body as content FROM settings_notification_templates ORDER BY id'),
  updateTemplate: (key, content) => pool.query(
    'UPDATE settings_notification_templates SET body=$1, updated_at=NOW() WHERE template_name=$2 RETURNING id, template_name as template_key, template_name as label, body as content',
    [content, key]
  ),

  // ---------- Academic Year (singleton, id=1) ----------
  getAcademicYear: () => pool.query('SELECT id, year_label as current_year, start_date as session_start, end_date as session_end, description as working_days FROM settings_academic_year WHERE id = 1'),
  updateAcademicYear: (a) => pool.query(
    `UPDATE settings_academic_year SET 
       year_label = $1,
       start_date = $2,
       end_date = $3,
       description = $4,
       updated_at = NOW()
     WHERE id = 1
     RETURNING id, year_label as current_year, start_date as session_start, end_date as session_end, description as working_days`,
    [a.current_year, a.session_start || null, a.session_end || null, a.working_days]
  ),

  // ---------- Holidays ----------
  getHolidays: () => pool.query('SELECT id, title as label, holiday_date FROM settings_holidays WHERE academic_year_id = 1 ORDER BY id'),
  addHoliday: (h) => pool.query(
    'INSERT INTO settings_holidays (academic_year_id, title, holiday_date) VALUES (1, $1, $2) RETURNING id, title as label, holiday_date',
    [h.label, h.holiday_date || null]
  ),
  deleteHoliday: (id) => pool.query('DELETE FROM settings_holidays WHERE id=$1', [id]),
};

module.exports = SettingsModel;