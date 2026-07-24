const db = require("../config/db");

// 1. Get All Teachers
exports.getAll = async () => {
    const query = `
        SELECT 
            t.*,
            COALESCE(
                JSON_AGG(
                    DISTINCT JSONB_BUILD_OBJECT(
                        'id', b.id,
                        'batch_name', b.batch_name,
                        'subject', b.subject,
                        'course_id', b.course_id,
                        'course_name', c.course_name,
                        'start_time', b.start_time,
                        'end_time', b.end_time,
                        'current_students', b.current_students
                    )
                ) FILTER (WHERE b.id IS NOT NULL), '[]'
            ) AS assigned_batches,
            ARRAY_TO_STRING(ARRAY_AGG(DISTINCT c.course_name) FILTER (WHERE c.course_name IS NOT NULL), ', ') AS courses_list
        FROM teachers t
        LEFT JOIN batches b ON b.teacher_id = t.id
        LEFT JOIN courses c ON b.course_id = c.id
        GROUP BY t.id
        ORDER BY t.id DESC;
    `;
    const { rows } = await db.query(query);
    return rows;
};

// 2. Get Single Teacher
exports.getById = async (id) => {
    const query = `
        SELECT 
            t.*,
            COALESCE(
                JSON_AGG(
                    DISTINCT JSONB_BUILD_OBJECT(
                        'id', b.id,
                        'batch_name', b.batch_name,
                        'subject', b.subject,
                        'course_id', b.course_id,
                        'course_name', c.course_name,
                        'start_time', b.start_time,
                        'end_time', b.end_time,
                        'current_students', b.current_students
                    )
                ) FILTER (WHERE b.id IS NOT NULL), '[]'
            ) AS assigned_batches,
            ARRAY_TO_STRING(ARRAY_AGG(DISTINCT c.course_name) FILTER (WHERE c.course_name IS NOT NULL), ', ') AS courses_list
        FROM teachers t
        LEFT JOIN batches b ON b.teacher_id = t.id
        LEFT JOIN courses c ON b.course_id = c.id
        WHERE t.id = $1
        GROUP BY t.id;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
};

// 3. Create Teacher
exports.create = async (data) => {
    const { teacher_name, teacher_code, mobile, email, qualification, experience, subjects, payment_type, joining_date, status } = data;
    const query = `
        INSERT INTO teachers (teacher_name, teacher_code, mobile, email, qualification, experience, subjects, payment_type, joining_date, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
    `;
    const values = [teacher_name, teacher_code, mobile, email, qualification, experience, subjects, payment_type, joining_date, status || 'Active'];
    const { rows } = await db.query(query, values);
    return rows[0];
};

// 4. Update Teacher (Removed updated_at column to fix PG error)
exports.update = async (id, data) => {
    const { teacher_name, mobile, email, qualification, experience, subjects, payment_type, joining_date, status } = data;
    const query = `
        UPDATE teachers 
        SET 
            teacher_name = COALESCE($1, teacher_name),
            mobile = COALESCE($2, mobile),
            email = COALESCE($3, email),
            qualification = COALESCE($4, qualification),
            experience = COALESCE($5, experience),
            subjects = COALESCE($6, subjects),
            payment_type = COALESCE($7, payment_type),
            joining_date = COALESCE($8, joining_date),
            status = COALESCE($9, status)
        WHERE id = $10
        RETURNING *;
    `;
    const values = [teacher_name, mobile, email, qualification, experience, subjects, payment_type, joining_date, status, id];
    const { rows } = await db.query(query, values);
    return rows[0];
};

// 5. Delete Teacher
exports.delete = async (id) => {
    const query = `DELETE FROM teachers WHERE id = $1 RETURNING id;`;
    const { rows } = await db.query(query, [id]);
    return rows[0];
};