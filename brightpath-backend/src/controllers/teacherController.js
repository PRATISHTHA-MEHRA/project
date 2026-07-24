const Teacher = require("../models/teacherModel");
const db = require("../config/db"); 

// Get All Teachers
exports.getTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.getAll();
        res.status(200).json({ 
            success: true, 
            count: teachers.length,
            data: teachers 
        });
    } catch (err) {
        console.error("Error in getTeachers:", err);
        res.status(500).json({ success: false, message: err.message || "Failed to fetch teachers" });
    }
};

// Get Single Teacher
exports.getTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.getById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        res.status(200).json({ success: true, data: teacher });
    } catch (err) {
        console.error("Error in getTeacher:", err);
        res.status(500).json({ success: false, message: err.message || "Failed to fetch teacher" });
    }
};

// Create Teacher & Assign Batches
exports.createTeacher = async (req, res) => {
    try {
        const { teacher_name, email, batch_ids } = req.body;
        
        // Validations
        if (!teacher_name || !String(teacher_name).trim()) {
            return res.status(400).json({ success: false, message: "Teacher name is required" });
        }
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email address" });
        }

        // Auto-generate safe unique code if not provided
        const uniqueSuffix = Math.floor(1000 + Math.random() * 9000); 
        const autoCode = `TCH-${Date.now().toString().slice(-4)}${uniqueSuffix.toString().slice(-2)}`;

        const payload = {
            ...req.body,
            teacher_code: req.body.teacher_code || autoCode
        };

        // 1. Create teacher record
        const createdTeacher = await Teacher.create(payload);
        const newTeacherId = createdTeacher.id;

        // 2. Assign initial batches during creation (if passed)
        if (Array.isArray(batch_ids) && batch_ids.length > 0) {
            const cleanBatchIds = batch_ids
                .map(id => parseInt(id, 10))
                .filter(id => !isNaN(id) && id > 0);

            if (cleanBatchIds.length > 0) {
                await db.query(
                    `UPDATE batches SET teacher_id = $1 WHERE id = ANY($2::int[])`,
                    [newTeacherId, cleanBatchIds]
                );
            }
        }

        // 3. Return full aggregated details
        const fullTeacherData = await Teacher.getById(newTeacherId);

        res.status(201).json({
            success: true,
            message: "Teacher created successfully",
            data: fullTeacherData
        });
    } catch (err) {
        console.error("Error in createTeacher:", err);
        res.status(500).json({ success: false, message: err.message || "Failed to create teacher" });
    }
};

// Update Teacher Profile Only (Batches logic removed)
exports.updateTeacher = async (req, res) => {
    try {
        const { teacher_name, email } = req.body;
        const teacherId = req.params.id;

        // Validations
        if (!teacher_name || !String(teacher_name).trim()) {
            return res.status(400).json({ success: false, message: "Teacher name is required" });
        }
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email address" });
        }

        // 1. Update basic profile info
        const updated = await Teacher.update(teacherId, req.body);
        if (!updated) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }

        // 2. Fetch updated teacher profile along with existing batches
        const updatedTeacherData = await Teacher.getById(teacherId);

        res.status(200).json({
            success: true,
            message: "Teacher updated successfully",
            data: updatedTeacherData
        });
    } catch (err) {
        console.error("Error in updateTeacher:", err);
        res.status(500).json({ success: false, message: err.message || "Failed to update teacher" });
    }
};

// Delete Teacher
exports.deleteTeacher = async (req, res) => {
    try {
        const teacherId = req.params.id;

        // Unlink assigned batches before deleting teacher
        await db.query(`UPDATE batches SET teacher_id = NULL WHERE teacher_id = $1`, [teacherId]);

        // Delete record
        await Teacher.delete(teacherId);

        res.status(200).json({
            success: true,
            message: "Teacher deleted successfully"
        });
    } catch (err) {
        console.error("Error in deleteTeacher:", err);
        res.status(500).json({ success: false, message: err.message || "Failed to delete teacher" });
    }
};