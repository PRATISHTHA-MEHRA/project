// models/settingsModel.js
// Assumes ../config/db.js exports a pg Pool instance: module.exports = new Pool({...})
const pool = require('../config/db');

const SettingsModel = {

  // ---------- Centre Profile (singleton, id=1) ----------
  getProfile: () => pool.query('SELECT * FROM settings_centre_profile WHERE id = 1'),
  updateProfile: (b) => pool.query(
    `UPDATE settings_centre_profile SET centre_name=$1, contact_number=$2, email=$3, gst_no=$4,
     address=$5, receipt_prefix=$6, currency=$7, updated_at=NOW() WHERE id=1 RETURNING *`,
    [b.centre_name, b.contact_number, b.email, b.gst_no, b.address, b.receipt_prefix, b.currency]
  ),

  // ---------- Branches ----------
  getBranches: () => pool.query('SELECT * FROM settings_branches ORDER BY id'),
  addBranch: (b) => pool.query(
    'INSERT INTO settings_branches (name, location, status) VALUES ($1,$2,$3) RETURNING *',
    [b.name, b.location, b.status || 'Active']
  ),
  updateBranch: (id, b) => pool.query(
    'UPDATE settings_branches SET name=$1, location=$2, status=$3 WHERE id=$4 RETURNING *',
    [b.name, b.location, b.status, id]
  ),
  deleteBranch: (id) => pool.query('DELETE FROM settings_branches WHERE id=$1', [id]),

  // ---------- Classrooms ----------
  getClassrooms: () => pool.query('SELECT * FROM settings_classrooms ORDER BY id'),
  addClassroom: (c) => pool.query(
    'INSERT INTO settings_classrooms (room_name, capacity, status) VALUES ($1,$2,$3) RETURNING *',
    [c.room_name, c.capacity, c.status || 'Active']
  ),
  updateClassroom: (id, c) => pool.query(
    'UPDATE settings_classrooms SET room_name=$1, capacity=$2, status=$3 WHERE id=$4 RETURNING *',
    [c.room_name, c.capacity, c.status, id]
  ),
  deleteClassroom: (id) => pool.query('DELETE FROM settings_classrooms WHERE id=$1', [id]),

  // ---------- Fee Reminder Rules (singleton, id=1) ----------
  getFeeRules: () => pool.query('SELECT * FROM settings_fee_rules WHERE id = 1'),
  updateFeeRules: (r) => pool.query(
    `UPDATE settings_fee_rules SET first_reminder_days=$1, second_reminder_days=$2, final_reminder_days=$3,
     late_fine_per_day=$4, reminder_channel=$5, auto_send=$6, updated_at=NOW() WHERE id=1 RETURNING *`,
    [r.first_reminder_days, r.second_reminder_days, r.final_reminder_days, r.late_fine_per_day, r.reminder_channel, r.auto_send]
  ),

  // ---------- Roles & Permissions ----------
  getRoles: () => pool.query('SELECT * FROM settings_roles ORDER BY id'),
  addRole: (r) => pool.query(
    'INSERT INTO settings_roles (role_name, permissions, user_count, status) VALUES ($1,$2,$3,$4) RETURNING *',
    [r.role_name, r.permissions, r.user_count || 0, r.status || 'Active']
  ),
  updateRole: (id, r) => pool.query(
    'UPDATE settings_roles SET role_name=$1, permissions=$2, status=$3 WHERE id=$4 RETURNING *',
    [r.role_name, r.permissions, r.status, id]
  ),
  deleteRole: (id) => pool.query('DELETE FROM settings_roles WHERE id=$1', [id]),

  // ---------- Notification Templates ----------
  getTemplates: () => pool.query('SELECT * FROM settings_notification_templates ORDER BY id'),
  updateTemplate: (key, content) => pool.query(
    'UPDATE settings_notification_templates SET content=$1, updated_at=NOW() WHERE template_key=$2 RETURNING *',
    [content, key]
  ),

  // ---------- Academic Year (singleton, id=1) ----------
  getAcademicYear: () => pool.query('SELECT * FROM settings_academic_year WHERE id = 1'),
  updateAcademicYear: (a) => pool.query(
    `UPDATE settings_academic_year SET current_year=$1, session_start=$2, session_end=$3,
     working_days=$4, updated_at=NOW() WHERE id=1 RETURNING *`,
    [a.current_year, a.session_start, a.session_end, a.working_days]
  ),

  // ---------- Holidays ----------
  getHolidays: () => pool.query('SELECT * FROM settings_holidays WHERE academic_year_id = 1 ORDER BY id'),
  addHoliday: (h) => pool.query(
    'INSERT INTO settings_holidays (academic_year_id, label, holiday_date) VALUES (1,$1,$2) RETURNING *',
    [h.label, h.holiday_date || null]
  ),
  deleteHoliday: (id) => pool.query('DELETE FROM settings_holidays WHERE id=$1', [id]),
};

module.exports = SettingsModel;