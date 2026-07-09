const db = require("../config/db");

const getPendingFeesList = async () => {
    const query = `
        SELECT 
            id,
            student_id as "studentId",
            student_name as "student",
            parent_mobile as "parentMobile",
            batch_name as "batch",
            fee_type as "feeType",
            billing_period as "period",
            due_amount::FLOAT as "due",
            TO_CHAR(due_date, 'YYYY-MM-DD') as "dueDate",
            (CURRENT_DATE - due_date)::INT as "overdue",
            follow_up_status as "follow",
            COALESCE(TO_CHAR(promise_date, 'YYYY-MM-DD'), '—') as "promise",
            COALESCE(TO_CHAR(last_reminder_date, 'YYYY-MM-DD'), '—') as "lastReminder"
        FROM student_pending_fees
        WHERE due_amount > 0
        ORDER BY due_date ASC;
    `;
    const result = await db.query(query);
    return result.rows;
};

const saveCallNoteTransaction = async (feeId, data) => {
    const client = await db.connect();
    try {
        await client.query("BEGIN");

        // 1. Insert history timeline row
        const noteQuery = `
            INSERT INTO fee_call_notes (fee_id, follow_up_status, promise_date, note_text)
            VALUES ($1, $2, $3, $4);
        `;
        await client.query(noteQuery, [feeId, data.status, data.promiseDate || null, data.note]);

        // 2. Update parent balance pointer states
        const updateQuery = `
            UPDATE student_pending_fees
            SET follow_up_status = $1,
                promise_date = $2,
                last_reminder_date = CURRENT_DATE
            WHERE id = $3
            RETURNING id;
        `;
        const res = await client.query(updateQuery, [data.status, data.promiseDate || null, feeId]);

        await client.query("COMMIT");
        return res.rows[0];
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

module.exports = { getPendingFeesList, saveCallNoteTransaction };