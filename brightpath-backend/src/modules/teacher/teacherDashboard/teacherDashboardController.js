const dashboardModel = require("../../../models/teacherDashboardModel");

/**
 * Extracts teacher identity from Auth Middleware / Query Params
 */
const getTeacherIdentity = (req) => {
    let teacherId = req.user?.id || req.user?.teacher_id || null;
    let teacherName = req.user?.teacher_name || req.user?.name || req.query.teacher || null;

    if (req.headers.authorization && !teacherId) {
        try {
            const token = req.headers.authorization.split(" ")[1];
            if (token) {
                const jwt = require("jsonwebtoken");
                const decoded = jwt.decode(token);
                if (decoded) {
                    teacherId = decoded.id || decoded.teacher_id;
                    teacherName = decoded.teacher_name || decoded.name;
                }
            }
        } catch (e) {}
    }

    return { 
        teacherId, 
        teacherName // Pass actual name or null (DB query will resolve it)
    };
};

// GET /api/teacher/dashboard
exports.getDashboard = async (req, res) => {
    try {
        const { teacherId, teacherName } = getTeacherIdentity(req);
        const data = await dashboardModel.getDashboardData(teacherId, teacherName);

        res.status(200).json({
            success: true,
            data
        });
    } catch (err) {
        console.error("Error loading dashboard data:", err);
        res.status(500).json({ 
            success: false, 
            message: "Failed to load dashboard data", 
            error: err.message 
        });
    }
};
