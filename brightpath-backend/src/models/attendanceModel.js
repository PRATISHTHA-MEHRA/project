const db = require("../config/db");

const getAggregatedSummary = async (selectedDate) => {
    const query = `
        SELECT 
            s.id,
            s.student_name AS name,
            COALESCE(b.batch_name, 'No Batch') AS batch, -- Joined from the batches table
            s.class_name AS cls,                         -- Matches class_name from your schema
            COALESCE(SUM(CASE WHEN al.status = 'Present' THEN 1 ELSE 0 END), 0)::INT as present,
            COALESCE(SUM(CASE WHEN al.status = 'Absent' THEN 1 ELSE 0 END), 0)::INT as absent,
            COALESCE(SUM(CASE WHEN al.status = 'Late' THEN 1 ELSE 0 END), 0)::INT as late,
            COALESCE(SUM(CASE WHEN al.status = 'Leave' THEN 1 ELSE 0 END), 0)::INT as leave,
            CASE 
                WHEN COUNT(al.id) = 0 THEN 100
                ELSE ROUND((SUM(CASE WHEN al.status IN ('Present', 'Late') THEN 1 ELSE 0 END)::NUMERIC / COUNT(al.id)::NUMERIC) * 100)
            END::INT as pct,
            (
                -- Status for the specific date the admin has selected in the UI,
                -- NOT just whichever log happens to be most recent overall.
                SELECT status FROM attendance_logs
                WHERE student_id = s.id::TEXT
                AND attendance_date = $1::DATE
                ORDER BY id DESC LIMIT 1
            ) as day_status
        FROM students s
        LEFT JOIN batches b ON s.batch_id = b.id     -- Resolves s.batch_name does not exist error
        LEFT JOIN attendance_logs al ON s.id::TEXT = al.student_id 
        GROUP BY s.id, s.student_name, b.batch_name, s.class_name
        ORDER BY s.id ASC;
    `;
    const result = await db.query(query, [selectedDate]);
    return result.rows;
};

// Fetches card metric counters for the current day
const getDailyKPIs = async (targetDate) => {
    const query = `
        SELECT
            ROUND((SUM(CASE WHEN status IN ('Present', 'Late') THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC) * 100) as overall_pct,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END)::INT as present_today,
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END)::INT as absent_today,
            SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END)::INT as late_today
        FROM attendance_logs
        WHERE attendance_date = $1;
    `;
    const result = await db.query(query, [targetDate]);
    return result.rows[0];
};

// Fetches full historic rows for a single specific student
const getRecentLogsByStudent = async (studentId) => {
    const result = await db.query(
        "SELECT attendance_date, batch_name, status FROM attendance_logs WHERE student_id = $1 ORDER BY attendance_date DESC LIMIT 10",
        [studentId]
    );
    return result.rows;
};

// Saves bulk array logs (Upsert logic to allow correction changes)
const saveBulkAttendance = async (records) => {
    const query = `
        INSERT INTO attendance_logs (student_id, batch_name, attendance_date, status)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (student_id, attendance_date) 
        DO UPDATE SET status = EXCLUDED.status, batch_name = EXCLUDED.batch_name;
    `;
    
    for (const record of records) {
        await db.query(query, [record.student_id, record.batch_name, record.attendance_date, record.status]);
    }
};

module.exports = { getAggregatedSummary, getDailyKPIs, getRecentLogsByStudent, saveBulkAttendance };