const db = require("../config/db");


const getAll = async () => {
    const result = await db.query(`
        SELECT id, student_name, parent_name, mobile, class_level, course_interest,
               source, preferred_timing, followup_date, counselor, status, remarks, created_at
        FROM enquiries
        ORDER BY id DESC;
    `);
    return result.rows;
};

const getById = async (id) => {
    const result = await db.query(`
        SELECT id, student_name, parent_name, mobile, class_level, course_interest,
               source, preferred_timing, followup_date, counselor, status, remarks, created_at
        FROM enquiries
        WHERE id = $1;
    `, [id]);
    return result.rows[0];
};

const create = async (data) => {
    const result = await db.query(`
        INSERT INTO enquiries (
            student_name, parent_name, mobile, class_level, course_interest,
            source, preferred_timing, followup_date, counselor, status, remarks, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12, CURRENT_DATE))
        RETURNING *;
    `, [
        data.student_name, data.parent_name, data.mobile, data.class_level, data.course_interest,
        data.source, data.preferred_timing, data.followup_date, data.counselor, data.status, data.remarks, data.date
    ]);
    return result.rows[0];
};

const update = async (id, data) => {
    const result = await db.query(`
        UPDATE enquiries SET
            student_name = $1, parent_name = $2, mobile = $3, class_level = $4, course_interest = $5,
            source = $6, preferred_timing = $7, followup_date = $8, counselor = $9,
            status = $10, remarks = $11
        WHERE id = $12
        RETURNING *;
    `, [
        data.student_name, data.parent_name, data.mobile, data.class_level, data.course_interest,
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

module.exports = { getAll, getById, create, update, deleteEnq, getStats };