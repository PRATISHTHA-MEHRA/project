const TeacherPayment = require("../../../models/teacherPaymentModel");
const Teacher = require("../../../models/teacherModel");

exports.getPaymentDashboard = async (req, res) => {
    try {
        const targetMonth = req.query.month || "May 2026";
        const kpis = await TeacherPayment.getPaymentKPIs(targetMonth);
        const paymentsList = await TeacherPayment.getAllPayments();

        const allTeachers = await Teacher.getAll();
        const teacherOptions = (Array.isArray(allTeachers) ? allTeachers : [])
            .filter(t => t.status === "Active")
            .map(t => ({ 
                id: t.id, 
                name: t.teacher_name || t.name,
                payType: t.payment_type || 'Fixed Monthly Salary',
                rate: parseFloat(t.pay_rate || 0),
                fixedSalary: parseFloat(t.fixed_salary || 0)
            }));

        res.status(200).json({
            success: true,
            metrics: {
                totNet: parseFloat(kpis.tot_net || 0),
                totPaid: parseFloat(kpis.tot_paid || 0),
                totBal: parseFloat(kpis.tot_bal || 0),
                pendingTeachers: parseInt(kpis.pending_count || 0, 10)
            },
            payments: paymentsList,
            teachers: teacherOptions
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
        if (!original) {
            return res.status(404).json({ success: false, message: "Record not found." });
        }

        const totalPaidNow = parseFloat(paidAmount || 0);
        const netPayable = parseFloat(original.net || 0);
        const updatedBalance = netPayable - totalPaidNow;

        let targetStatus = 'Partially Paid';
        if (updatedBalance <= 0) targetStatus = 'Paid';
        if (totalPaidNow === 0) targetStatus = 'Pending';

        const updated = await TeacherPayment.recordTransaction(id, {
            paid: totalPaidNow,
            balance: updatedBalance < 0 ? 0 : updatedBalance,
            status: targetStatus, 
            mode: mode || 'Bank Transfer', 
            txn: txn || '', 
            date: date || new Date().toISOString().split('T')[0], 
            voucher: voucher || '', 
            remarks: remarks || ''
        });

        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getPaymentPreview = async (req, res) => {
    try {
        const { teacherId, month } = req.query;
        if (!teacherId) return res.status(400).json({ success: false, message: 'Select a teacher first.' });
        const preview = await TeacherPayment.getPaymentPreview(teacherId, month || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));
        if (!preview) return res.status(404).json({ success: false, message: 'Teacher not found.' });
        res.status(200).json({ success: true, data: preview });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.addNewVoucher = async (req, res) => {
    try {
        const { teacherId, month, paid, mode, date, voucher, txn, remarks } = req.body;

        const allTeachers = await Teacher.getAll();
        const validTeacher = (Array.isArray(allTeachers) ? allTeachers : []).find(t => String(t.id) === String(teacherId));

        if (!validTeacher) {
            return res.status(400).json({ 
                success: false, 
                message: "Selected teacher was not found in Teacher records." 
            });
        }

        const preview = await TeacherPayment.getPaymentPreview(validTeacher.id, month || "May 2026");
        const grossAmt = preview.gross;
        const paidAmt = parseFloat(paid || 0);
        const balanceAmt = grossAmt - paidAmt;

        let targetStatus = 'Partially Paid';
        if (balanceAmt <= 0) targetStatus = 'Paid';
        if (paidAmt === 0) targetStatus = 'Pending';

        const newVoucher = await TeacherPayment.createPaymentVoucher({
            teacher: preview.teacher,
            month: month || "May 2026", 
            payType: preview.payType,
            classesAssigned: preview.classesAssigned,
            classesTaken: preview.classesTaken,
            hoursTaken: preview.hoursTaken,
            rateUsed: preview.rate,
            gross: grossAmt, 
            net: grossAmt, 
            paid: paidAmt,
            balance: balanceAmt < 0 ? 0 : balanceAmt, 
            status: targetStatus, 
            mode: mode || 'UPI', 
            date: date || new Date().toISOString().split('T')[0], 
            voucher: voucher || '', 
            txn: txn || '', 
            remarks: remarks || ''
        });

        res.status(201).json({ success: true, data: newVoucher });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
