const db = require("../config/db");

const saveCollectionReceipt = async (data) => {
    const countRes = await db.query("SELECT COUNT(*) FROM fee_receipts");
    const nextId = `RCP-${24001 + parseInt(countRes.rows[0].count)}`;

    const query = `
        INSERT INTO fee_receipts (
            id, student_id, student_name, batch_name, fee_type, period, 
            due_amount, discount, fine, paid_amount, payment_mode, 
            transaction_id, collected_by, payment_date, balance, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *;
    `;
    
    const values = [
        nextId,             // $1
        data.studentId,     // $2
        data.studentName,   // $3 (Received cleanly from controller mapping)
        data.batch,         // $4
        data.feeType,       // $5
        data.period,        // $6
        data.due,           // $7
        data.discount,      // $8
        data.fine,          // $9
        data.paid,          // $10
        data.mode,          // $11
        data.txn,           // $12
        data.collectedBy,   // $13 (Will capture your string completely)
        data.date,          // $14
        data.balance,       // $15
        data.remarks        // $16
    ];

    const result = await db.query(query, values);
    return result.rows[0];
};

// 1. Ensure this function name matches exactly
const getFinanceKPIs = async (targetDate) => {
    const query = `
        SELECT 
            COALESCE(SUM(CASE WHEN payment_date = $1 THEN paid_amount ELSE 0 END), 0)::NUMERIC as today_total,
            COALESCE(SUM(CASE WHEN DATE_TRUNC('month', payment_date) = DATE_TRUNC('month', $1::DATE) THEN paid_amount ELSE 0 END), 0)::NUMERIC as month_total,
            COUNT(id)::INT as receipt_count,
            COALESCE(SUM(discount), 0)::NUMERIC as discount_total
        FROM fee_receipts;
    `;
    const result = await db.query(query, [targetDate]);
    return result.rows[0];
};

// 2. Ensure this function is present
const getAllReceipts = async () => {
    const query = `
        SELECT 
            id, student_name as student, id as "studentId", batch_name as batch, 
            fee_type as "feeType", period, due_amount::FLOAT as due, 
            discount::FLOAT as discount, fine::FLOAT as fine, paid_amount::FLOAT as paid, 
            payment_mode as mode, payment_date::TEXT as date, transaction_id as txn,
            collected_by as "collectedBy", balance::FLOAT as balance, remarks
        FROM fee_receipts 
        ORDER BY created_at DESC;
    `;
    const result = await db.query(query);
    return result.rows;
};

// CRITICAL: This exact block must export all three methods explicitly
module.exports = { 
    getFinanceKPIs, 
    getAllReceipts, 
    saveCollectionReceipt 
};
