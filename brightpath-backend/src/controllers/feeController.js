const Fee = require("../models/feeModel");
const PendingFee = require("../models/pendingfeeModel");

const sendFeeError = (res, err) => {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    console.error("Fee request failed:", err);
    return res.status(500).json({ success: false, message: "Unable to process the fee collection." });
};

const validateCollection = body => {
    const required = ["studentId", "student", "feeType", "period", "mode", "date"];
    const missing = required.find(key => !String(body?.[key] ?? "").trim());
    if (missing) {
        const err = new Error(`${missing} is required.`);
        err.status = 400;
        throw err;
    }
    const values = ["due", "discount", "fine", "paid"].reduce((result, key) => ({ ...result, [key]: Number(body[key]) }), {});
    if (Object.values(values).some(value => !Number.isFinite(value) || value < 0)) {
        const err = new Error("Fee amounts must be valid non-negative numbers.");
        err.status = 400;
        throw err;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date) || Number.isNaN(Date.parse(`${body.date}T00:00:00Z`))) {
        const err = new Error("Payment date must be a valid date.");
        err.status = 400;
        throw err;
    }
    return { ...body, ...values, balance: Math.max(0, values.due - values.discount + values.fine - values.paid) };
};

// 1. MAKE SURE THIS IS EXPORTED PROPERLY
exports.getFeeDashboard = async (req, res) => {
    try {
        const todayDate = req.query.date || "2026-06-07"; 
        
        // Ensure these methods match your feeModel.js exports
        const kpis = await Fee.getFinanceKPIs(todayDate);
        const receipts = await Fee.getAllReceipts();

        res.status(200).json({
            success: true,
            metrics: {
                todaysCollection: parseFloat(kpis.today_total || 0),
                thisMonth: parseFloat(kpis.month_total || 0),
                receiptsIssued: parseInt(kpis.receipt_count || 0),
                discountsGiven: parseFloat(kpis.discount_total || 0)
            },
            feesList: receipts
        });
    } catch (err) {
        sendFeeError(res, err);
    }
};

// 2. YOUR EXISTING COLLECT FEES LOGIC
exports.collectFees = async (req, res) => {
    try {
        const validated = validateCollection(req.body);
        const {
            studentId, 
            student, 
            batch, 
            feeType, 
            period, 
            due, 
            discount, 
            fine, 
            paid, 
            mode, 
            txn, 
            collectedBy, 
            date, 
            balance, 
            remarks 
        } = validated;

        const newReceipt = await Fee.saveCollectionReceipt({
            studentId,
            studentName: student, 
            batch,
            feeType,
            period,
            due,
            discount,
            fine,
            paid,
            mode,
            txn,
            collectedBy, 
            date,
            balance,
            remarks
        });

      
        try {
            await PendingFee.syncPendingBalance({
                studentId,
                studentName: student,
                batch,
                feeType,
                period,
                balance
            });
        } catch (syncErr) {
            console.error("Pending-fee sync failed for receipt", newReceipt?.id, ":", syncErr.message);
        }
        
        res.status(201).json({ 
            success: true, 
            data: newReceipt 
        });
    } catch (err) {
        sendFeeError(res, err);
    }
};
