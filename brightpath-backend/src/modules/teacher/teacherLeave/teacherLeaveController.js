const leaveModel = require("../../../models/teacherLeaveModel");

const getTeacherIdentity = (req) => {
    let teacherId = req.user?.id || req.user?.teacher_id || null;
    let teacherName = req.query.teacher || req.query.name || req.user?.name;

    if (req.headers.authorization) {
        try {
            const token = req.headers.authorization.split(" ")[1];
            if (token) {
                const jwt = require("jsonwebtoken");
                const decoded = jwt.decode(token);
                if (decoded) {
                    teacherId = teacherId || decoded.id || decoded.teacher_id;
                    teacherName = teacherName || decoded.name || decoded.teacher_name;
                }
            }
        } catch (e) {}
    }

    return { 
        teacherId, 
        teacherName: teacherName || "Rahul Sharma" 
    };
};

exports.getLeaves = async (req, res) => {
    try {
        const { teacherId, teacherName } = getTeacherIdentity(req);

        const [stats, leaves] = await Promise.all([
            leaveModel.getStats(teacherId, teacherName),
            leaveModel.getByTeacher(teacherId, teacherName)
        ]);

        res.status(200).json({
            success: true,
            stats: {
                pending: parseInt(stats.pending) || 0,
                approved: parseInt(stats.approved) || 0,
                rejected: parseInt(stats.rejected) || 0,
                leavesTakenYTD: parseInt(stats.leaves_taken_ytd) || 0
            },
            leaves: leaves || []
        });
    } catch (err) {
        console.error("Error fetching leaves:", err);
        res.status(500).json({ success: false, message: "Failed to fetch leave data", error: err.message });
    }
};
// POST /api/teacher/leaves - Apply for a new leave / mark unavailable (Auto-Approved)
exports.applyLeave = async (req, res) => {
    try {
        const { teacherId, teacherName } = getTeacherIdentity(req);
        const { type, from, to, reason } = req.body;

        if (!type || !from || !to) {
            return res.status(400).json({ success: false, message: "Type, From Date, and To Date are required" });
        }

        const newLeave = await leaveModel.create({
            teacher_id: teacherId,
            teacher_name: teacherName,
            type,
            from,
            to,
            reason: reason || "",
            status: "Approved", // Bypasses pending approval
            admin_remark: "Auto-approved by system"
        });

        res.status(201).json({
            success: true,
            message: "Leave applied and approved successfully",
            data: newLeave
        });
    } catch (err) {
        console.error("Error applying leave:", err);
        res.status(500).json({ success: false, message: "Failed to submit leave request", error: err.message });
    }
};
// PUT /api/teacher/leaves/:id - Edit an existing pending leave request
exports.updateLeave = async (req, res) => {
    try {
        const leaveCode = req.params.id;
        const { type, from, to, reason } = req.body;

        const updated = await leaveModel.update(leaveCode, { type, from, to, reason });

        if (!updated) {
            return res.status(400).json({ success: false, message: "Cannot edit leave request. It may already be approved or rejected." });
        }

        res.status(200).json({
            success: true,
            message: "Leave request updated successfully",
            data: updated
        });
    } catch (err) {
        console.error("Error updating leave:", err);
        res.status(500).json({ success: false, message: "Failed to update leave request", error: err.message });
    }
};