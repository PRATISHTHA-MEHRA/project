const Fee = require("../models/feeModel");
const PendingFee = require("../models/pendingfeeModel");

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
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. YOUR EXISTING COLLECT FEES LOGIC
exports.collectFees = async (req, res) => {
    try {
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
        } = req.body;

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

        // Keep the Pending Fees list in sync with what this receipt actually settled.
        // A failure here shouldn't fail the receipt itself — the payment was already recorded —
        // so it's logged rather than thrown.
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
        res.status(500).json({ success: false, message: err.message });
    }
};