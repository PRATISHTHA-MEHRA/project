const db = require("../config/db");

const getPaymentKPIs = async (targetMonth = 'May 2026') => {
    const query = `
        SELECT 
            COALESCE(SUM(net_payable), 0)::NUMERIC as tot_net,
            COALESCE(SUM(paid_amount), 0)::NUMERIC as tot_paid,
            COALESCE(SUM(balance_due), 0)::NUMERIC as tot_bal,
            COUNT(CASE WHEN balance_due > 0 THEN 1 END)::INT as pending_count
        FROM teacher_payments
        WHERE payment_month = $1;
    `;
    const result = await db.query(query, [targetMonth]);
    return result.rows[0] || { tot_net: 0, tot_paid: 0, tot_bal: 0, pending_count: 0 };
};

const getAllPayments = async () => {
    const query = `
        SELECT 
            id, 
            teacher_name as "teacher", 
            payment_month as "month", 
            pay_type as "payType",
            COALESCE(classes_assigned, 0) as "assigned", 
            COALESCE(classes_taken, 0) as "taken", 
            COALESCE(classes_cancelled, 0) as "cancelled",
            COALESCE(student_count, 0) as "students", 
            COALESCE(batch_collection, 0) as "collection", 
            COALESCE(gross_amount, 0)::NUMERIC as "gross", 
            COALESCE(deductions, 0)::NUMERIC as "ded", 
            COALESCE(advance_paid, 0)::NUMERIC as "adv", 
            COALESCE(net_payable, 0)::NUMERIC as "net", 
            COALESCE(paid_amount, 0)::NUMERIC as "paid", 
            COALESCE(balance_due, 0)::NUMERIC as "balance", 
            status, 
            payment_mode as "mode", 
            transaction_id as "txn", 
            payment_date as "date", 
            voucher_number as "voucher", 
            remarks
        FROM teacher_payments 
        ORDER BY created_at DESC;
    `;
    const result = await db.query(query);
    return result.rows;
};

const getPaymentById = async (id) => {
    const query = `
        SELECT 
            id, 
            COALESCE(net_payable, 0)::NUMERIC as "net", 
            COALESCE(paid_amount, 0)::NUMERIC as "paid", 
            COALESCE(balance_due, 0)::NUMERIC as "balance"
        FROM teacher_payments 
        WHERE id = $1;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
};

const recordTransaction = async (id, data) => {
    const query = `
        UPDATE teacher_payments 
        SET paid_amount = $1, 
            balance_due = $2, 
            status = $3, 
            payment_mode = $4, 
            transaction_id = $5, 
            payment_date = $6, 
            voucher_number = $7, 
            remarks = $8
        WHERE id = $9 
        RETURNING *;
    `;
    const result = await db.query(query, [
        data.paid, 
        data.balance, 
        data.status, 
        data.mode, 
        data.txn, 
        data.date, 
        data.voucher, 
        data.remarks, 
        id
    ]);
    return result.rows[0];
};

const createPaymentVoucher = async (data) => {
    const countRes = await db.query("SELECT COUNT(*) FROM teacher_payments");
    const generatedId = `TCH-${1001 + parseInt(countRes.rows[0].count, 10)}`;

    const query = `
        INSERT INTO teacher_payments (
            id, teacher_name, payment_month, pay_type, gross_amount, net_payable, 
            paid_amount, balance_due, status, payment_mode, payment_date, voucher_number, transaction_id, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
        RETURNING *;
    `;
    const result = await db.query(query, [
        generatedId, 
        data.teacher, 
        data.month, 
        data.payType || 'Fixed Salary', 
        data.gross,
        data.net, 
        data.paid, 
        data.balance, 
        data.status, 
        data.mode, 
        data.date, 
        data.voucher, 
        data.txn, 
        data.remarks
    ]);
    return result.rows[0];
};

// Append these functions to models/paymentModel.js

/**
 * Get current active payment summary for a logged-in teacher
 */
const getTeacherPaymentSummary = async (teacherName) => {
    const query = `
        SELECT 
            pay_type AS "payType",
            COALESCE(gross_amount, 0)::NUMERIC AS "monthly",
            COALESCE(paid_amount, 0)::NUMERIC AS "paid",
            COALESCE(balance_due, 0)::NUMERIC AS "pending",
            COALESCE(deductions, 0)::NUMERIC AS "deductions",
            COALESCE(advance_paid, 0)::NUMERIC AS "advance",
            payment_month AS "currentMonth",
            status
        FROM teacher_payments
        WHERE teacher_name = $1
        ORDER BY created_at DESC
        LIMIT 1;
    `;
    const result = await db.query(query, [teacherName]);
    return result.rows[0] || null;
};

/**
 * Get full payment history for a specific logged-in teacher
 */
const getTeacherPaymentHistory = async (teacherName) => {
    const query = `
        SELECT 
            id,
            payment_month AS "month",
            pay_type AS "type",
            COALESCE(gross_amount, 0)::NUMERIC AS "gross",
            COALESCE(deductions, 0)::NUMERIC AS "ded",
            COALESCE(paid_amount, 0)::NUMERIC AS "paid",
            COALESCE(balance_due, 0)::NUMERIC AS "balance",
            TO_CHAR(payment_date, 'YYYY-MM-DD') AS "date",
            status
        FROM teacher_payments
        WHERE teacher_name = $1
        ORDER BY created_at DESC;
    `;
    const result = await db.query(query, [teacherName]);
    return result.rows;
};

module.exports = {
    getPaymentKPIs,
    getAllPayments,
    getPaymentById,
    recordTransaction,
    createPaymentVoucher,
    // Export new methods
    getTeacherPaymentSummary,
    getTeacherPaymentHistory
};