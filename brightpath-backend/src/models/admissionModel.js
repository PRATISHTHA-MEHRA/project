const db = require("../config/db");

const getAllAdmissions = async () => {
    const result = await db.query(`
        SELECT 
            a.*,
            c.course_name,
            b.batch_name,
            COALESCE(s.fee_status, a.fee_status) AS effective_fee_status
        FROM admissions a
        LEFT JOIN courses c ON a.course_id = c.id
        LEFT JOIN batches b ON a.batch_id = b.id
        LEFT JOIN students s ON s.mobile = a.mobile AND s.course_id = a.course_id
        ORDER BY a.id DESC
    `);
    return result.rows;
};

const getAdmissionStats = async () => {
    const query = `
        SELECT 
            -- 1. Total admissions this calendar month
            COUNT(CASE WHEN DATE_TRUNC('month', admission_date) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as month_count,
            
            -- 2. Total admissions this calendar quarter
            COUNT(CASE WHEN DATE_TRUNC('quarter', admission_date) = DATE_TRUNC('quarter', CURRENT_DATE) THEN 1 END) as quarter_count,
            
            -- Demo conversions use a source-prefixed admission receipt code.
            COUNT(CASE WHEN receipt_code LIKE 'DEMO-%' THEN 1 END) as demo_count,
            
            -- 4. Average fee amount per admission
            COALESCE(ROUND(AVG(fee_amount), 0), 0) as avg_fee
        FROM admissions;
    `;
    const result = await db.query(query);
    return result.rows[0];
};

const getAdmissionById = async (id) => {
    const result = await db.query(`
        SELECT 
            a.*,
            c.course_name,
            b.batch_name,
            COALESCE(s.fee_status, a.fee_status) AS effective_fee_status
        FROM admissions a
        LEFT JOIN courses c ON a.course_id = c.id
        LEFT JOIN batches b ON a.batch_id = b.id
        LEFT JOIN students s ON s.mobile = a.mobile AND s.course_id = a.course_id
        WHERE a.id = $1
    `, [id]);
    return result.rows[0];
};

const createAdmission = async (data) => {
    const result = await db.query(`
        INSERT INTO admissions (
            receipt_code, student_name, mobile, parent_name, 
            class_level, course_id, batch_id, fee_type, 
            fee_amount, admission_date, fee_status
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
    `, [
        data.receipt_code, data.student_name, data.mobile, data.parent_name,
        data.class_level, data.course_id, data.batch_id, data.fee_type,
        data.fee_amount, data.admission_date, data.fee_status
    ]);
    return result.rows[0];
};

module.exports = {
    getAllAdmissions,
    getAdmissionById,
    createAdmission,
    getAdmissionStats
};
