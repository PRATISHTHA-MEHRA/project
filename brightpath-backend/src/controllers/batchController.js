const batchModel = require("../models/batchModel");
const db = require("../config/db"); 

// Helper function to map database properties back to your exact frontend keys
const mapToFrontend = (b) => {
    if (!b) return null;
    return {
        id: b.id.toString(),
        name: b.batch_name,
        course: b.course_name || b.course_id,
        subject: b.subject,
        teacher: b.teacher_name || "",
        room: b.classroom,
        start: b.start_date ? b.start_date : "",
        end: b.end_date ? b.end_date : "",
        days: b.days,
        type: b.batch_type,
        st: b.start_time ? b.start_time.toString().substring(0, 5) : "", 
        et: b.end_time ? b.end_time.toString().substring(0, 5) : "",     
        max: b.max_students,
        cur: b.current_students,
        status: b.status
    };
};

// Helper to convert frontend string selections into DB friendly inputs
const mapToDatabase = async (frontendData) => {
    let courseId = null; 

    // 1. Try to resolve Course ID from Name string
    if (frontendData.course) {
        const courseRes = await db.query("SELECT id FROM courses WHERE course_name = $1 LIMIT 1", [frontendData.course]);
        if (courseRes.rows.length > 0) {
            courseId = courseRes.rows[0].id;
        }
    }

    // CRITICAL FIX: If courseId is still null, pick the FIRST available course from the DB dynamically
    if (!courseId) {
        const fallbackCourse = await db.query("SELECT id FROM courses ORDER BY id ASC LIMIT 1");
        if (fallbackCourse.rows.length > 0) {
            courseId = fallbackCourse.rows[0].id;
        } else {
            // If the courses table is completely empty, throw a readable error
            throw new Error("Cannot create a batch because no courses exist in the 'courses' table.");
        }
    }

    // 2. Resolve Teacher ID from Name string
    let teacherId = null;
    if (frontendData.teacher) {
        const teacherRes = await db.query("SELECT id FROM teachers WHERE teacher_name = $1 LIMIT 1", [frontendData.teacher]);
        if (teacherRes.rows.length > 0) teacherId = teacherRes.rows[0].id;
    }

    return {
        batch_code: frontendData.id && !frontendData.id.startsWith('temp') ? frontendData.id : `B-${Date.now().toString().slice(-4)}`,
        batch_name: frontendData.name,
        course_id: courseId,
        subject: frontendData.subject || "",
        teacher_id: teacherId,
        classroom: frontendData.room || "",
        start_date: frontendData.start || null,
        end_date: frontendData.end || null,
        days: frontendData.days || "",
        batch_type: frontendData.type || "Regular",
        start_time: frontendData.st || null,
        end_time: frontendData.et || null,
        max_students: parseInt(frontendData.max) || 30,
        current_students: parseInt(frontendData.cur) || 0,
        status: frontendData.status || "Active"
    };
};

// Get All Batches
const getBatches = async (req, res) => {
    try {
        const batches = await batchModel.getAllBatches();
        const formattedBatches = batches.map(b => mapToFrontend(b));

        res.status(200).json({
            success: true,
            count: formattedBatches.length,
            data: formattedBatches
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error fetching batches" });
    }
};

// Get Batch By ID
const getBatch = async (req, res) => {
    try {
        const batch = await batchModel.getBatchById(req.params.id);
        if (!batch) {
            return res.status(404).json({ success: false, message: "Batch not found" });
        }
        res.status(200).json({
            success: true,
            data: mapToFrontend(batch)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error fetching batch" });
    }
};

// Create Batch
const createBatch = async (req, res) => {
    try {
        const dbData = await mapToDatabase(req.body);
        const batch = await batchModel.createBatch(dbData);
        
        const completeBatch = await batchModel.getBatchById(batch.id);

        res.status(201).json({
            success: true,
            message: "Batch created successfully",
            data: mapToFrontend(completeBatch)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Error creating batch" 
        });
    }
};

// Update Batch
const updateBatch = async (req, res) => {
    try {
        const dbData = await mapToDatabase(req.body);
        const batch = await batchModel.updateBatch(req.params.id, dbData);
        
        if (!batch) {
            return res.status(404).json({ success: false, message: "Batch not found" });
        }

        const completeBatch = await batchModel.getBatchById(batch.id);

        res.status(200).json({
            success: true,
            message: "Batch updated successfully",
            data: mapToFrontend(completeBatch)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Error updating batch" 
        });
    }
};

// Delete Batch
const deleteBatch = async (req, res) => {
    try {
        const batch = await batchModel.getBatchById(req.params.id);
        if (!batch) {
            return res.status(404).json({ success: false, message: "Batch not found" });
        }

        await batchModel.deleteBatch(req.params.id);
        res.status(200).json({
            success: true,
            message: "Batch deleted successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error deleting batch" });
    }
};

module.exports = {
    getBatches,
    getBatch,
    createBatch,
    updateBatch,
    deleteBatch
};