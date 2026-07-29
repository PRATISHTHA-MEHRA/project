const Attendance = require("../../../models/attendanceModel");
const db = require("../../../config/db");

// Extract teacher ID from JWT token payload
const getTeacherId = (req) => {
    if (!req.user) return null;
    return req.user.id || req.user.teacher_id || req.user.userId || null;
};

/**
 * GET /api/teacher/attendance/batches
 * Fetches batches specifically assigned to the logged-in teacher for dropdown
 */
exports.getTeacherBatches = async (req, res) => {
    try {
        const teacherId = getTeacherId(req);
        if (!teacherId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Teacher session missing" });
        }

        const query = `
            SELECT id::TEXT, batch_name AS name 
            FROM batches 
            WHERE teacher_id = $1 AND status = 'Active'
            ORDER BY batch_name ASC;
        `;
        const result = await db.query(query, [teacherId]);

        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/teacher/attendance/students?batch=BatchName&date=YYYY-MM-DD
 * Returns students in the batch and their existing attendance status for the selected date
 */
exports.getBatchStudentsWithAttendance = async (req, res) => {
    try {
        const { batch, date } = req.query;
        if (!batch) {
            return res.status(400).json({ success: false, message: "Batch query parameter is required." });
        }

        const targetDate = date || new Date().toISOString().split('T')[0];

        // Fetch students and check if attendance has already been logged for the date
        const query = `
            SELECT 
                s.id::TEXT AS id, 
                s.student_name AS name, 
                s.class_name AS cls,
                al.status AS existing_status
            FROM students s
            JOIN batches b ON s.batch_id = b.id
            LEFT JOIN attendance_logs al 
                   ON s.id::TEXT = al.student_id 
                  AND al.attendance_date = $2::DATE
            WHERE b.batch_name = $1 
            ORDER BY s.student_name ASC;
        `;
        const result = await db.query(query, [batch, targetDate]);

        // Check if attendance is already locked/submitted for this batch on this date
        const isLocked = result.rows.some(r => r.existing_status !== null);

        res.status(200).json({
            success: true,
            date: targetDate,
            isLocked: isLocked,
            students: result.rows.map(r => ({
                id: r.id,
                name: r.name,
                cls: r.cls || 'N/A',
                status: r.existing_status || 'Present' // Default to Present if not logged yet
            }))
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/teacher/attendance
 * Saves bulk attendance logs submitted by the teacher
 */
exports.submitTeacherAttendance = async (req, res) => {
    try {
        const { batch, date, marks } = req.body;
        // Expects marks as an object map: {"STU-1001": "Present", "STU-1002": "Absent"}

        if (!batch || !date || !marks || Object.keys(marks).length === 0) {
            return res.status(400).json({ success: false, message: "Batch, date, and student marks are required." });
        }

        const records = Object.keys(marks).map(studentId => ({
            student_id: studentId,
            batch_name: batch,
            attendance_date: date,
            status: marks[studentId]
        }));

        await Attendance.saveBulkAttendance(records);

        res.status(200).json({
            success: true,
            message: `Attendance submitted and locked for ${records.length} students`
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/teacher/attendance/history?batch=BatchName
 * Returns historic attendance logs for the "Previous Attendance" modal
 */
exports.getBatchAttendanceHistory = async (req, res) => {
    try {
        const { batch } = req.query;
        if (!batch) {
            return res.status(400).json({ success: false, message: "Batch name is required." });
        }

        const query = `
            SELECT 
                TO_CHAR(attendance_date, 'DD Mon YYYY') as date,
                SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END)::INT as present,
                SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END)::INT as absent,
                SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END)::INT as late,
                SUM(CASE WHEN status = 'Leave' THEN 1 ELSE 0 END)::INT as leave,
                COUNT(*)::INT as total,
                ROUND((SUM(CASE WHEN status IN ('Present', 'Late') THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC) * 100)::INT as pct
            FROM attendance_logs
            WHERE batch_name = $1
            GROUP BY attendance_date
            ORDER BY attendance_date DESC
            LIMIT 15;
        `;
        const result = await db.query(query, [batch]);

        res.status(200).json({ success: true, history: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};