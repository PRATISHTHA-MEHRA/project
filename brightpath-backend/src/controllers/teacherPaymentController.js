const TeacherPayment = require("../models/teacherPaymentModel");

exports.getPaymentDashboard = async (req, res) => {
    try {
        const targetMonth = req.query.month || "May 2026";
        const kpis = await TeacherPayment.getPaymentKPIs(targetMonth);
        const paymentsList = await TeacherPayment.getAllPayments();

        res.status(200).json({
            success: true,
            metrics: {
                totNet: parseFloat(kpis.tot_net || 0),
                totPaid: parseFloat(kpis.tot_paid || 0),
                totBal: parseFloat(kpis.tot_bal || 0),
                pendingTeachers: parseInt(kpis.pending_count || 0)
            },
            payments: paymentsList
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updatePaymentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { paidAmount, mode, txn, date, voucher, remarks } = req.body;

        const original = await TeacherPayment.getPaymentById(id);
        if (!original) return res.status(404).json({ success: false, message: "Record not found." });

        const totalPaidNow = parseFloat(paidAmount);
        const netPayable = parseFloat(original.net);
        const updatedBalance = netPayable - totalPaidNow;
        
        let targetStatus = 'Partially Paid';
        if (updatedBalance <= 0) targetStatus = 'Paid';
        if (totalPaidNow === 0) targetStatus = 'Pending';

        const updated = await TeacherPayment.recordTransaction(id, {
            paid: totalPaidNow,
            balance: updatedBalance < 0 ? 0 : updatedBalance,
            status: targetStatus, mode, txn, date, voucher, remarks
        });

        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.addNewVoucher = async (req, res) => {
    try {
        const { teacher, month, gross, paid, mode, date, voucher, txn, remarks } = req.body;
        
        const grossAmt = parseFloat(gross || 0);
        const paidAmt = parseFloat(paid || 0);
        const balanceAmt = grossAmt - paidAmt;
        
        let targetStatus = 'Partially Paid';
        if (balanceAmt <= 0) targetStatus = 'Paid';
        if (paidAmt === 0) targetStatus = 'Pending';

        const newVoucher = await TeacherPayment.createPaymentVoucher({
            teacher, month, gross: grossAmt, net: grossAmt, paid: paidAmt,
            balance: balanceAmt, status: targetStatus, mode, date, voucher, txn, remarks
        });

        res.status(201).json({ success: true, data: newVoucher });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};