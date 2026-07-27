const db = require("../config/db");

const getAll = async () => {
    const result = await db.query("SELECT * FROM demo_classes ORDER BY id DESC");
    return result.rows;
};

const getById = async (id) => {
    const result = await db.query("SELECT * FROM demo_classes WHERE id = $1", [id]);
    return result.rows[0];
};

const getByEnquiryId = async (enquiryId) => {
    if (!enquiryId) return null;
    const result = await db.query(
        "SELECT * FROM demo_classes WHERE enquiry_id = $1 ORDER BY id DESC LIMIT 1",
        [enquiryId]
    );
    return result.rows[0];
};

// Helper: Fetch default Teacher, Batch, and Timing associated with a course name
const getCourseDetails = async (courseName) => {
    if (!courseName) return null;
    const result = await db.query(
        "SELECT course_name, teacher_name, batch_name, timing FROM courses WHERE LOWER(TRIM(course_name)) = LOWER(TRIM($1)) LIMIT 1",
        [courseName]
    );
    return result.rows[0] || null;
};

const create = async (data) => {
    const result = await db.query(`
        INSERT INTO demo_classes (
            student_name, course_name, batch_name, teacher_name, demo_date, demo_time, status, feedback, enquiry_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, '-'), $9)
        RETURNING *;
    `, [
        data.student_name,
        data.course_name,
        data.batch_name || 'Default Batch',
        data.teacher_name || 'Unassigned',
        data.demo_date,
        data.demo_time,
        data.status || 'Scheduled',
        data.feedback,
        data.enquiry_id || null
    ]);
    return result.rows[0];
};

const update = async (id, data) => {
    const result = await db.query(`
        UPDATE demo_classes SET
            student_name = $1, course_name = $2, batch_name = $3, teacher_name = $4,
            demo_date = $5, demo_time = $6, status = $7, feedback = $8
        WHERE id = $9 RETURNING *;
    `, [
        data.student_name,
        data.course_name,
        data.batch_name,
        data.teacher_name,
        data.demo_date,
        data.demo_time,
        data.status,
        data.feedback,
        id
    ]);
    return result.rows[0];
};

module.exports = { getAll, getById, getByEnquiryId, getCourseDetails, create, update };