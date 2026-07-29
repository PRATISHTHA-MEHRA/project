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

const getSchedulesByTeacherId = async (teacherId) => {
    const query = `
        SELECT
            b.id::TEXT,
            b.batch_name AS "batch",
            COALESCE(NULLIF(b.subject, ''), c.course_name, '') AS "subject",
            COALESCE(b.classroom, 'TBD') AS "room",
            TO_CHAR(b.start_time, 'HH24:MI') AS "st",
            TO_CHAR(b.end_time, 'HH24:MI') AS "et",
            CONCAT(TO_CHAR(b.start_time, 'HH12:MI AM'), ' - ', TO_CHAR(b.end_time, 'HH12:MI AM')) AS "timing",
            b.batch_name AS "name",
            COALESCE(b.current_students, 0) AS "students",
            b.days AS "days",
            'Scheduled'::TEXT AS "status"
        FROM batches b
        LEFT JOIN courses c ON b.course_id = c.id
        WHERE b.teacher_id = $1
          AND b.status = 'Active'
          AND b.start_time IS NOT NULL
          AND b.end_time IS NOT NULL
          AND b.days IS NOT NULL AND b.days <> ''
        ORDER BY b.start_time ASC;
    `;
    const result = await db.query(query, [teacherId]);
    return result.rows;
};


module.exports = {
    getMasterSchedules,
    getSchedulesByTeacherId
};