const db = require("../config/db");

const getMasterSchedules = async () => {
    const query = `
        SELECT 
            id::TEXT,
            batch_name as "batch",
            subject_name as "subject",
            teacher_name as "teacher",
            room_name as "room",
            TO_CHAR(start_time, 'HH24:MI') as "st",
            TO_CHAR(end_time, 'HH24:MI') as "et",
            student_count as "students",
            schedule_days as "days",
            status
        FROM timetable_slots
        ORDER BY start_time ASC;
    `;
    const result = await db.query(query);
    return result.rows;
};

const updateSlotStatus = async (id, status) => {
    const query = `
        UPDATE timetable_slots 
        SET status = $1 
        WHERE id = $2 
        RETURNING id, status;
    `;
    const result = await db.query(query, [status, id]);
    return result.rows[0];
};

module.exports = {
    getMasterSchedules,
    updateSlotStatus
};