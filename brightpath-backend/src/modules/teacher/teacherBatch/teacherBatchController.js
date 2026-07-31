// src/controllers/teacherBatchController.js
const batchModel = require("../../../models/batchModel");
const StudyMaterial = require("../../../models/studyMaterialModel");
const Homework = require("../../../models/homeworkModel");

// Helper to normalize notes whether they come as direct objects or raw DB rows
const formatNote = (row) => {
  let extra = {};
  
  if (row.title && typeof row.title === "string" && row.title.trim().startsWith("{")) {
    try {
      extra = JSON.parse(row.title);
    } catch (e) {
      extra = {};
    }
  }

  // The DB column for batch in study materials is stored as `course` or `batch`
  const batchName = row.batch || row.course || extra.batch || "General";

  return {
    id: row.id,
    batch: batchName,
    title: extra.topic || row.topic || row.title || "Untitled Note",
    topic: extra.topic || row.topic || row.title || "—",
    chapter: extra.chapter || row.chapter || "—",
    hw: extra.hw || row.hw || "—",
    doubts: extra.doubts || row.doubts || "—",
    next: extra.next || row.next || "—",
    remarks: extra.remarks || row.remarks || "—",
    created_at: row.date || row.created_at,
    date: row.date || row.created_at,
    subject: row.subject || "General",
    uploadedBy: row.uploadedBy
  };
};

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
    // 1. Validate Batch ID
    const rawId = req.params.id;
    const batchId = parseInt(rawId, 10);

    if (isNaN(batchId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Batch ID format"
      });
    }

    // 2. Extract Teacher Info
    const teacherId = getTeacherId(req);
    const teacherName = req.user?.teacher_name || req.user?.name || null;

    // 3. Fetch Core Batch Details First
    const batch = await batchModel.getTeacherBatchDetails(batchId, teacherId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found or unauthorized access"
      });
    }

    // Identifiers to match notes and homework against this batch
    const batchName = batch.name || batch.batch_name;
    const batchCode = batch.batch_code || String(batchId);

    // 4. Fetch Students, Notes, and Homework concurrently
    const [students, rawNotes, rawHomework] = await Promise.all([
      batchModel.getBatchStudents(batchId),
      StudyMaterial.getAllMaterial("Class Note", teacherName),
      Homework.getAllHomework()
    ]);

    // 5. Filter Notes specific to this Batch (by batch name, code, or ID)
    const formattedNotes = (rawNotes || [])
      .map(formatNote)
      .filter(note => {
        const b = String(note.batch || "").trim().toLowerCase();
        return (
          b === String(batchName).trim().toLowerCase() ||
          b === String(batchId).trim().toLowerCase() ||
          b === String(batchCode).trim().toLowerCase()
        );
      });

    // 6. Filter Homework specific to this Batch
    const batchHomework = (rawHomework || []).filter(hw => {
      const b = String(hw.batch || "").trim().toLowerCase();
      return (
        b === String(batchName).trim().toLowerCase() ||
        b === String(batchId).trim().toLowerCase() ||
        b === String(batchCode).trim().toLowerCase()
      );
    });

    // 7. Return complete unified payload
    return res.status(200).json({
      success: true,
      data: {
        ...batch,
        students: students || [],
        notes: formattedNotes || [],
        homework: batchHomework || []
      }
    });

  } catch (error) {
    console.error("❌ Error in getBatchDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching batch details"
    });
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