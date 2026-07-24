const db = require("../config/db");


const getAll = async () => {
    const result = await db.query(`
        SELECT id, student_name, parent_name, mobile, class_level, course_interest, batch_name, teacher_name,
               demo_date, demo_time,
               source, preferred_timing, followup_date, counselor, status, remarks, created_at
        FROM enquiries
        ORDER BY id DESC;
    `);
    return result.rows;
};

const getById = async (id) => {
    const result = await db.query(`
        SELECT id, student_name, parent_name, mobile, class_level, course_interest, batch_name, teacher_name,
               demo_date, demo_time,
               source, preferred_timing, followup_date, counselor, status, remarks, created_at
        FROM enquiries
        WHERE id = $1;
    `, [id]);
    return result.rows[0];
};

// Used only as a fallback when a demo is created directly from the Demo
// Classes page (not via the enquiry's own status field), so we can still
// link it back to the right enquiry and update that enquiry's status.
const getOpenByName = async (name) => {
    const result = await db.query(`
        SELECT id, student_name, parent_name, mobile, class_level, course_interest, batch_name, teacher_name,
               demo_date, demo_time,
               source, preferred_timing, followup_date, counselor, status, remarks, created_at
        FROM enquiries
        WHERE student_name = $1 AND status != 'Converted'
        ORDER BY id DESC LIMIT 1;
    `, [name]);
    return result.rows[0];
};

const create = async (data) => {
    const result = await db.query(`
        INSERT INTO enquiries (
            student_name, parent_name, mobile, class_level, course_interest, batch_name, teacher_name,
            demo_date, demo_time,
            source, preferred_timing, followup_date, counselor, status, remarks, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, COALESCE($16, CURRENT_DATE))
        RETURNING *;
    `, [
        data.student_name, data.parent_name, data.mobile, data.class_level, data.course_interest, data.batch_name, data.teacher_name,
        data.demo_date, data.demo_time,
        data.source, data.preferred_timing, data.followup_date, data.counselor, data.status, data.remarks, data.date
    ]);
    return result.rows[0];
};

const update = async (id, data) => {
    const result = await db.query(`
        UPDATE enquiries SET
            student_name = $1, parent_name = $2, mobile = $3, class_level = $4, course_interest = $5, batch_name = $6, teacher_name = $7,
            demo_date = $8, demo_time = $9,
            source = $10, preferred_timing = $11, followup_date = $12, counselor = $13,
            status = $14, remarks = $15
        WHERE id = $16
        RETURNING *;
    `, [
        data.student_name, data.parent_name, data.mobile, data.class_level, data.course_interest, data.batch_name, data.teacher_name,
        data.demo_date, data.demo_time,
        data.source, data.preferred_timing, data.followup_date, data.counselor, data.status, data.remarks, id
    ]);
    return result.rows[0];
};

const deleteEnq = async (id) => {
    const result = await db.query("DELETE FROM enquiries WHERE id = $1 RETURNING id;", [id]);
    return result.rows[0] || null;
};

const getStats = async () => {
    const result = await db.query(`
        SELECT
            COUNT(*) AS total,
            COUNT(CASE WHEN status IN ('New','Contacted','Interested','Demo Scheduled','Demo Completed') THEN 1 END) AS open_count,
            COUNT(CASE WHEN status = 'Converted' THEN 1 END) AS converted_count
        FROM enquiries;
    `);
    return result.rows[0];
};

module.exports = { getAll, getById, getOpenByName, create, update, deleteEnq, getStats };