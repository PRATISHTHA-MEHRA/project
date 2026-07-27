const db = require("../config/db");

const getAllAdmissions = async () => {
    const result = await db.query(`
        SELECT 
            a.*,
            c.course_name,
            b.batch_name,
            s.parent_mobile,
            s.gender,
            s.dob,
            s.address,
            s.school_name,
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
            COUNT(CASE WHEN DATE_TRUNC('month', admission_date) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as month_count,
            COUNT(CASE WHEN DATE_TRUNC('quarter', admission_date) = DATE_TRUNC('quarter', CURRENT_DATE) THEN 1 END) as quarter_count,
            COUNT(CASE WHEN receipt_code LIKE 'DEMO-%' THEN 1 END) as demo_count,
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
            s.parent_mobile,
            s.gender,
            s.dob,
            s.address,
            s.school_name,
            COALESCE(s.fee_status, a.fee_status) AS effective_fee_status
        FROM admissions a
        LEFT JOIN courses c ON a.course_id = c.id
        LEFT JOIN batches b ON a.batch_id = b.id
        LEFT JOIN students s ON s.mobile = a.mobile AND s.course_id = a.course_id
        WHERE a.id = $1
    `, [id]);
    return result.rows[0];
};

module.exports = {
    getAllAdmissions,
    getAdmissionById,
    getAdmissionStats
};