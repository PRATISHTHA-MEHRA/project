const db = require("../config/db");

// Get All Exams
const getAllExams = async () => {
    const query = `
        SELECT 
            id, 
            test_name AS "name", 
            course_name AS "course", 
            batch_name AS "batch",
            subject_name AS "subject", 
            teacher_name AS "teacher", 
            TO_CHAR(test_date, 'YYYY-MM-DD') AS "date", 
            total_marks AS "total", 
            passing_marks AS "pass", 
            status, 
            syllabus
        FROM assessments_exams 
        ORDER BY created_at DESC;
    `;
    const result = await db.query(query);
    return result.rows;
};

// Get Exam By ID
const getExamById = async (id) => {
    const query = `
        SELECT 
            id, 
            test_name AS "name", 
            course_name AS "course", 
            batch_name AS "batch",
            subject_name AS "subject", 
            teacher_name AS "teacher", 
            TO_CHAR(test_date, 'YYYY-MM-DD') AS "date", 
            total_marks AS "total", 
            passing_marks AS "pass", 
            status, 
            syllabus
        FROM assessments_exams 
        WHERE id = $1;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
};

// Create Exam (Safely handles auto-generating string IDs)
const createExam = async (data, client = db) => {
    // Generate next string ID safely using MAX instead of COUNT to prevent collisions after deletions
    const maxRes = await client.query(`
        SELECT COALESCE(MAX(CAST(NULLIF(regexp_replace(id, '[^0-9]', '', 'g'), '') AS INTEGER)), 2000) + 1 AS next_val 
        FROM assessments_exams
    `);
    
    const nextVal = maxRes.rows[0].next_val;
    const generatedId = `EX-${nextVal}`;

    const query = `
        INSERT INTO assessments_exams (
            id, test_name, course_name, batch_name, subject_name, 
            teacher_name, test_date, total_marks, passing_marks, status, syllabus
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING 
            id, 
            test_name AS "name", 
            course_name AS "course", 
            batch_name AS "batch",
            subject_name AS "subject", 
            teacher_name AS "teacher", 
            TO_CHAR(test_date, 'YYYY-MM-DD') AS "date", 
            total_marks AS "total", 
            passing_marks AS "pass", 
            status, 
            syllabus;
    `;
    
    const values = [
        generatedId,
        data.name,
        data.course,
        data.batch,
        data.subject,
        data.teacher,
        data.date || null,
        data.total || 100,
        data.pass || 35,
        data.status || 'Scheduled',
        data.syllabus || null
    ];

    const result = await client.query(query, values);
    return result.rows[0];
};

// Update Exam
const updateExam = async (id, data, client = db) => {
    const query = `
        UPDATE assessments_exams 
        SET test_name = $1, 
            course_name = $2, 
            batch_name = $3, 
            subject_name = $4,
            teacher_name = $5, 
            test_date = $6, 
            total_marks = $7, 
            passing_marks = $8, 
            status = $9, 
            syllabus = $10,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $11
        RETURNING 
            id, 
            test_name AS "name", 
            course_name AS "course", 
            batch_name AS "batch",
            subject_name AS "subject", 
            teacher_name AS "teacher", 
            TO_CHAR(test_date, 'YYYY-MM-DD') AS "date", 
            total_marks AS "total", 
            passing_marks AS "pass", 
            status, 
            syllabus;
    `;
    
    const values = [
        data.name,
        data.course,
        data.batch,
        data.subject,
        data.teacher,
        data.date,
        data.total,
        data.pass,
        data.status,
        data.syllabus,
        id
    ];

    const result = await client.query(query, values);
    return result.rows[0];
};

// Delete Exam
const deleteExam = async (id) => {
    const query = `DELETE FROM assessments_exams WHERE id = $1 RETURNING id;`;
    const result = await db.query(query, [id]);
    return result.rows[0];
};

module.exports = { 
    getAllExams, 
    getExamById, 
    createExam, 
    updateExam, 
    deleteExam 
};