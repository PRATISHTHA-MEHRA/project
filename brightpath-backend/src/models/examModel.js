const db = require("../config/db");

const getAllExams = async () => {
    const query = `
        SELECT 
            id, test_name as "name", course_name as "course", batch_name as "batch",
            subject_name as "subject", teacher_name as "teacher", 
            TO_CHAR(test_date, 'YYYY-MM-DD') as "date", 
            total_marks as "total", passing_marks as "pass", status, syllabus
        FROM assessments_exams 
        ORDER BY created_at DESC;
    `;
    const result = await db.query(query);
    return result.rows;
};

const createExam = async (data) => {
    // Generate sequential string keys (e.g., EX-2002) matching frontend offset counts
    const countRes = await db.query("SELECT COUNT(*) FROM assessments_exams");
    const generatedId = `EX-${2001 + parseInt(countRes.rows[0].count)}`;

    const query = `
        INSERT INTO assessments_exams (
            id, test_name, course_name, batch_name, subject_name, 
            teacher_name, test_date, total_marks, passing_marks, status, syllabus
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id;
    `;
    const result = await db.query(query, [
        generatedId, data.name, data.course, data.batch, data.subject,
        data.teacher, data.date, data.total, data.pass, data.status, data.syllabus
    ]);
    return result.rows[0];
};

const updateExam = async (id, data) => {
    const query = `
        UPDATE assessments_exams 
        SET test_name = $1, course_name = $2, batch_name = $3, subject_name = $4,
            teacher_name = $5, test_date = $6, total_marks = $7, passing_marks = $8, 
            status = $9, syllabus = $10
        WHERE id = $11
        RETURNING id;
    `;
    const result = await db.query(query, [
        data.name, data.course, data.batch, data.subject, data.teacher,
        data.date, data.total, data.pass, data.status, data.syllabus, id
    ]);
    return result.rows[0];
};

module.exports = { getAllExams, createExam, updateExam };