const db = require("../config/db");

const getMarksWithRankings = async () => {
    const query = `
        SELECT 
            student_name as "student",
            exam_name as "exam",
            exam_id as "examId",
            batch_name as "batch",
            subject_name as "subject",
            marks_obtained as "obtained",
            total_marks as "total",
            remarks,
            grade,
            DENSE_RANK() OVER (
                PARTITION BY exam_id 
                ORDER BY marks_obtained DESC
            )::INT as "rank"
        FROM student_marks
        ORDER BY exam_id ASC, "rank" ASC;
    `;
    const result = await db.query(query);
    return result.rows;
};

const getMarksByStudentId = async (studentId, studentCode) => {
    const query = `
        SELECT
            exam_name as "exam",
            exam_id as "examId",
            subject_name as "subject",
            marks_obtained as "obtained",
            total_marks as "total",
            remarks,
            grade
        FROM student_marks
        WHERE TRIM(LOWER(student_id)) = TRIM(LOWER($1))
           OR TRIM(LOWER(student_id)) = TRIM(LOWER($2))
        ORDER BY created_at DESC;
    `;
    const result = await db.query(query, [String(studentId), studentCode || '']);
    return result.rows;
};

const saveBulkMarks = async (records) => {
    const client = await db.connect();
    try {
        await client.query("BEGIN");

        const query = `
            INSERT INTO student_marks (
                exam_id, exam_name, batch_name, subject_name, 
                student_id, student_name, marks_obtained, total_marks, grade, remarks
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (exam_id, student_id) 
            DO UPDATE SET 
                marks_obtained = EXCLUDED.marks_obtained,
                grade = EXCLUDED.grade,
                remarks = EXCLUDED.remarks,
                created_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;

        const saved = [];
        for (const record of records) {
            const values = [
                record.examId, record.examName, record.batch, record.subject,
                record.studentId, record.studentName, record.obtained, 
                record.total, record.grade, record.remarks
            ];
            const res = await client.query(query, values);
            saved.push(res.rows[0]);
        }

        await client.query("COMMIT");
        return saved;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

module.exports = { getMarksWithRankings, getMarksByStudentId, saveBulkMarks };
