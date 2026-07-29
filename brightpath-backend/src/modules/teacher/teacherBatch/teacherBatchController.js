// src/controllers/teacherBatchController.js
const batchModel = require("../../../models/batchModel");

// Helper function to extract user ID safely
const getTeacherId = (req) => {
    if (!req.user) return null;
    return req.user.id || req.user.teacher_id || req.user.userId || null;
};

// GET /api/teacher/batches
const getMyBatches = async (req, res) => {
    try {
        const teacherId = getTeacherId(req);
        if (!teacherId) {
            return res.status(401).json({ success: false, message: "Unauthorized: User session missing or invalid" });
        }

        const batches = await batchModel.getBatchesByTeacherId(teacherId);

        return res.status(200).json({
            success: true,
            count: batches.length,
            data: batches
        });
    } catch (error) {
        console.error("Error fetching teacher batches:", error);
        return res.status(500).json({ success: false, message: "Server error fetching batches" });
    }
};

// GET /api/teacher/batches/:id
const getBatchDetails = async (req, res) => {
    try {
        const teacherId = getTeacherId(req);
        if (!teacherId) {
            return res.status(401).json({ success: false, message: "Unauthorized: User session missing or invalid" });
        }

        const batchIdentifier = req.params.id; // Can be numeric ID or batch_code like "B-102"

        const batch = await batchModel.getTeacherBatchDetails(batchIdentifier, teacherId);
        if (!batch) {
            return res.status(404).json({ success: false, message: "Batch not found or unauthorized" });
        }

        // Fetch student list using the resolved internal batch ID
        const students = await batchModel.getBatchStudents(batch.id);

        return res.status(200).json({
            success: true,
            data: {
                ...batch,
                students
            }
        });
    } catch (error) {
        console.error("Error fetching batch details:", error);
        return res.status(500).json({ success: false, message: "Server error fetching batch details" });
    }
};

// GET /api/teacher/batches/:id/students
const getBatchStudents = async (req, res) => {
    try {
        const teacherId = getTeacherId(req);
        if (!teacherId) {
            return res.status(401).json({ success: false, message: "Unauthorized: User session missing or invalid" });
        }

        const batchIdentifier = req.params.id;
        const students = await batchModel.getBatchStudents(batchIdentifier);

        return res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        console.error("Error fetching batch students:", error);
        return res.status(500).json({ success: false, message: "Server error fetching students" });
    }
};

// PUT /api/teacher/batches/:id/students/:studentId/remark
const updateRemark = async (req, res) => {
    try {
        const teacherId = getTeacherId(req);
        if (!teacherId) {
            return res.status(401).json({ success: false, message: "Unauthorized: User session missing or invalid" });
        }

        const { id: batchId, studentId } = req.params;
        const { performance, remark } = req.body;

        const updated = await batchModel.updateStudentRemark(studentId, batchId, performance, remark);
        if (!updated) {
            return res.status(404).json({ success: false, message: "Student record not found in this batch" });
        }

        return res.status(200).json({
            success: true,
            message: "Student remark updated successfully",
            data: updated
        });
    } catch (error) {
        console.error("Error updating student remark:", error);
        return res.status(500).json({ success: false, message: "Server error updating remark" });
    }
};

module.exports = {
    getMyBatches,
    getBatchDetails,
    getBatchStudents,
    updateRemark
};