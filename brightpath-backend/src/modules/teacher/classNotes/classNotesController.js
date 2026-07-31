// src/controllers/classNotes/classNotesController.js
const StudyMaterial = require("../../../models/studyMaterialModel");

// Deserializes PostgreSQL title JSON string or raw row back into usable UI fields
const formatRowAsClassNote = (row) => {
  let extra = {};
  
  if (row.title && typeof row.title === "string" && row.title.trim().startsWith("{")) {
    try {
      extra = JSON.parse(row.title);
    } catch (e) {
      extra = {};
    }
  }

  const batchName = row.batch || row.course || extra.batch || "General";

  return {
    id: row.id,
    batch: batchName,
    subject: row.subject || "Mathematics",
    date: row.date,
    topic: extra.topic || row.topic || row.title || "—",
    chapter: extra.chapter || row.chapter || "—",
    hw: extra.hw || row.hw || "—",
    doubts: extra.doubts || row.doubts || "—",
    next: extra.next || row.next || "—",
    remarks: extra.remarks || row.remarks || "—",
    uploadedBy: row.uploadedBy
  };
};

// 1. Get Class Notes (Supports filtering by batch ID/Name from URL params)
exports.getClassNotes = async (req, res) => {
  try {
    const teacherName = 
      req.user?.teacher_name || 
      req.user?.name || 
      req.query.teacherName || 
      null;

    // Extract batch identifier if requested via /api/teacher/batches/:id/notes
    const batchId = req.params.id || req.params.batchId || req.query.batch;

    // Fetch notes matching type = 'Class Note'
    const rawData = await StudyMaterial.getAllMaterial("Class Note", teacherName);

    let formattedData = rawData.map(formatRowAsClassNote);

    // Filter by batch if a specific batch ID/Name was passed in URL params
    if (batchId) {
      formattedData = formattedData.filter(
        (note) =>
          String(note.batch).toLowerCase() === String(batchId).toLowerCase() ||
          String(note.id) === String(batchId)
      );
    }

    res.json({ success: true, data: formattedData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Add Class Note
exports.addClassNote = async (req, res) => {
  try {
    const { batch, subject, topic, chapter, hw, doubts, next, remarks } = req.body;

    // If batch isn't explicitly in body, fallback to URL parameter
    const selectedBatch = batch || req.params.id || "General";

    const teacherName = 
      req.user?.teacher_name || 
      req.user?.name || 
      req.body.uploadedBy || 
      "Teacher";

    const titlePayload = JSON.stringify({
      topic: topic || "Untitled Topic",
      chapter: chapter || "",
      hw: hw || "",
      doubts: doubts || "",
      next: next || "",
      remarks: remarks || ""
    });

    const materialData = {
      title: titlePayload,
      course: selectedBatch,
      subject: subject || "Mathematics",
      type: "Class Note",
      uploadedBy: teacherName,
      size: "—"
    };

    const insertedRow = await StudyMaterial.addMaterial(materialData);
    const formattedNote = formatRowAsClassNote(insertedRow);

    res.json({
      success: true,
      data: formattedNote,
      message: "Class note saved directly in study materials!"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Delete Class Note
exports.deleteClassNote = async (req, res) => {
  try {
    const targetId = req.params.noteId || req.params.id;

    const data = await StudyMaterial.deleteMaterial(targetId);
    if (!data) return res.status(404).json({ success: false, message: "Note not found" });

    res.json({ success: true, message: "Class note deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};