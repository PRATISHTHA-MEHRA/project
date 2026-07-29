const db = require("../../../config/db");
const examModel = require("../../../models/examModel");
const marksModel = require("../../../models/marksModel");

/**
 * @desc    Fetch all tests/exams (filtered optionally by teacher)
 * @route   GET /api/teacher/tests
 */
exports.getAllTests = async (req, res) => {
    try {
        const teacherName = req.query.teacher || req.user?.name;

        let query = `
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
        `;
        const params = [];

        if (teacherName) {
            query += ` WHERE teacher_name = $1`;
            params.push(teacherName);
        }

        query += ` ORDER BY created_at DESC;`;

        const result = await db.query(query, params);
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Error fetching tests:", err);
        res.status(500).json({ success: false, message: "Error fetching tests", error: err.message });
    }
};

/**
 * @desc    Create a new exam/test
 * @route   POST /api/teacher/tests
 */
exports.createTest = async (req, res) => {
    try {
        const { name, batch, course, subject, teacher, date, total, pass, status, syllabus } = req.body;

        if (!name || !batch) {
            return res.status(400).json({ success: false, message: "Test name and batch are required." });
        }

        const createdTest = await examModel.createExam({
            name,
            course: course || "General",
            batch,
            subject: subject || "Mathematics",
            teacher: teacher || req.user?.name || "Teacher",
            date,
            total: total ? Number(total) : 50,
            pass: pass ? Number(pass) : 18,
            status: status || "Scheduled",
            syllabus: syllabus || null
        });

        res.status(201).json({ success: true, message: "Test created successfully", data: createdTest });
    } catch (err) {
        console.error("Error creating test:", err);
        res.status(500).json({ success: false, message: "Error creating test", error: err.message });
    }
};

/**
 * @desc    Get all students in a batch for the 'Enter Marks' modal
 * @route   GET /api/teacher/tests/:id/students
 */
exports.getTestBatchStudents = async (req, res) => {
    try {
        const { id } = req.params;

        const exam = await examModel.getExamById(id);
        if (!exam) {
            return res.status(404).json({ success: false, message: "Exam not found" });
        }

        // Support both batch_id and batch/batch_name from exam object
        const batchIdentifier = exam.batch_id || exam.batch || exam.batch_name;

        // FIXED: Using s.batch_id in the WHERE clause
        const query = `
            SELECT 
                s.id::TEXT AS "studentId",
                s.student_name AS "studentName",
                m.marks_obtained AS "obtained",
                m.grade,
                m.remarks
            FROM students s
            LEFT JOIN student_marks m 
                   ON m.student_id::TEXT = s.id::TEXT 
                  AND m.exam_id::TEXT = $1::TEXT
            WHERE s.batch_id::TEXT = $2::TEXT
            ORDER BY s.student_name ASC;
        `;

        const result = await db.query(query, [String(id), String(batchIdentifier)]);

        res.status(200).json({
            success: true,
            exam,
            students: result.rows
        });
    } catch (err) {
        console.error("Error fetching batch students:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error loading batch students", 
            error: err.message 
        });
    }
};
/**
 * @desc    Get ranked marks list for all students
 * @route   GET /api/teacher/marks
 */
exports.getAllMarksWithRankings = async (req, res) => {
    try {
        const marks = await marksModel.getMarksWithRankings();
        res.status(200).json({ success: true, data: marks });
    } catch (err) {
        console.error("Error fetching ranked marks:", err);
        res.status(500).json({ success: false, message: "Error fetching marks", error: err.message });
    }
};

/**
 * @desc    Save student marks in bulk and optionally update exam status to 'Result Published'
 * @route   POST /api/teacher/marks/bulk
 */
exports.submitBulkMarks = async (req, res) => {
    try {
        const { examId, records, publish } = req.body;

        if (!examId || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ success: false, message: "Exam ID and records array are required." });
        }

        // Delegate bulk insert/update transaction to marksModel
        const savedMarks = await marksModel.saveBulkMarks(records);

        // If 'Save & Publish' was clicked, update the exam status
        if (publish) {
            await db.query(
                `UPDATE assessments_exams SET status = 'Result Published', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [examId]
            );
        }

        res.status(200).json({
            success: true,
            message: publish ? "Marks saved & result published!" : "Marks saved successfully",
            data: savedMarks
        });
    } catch (err) {
        console.error("Error saving bulk marks:", err);
        res.status(500).json({ success: false, message: "Error saving marks", error: err.message });
    }
};