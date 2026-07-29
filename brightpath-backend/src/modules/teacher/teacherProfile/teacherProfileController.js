const Teacher = require("../../../models/teacherModel");

// GET /api/teacher/profile
exports.getTeacherProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User session missing"
            });
        }

        const teacherId = req.user.id || req.user.teacher_id || req.user.userId;

        if (!teacherId) {
            return res.status(400).json({
                success: false,
                message: "Invalid token payload: Teacher ID missing"
            });
        }

        // 1. Fetch Teacher details
        const teacher = await Teacher.getById(teacherId);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher profile not found"
            });
        }

        // 2. Fetch Assigned Batches using the model helper
        const batches = await Teacher.getTeacherBatches(teacherId);

        // 3. Extract Initials
        const name = teacher.teacher_name || teacher.name || "";
        const initials = name
            ? name.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase()
            : "T";

        // Format joined date
        const rawDate = teacher.joining_date || teacher.created_at;
        const joinedDate = rawDate
            ? new Date(rawDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : "N/A";

        // 4. Send response aligned with your UI
        res.status(200).json({
            success: true,
            data: {
                teacher: {
                    id: teacher.teacher_code || `TCH-${teacher.id}`,
                    name: name,
                    initials: initials,
                    mobile: teacher.mobile || "N/A",
                    email: teacher.email || "N/A",
                    subject: teacher.subjects || teacher.subject || "Faculty",
                    qual: teacher.qualification || "N/A",
                    exp: teacher.experience ? `${teacher.experience} yrs` : "N/A",
                    payType: teacher.payment_type || teacher.pay_type || "Regular",
                    joined: joinedDate
                },
                batches: batches || []
            }
        });

    } catch (err) {
        console.error("Error in getTeacherProfile:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Failed to fetch profile"
        });
    }
};

// PUT /api/teacher/profile
exports.updateTeacherProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User session missing"
            });
        }

        const teacherId = req.user.id || req.user.teacher_id || req.user.userId;
        const { teacher_name, email, mobile } = req.body;

        if (teacher_name && !String(teacher_name).trim()) {
            return res.status(400).json({ success: false, message: "Teacher name cannot be empty" });
        }
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        const updated = await Teacher.update(teacherId, req.body);
        
        if (!updated) {
            return res.status(404).json({ success: false, message: "Teacher record not found" });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully"
        });
    } catch (err) {
        console.error("Error in updateTeacherProfile:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Failed to update profile"
        });
    }
};