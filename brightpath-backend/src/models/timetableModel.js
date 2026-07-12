const db = require("../config/db");


const getMasterSchedules = async () => {
    const query = `
        SELECT
            b.id::TEXT,
            b.batch_name as "batch",
            COALESCE(NULLIF(b.subject, ''), c.course_name, '') as "subject",
            COALESCE(t.teacher_name, 'Unassigned') as "teacher",
            COALESCE(b.classroom, 'TBD') as "room",
            TO_CHAR(b.start_time, 'HH24:MI') as "st",
            TO_CHAR(b.end_time, 'HH24:MI') as "et",
            b.current_students as "students",
            b.days as "days",
            'Scheduled'::TEXT as "status"
        FROM batches b
        LEFT JOIN courses c ON b.course_id = c.id
        LEFT JOIN teachers t ON b.teacher_id = t.id
        WHERE b.status = 'Active'
          AND b.start_time IS NOT NULL
          AND b.end_time IS NOT NULL
          AND b.days IS NOT NULL AND b.days <> ''
        ORDER BY b.start_time ASC;
    `;
    const result = await db.query(query);
    return result.rows;
};

module.exports = {
    getMasterSchedules
};