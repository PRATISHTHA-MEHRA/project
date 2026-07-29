const db = require("../config/db");

// Get all leave requests for a specific teacher
exports.getByTeacher = async (teacherId, teacherName) => {
    const query = `
        SELECT 
            leave_code AS id,
            type,
            TO_CHAR(from_date, 'YYYY-MM-DD') AS from,
            TO_CHAR(to_date, 'YYYY-MM-DD') AS to,
            reason,
            admin_remark,
            status,
            created_at
        FROM teacher_leaves
        WHERE ($1::text IS NOT NULL AND teacher_id::text = $1::text)
           OR ($2::text IS NOT NULL AND teacher_name = $2::text)
        ORDER BY created_at DESC;
    `;
    const { rows } = await db.query(query, [teacherId ? String(teacherId) : null, teacherName || null]);
    return rows;
};

// Calculate KPI Leave Statistics
exports.getStats = async (teacherId, teacherName) => {
    const query = `
        SELECT 
            COUNT(CASE WHEN status = 'Pending' THEN 1 END) AS pending,
            COUNT(CASE WHEN status = 'Approved' THEN 1 END) AS approved,
            COUNT(CASE WHEN status = 'Rejected' THEN 1 END) AS rejected,
            COALESCE(SUM(CASE WHEN status = 'Approved' AND EXTRACT(YEAR FROM from_date) = EXTRACT(YEAR FROM CURRENT_DATE) THEN (to_date - from_date + 1) ELSE 0 END), 0) AS leaves_taken_ytd
        FROM teacher_leaves
        WHERE ($1::text IS NOT NULL AND teacher_id::text = $1::text)
           OR ($2::text IS NOT NULL AND teacher_name = $2::text);
    `;
    const { rows } = await db.query(query, [teacherId ? String(teacherId) : null, teacherName || null]);
    return rows[0] || { pending: 0, approved: 0, rejected: 0, leaves_taken_ytd: 0 };
};

// Create a new leave request (Includes status & admin_remark)
exports.create = async (data) => {
    const { teacher_id, teacher_name, type, from, to, reason, status, admin_remark } = data;

    // Robust Leave Code generation
    const countQuery = `SELECT COALESCE(MAX(CAST(SUBSTRING(leave_code FROM 4) AS INTEGER)), 0) + 1 AS next_val FROM teacher_leaves WHERE leave_code LIKE 'LV-%';`;
    const { rows: countRows } = await db.query(countQuery);
    const nextVal = countRows[0]?.next_val || 1;
    const leave_code = `LV-${String(nextVal).padStart(2, "0")}`;

    const query = `
        INSERT INTO teacher_leaves (leave_code, teacher_id, teacher_name, type, from_date, to_date, reason, status, admin_remark)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING 
            leave_code AS id, 
            type, 
            TO_CHAR(from_date, 'YYYY-MM-DD') AS from, 
            TO_CHAR(to_date, 'YYYY-MM-DD') AS to, 
            reason, 
            status,
            admin_remark;
    `;
    const { rows } = await db.query(query, [
        leave_code, 
        teacher_id || null, 
        teacher_name, 
        type, 
        from, 
        to, 
        reason || '', 
        status || 'Approved', 
        admin_remark || 'Auto-approved by system'
    ]);
    return rows[0];
};

// Update an existing leave request
exports.update = async (leaveCode, data) => {
    const { type, from, to, reason } = data;
    const query = `
        UPDATE teacher_leaves
        SET 
            type = COALESCE($1, type),
            from_date = COALESCE($2, from_date),
            to_date = COALESCE($3, to_date),
            reason = COALESCE($4, reason)
        WHERE leave_code = $5 AND status = 'Pending'
        RETURNING leave_code AS id, type, TO_CHAR(from_date, 'YYYY-MM-DD') AS from, TO_CHAR(to_date, 'YYYY-MM-DD') AS to, reason, status;
    `;
    const { rows } = await db.query(query, [type, from, to, reason, leaveCode]);
    return rows[0];
};