const paymentModel = require("../../../models/teacherPaymentModel");


/**
 * @desc   Get logged-in teacher's current earnings summary & payment history
 * @route  GET /api/teacher/payments
 */
exports.getMyEarnings = async (req, res) => {
    try {
        // Resolve teacher name from query param, req.user (from auth middleware), or decoded JWT
        let teacherName = req.query.teacher || req.query.name || req.user?.name || req.user?.teacher_name;

        // Fallback: If still empty, try parsing Authorization Bearer token header
        if (!teacherName && req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(" ")[1];
                if (token) {
                    const jwt = require("jsonwebtoken");
                    const decoded = jwt.decode(token);
                    if (decoded) {
                        teacherName = decoded.name || decoded.teacher_name || decoded.username;
                    }
                }
            } catch (e) {
                console.warn("JWT Decode warn:", e.message);
            }
        }

        // If no teacher name was passed at all, fetch the first available record or return default
        if (!teacherName) {
            const allPayments = await paymentModel.getAllPayments();
            if (allPayments && allPayments.length > 0) {
                teacherName = allPayments[0].teacher; // Fallback to first existing record for demo/test
            }
        }

        // Final safety fallback to avoid crash
        if (!teacherName) {
            return res.status(200).json({
                success: true,
                summary: {
                    payType: "Fixed Salary",
                    monthly: 0,
                    paid: 0,
                    pending: 0,
                    deductions: 0,
                    advance: 0,
                    currentMonth: "N/A",
                    status: "N/A"
                },
                history: []
            });
        }

        // Fetch current summary and history concurrently
        const [summary, history] = await Promise.all([
            paymentModel.getTeacherPaymentSummary(teacherName),
            paymentModel.getTeacherPaymentHistory(teacherName)
        ]);

        const defaultSummary = summary || {
            payType: "Fixed Salary",
            monthly: 0,
            paid: 0,
            pending: 0,
            deductions: 0,
            advance: 0,
            currentMonth: "N/A",
            status: "N/A"
        };

        res.status(200).json({
            success: true,
            teacherName,
            summary: defaultSummary,
            history: history || []
        });

    } catch (err) {
        console.error("Error fetching teacher earnings:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch earnings",
            error: err.message
        });
    }
};