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

// Reconciles student_pending_fees after a fee receipt is collected.
// receipt: { studentId, studentName, batch, feeType, period, balance }
const syncPendingBalance = async (receipt) => {
    const existing = await db.query(
        `SELECT id FROM student_pending_fees
         WHERE student_id = $1 AND fee_type = $2 AND billing_period = $3
         LIMIT 1`,
        [receipt.studentId, receipt.feeType, receipt.period]
    );

    if (existing.rows.length > 0) {
        // Update the existing pending record to reflect what's actually still owed.
        // A balance of 0 naturally drops out of getPendingFeesList's WHERE due_amount > 0 filter,
        // so no separate "mark as resolved" step is needed.
        await db.query(
            `UPDATE student_pending_fees SET due_amount = $1 WHERE id = $2`,
            [receipt.balance, existing.rows[0].id]
        );
        return;
    }

    if (receipt.balance > 0) {
        // No prior pending record for this student/fee/period, but this payment fell short —
        // create one so the shortfall shows up in Pending Fees.
        const parentRes = await db.query(
            `SELECT parent_mobile FROM students WHERE student_code = $1 LIMIT 1`,
            [receipt.studentId]
        );
        const parentMobile = parentRes.rows[0]?.parent_mobile || null;

        const countRes = await db.query("SELECT COUNT(*) FROM student_pending_fees");
        const nextId = `FEE-${4001 + parseInt(countRes.rows[0].count)}`;

        await db.query(
            `INSERT INTO student_pending_fees
                (id, student_id, student_name, parent_mobile, batch_name, fee_type, billing_period, due_amount, due_date, follow_up_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, 'Not Contacted')`,
            [nextId, receipt.studentId, receipt.studentName, parentMobile, receipt.batch, receipt.feeType, receipt.period, receipt.balance]
        );
    }
};

module.exports = { getPendingFeesList, saveCallNoteTransaction, syncPendingBalance };