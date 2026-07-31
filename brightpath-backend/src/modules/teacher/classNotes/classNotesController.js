const StudyMaterial = require("../../../models/studyMaterialModel");

// Deserializes PostgreSQL title JSON string back into usable UI fields
const formatRowAsClassNote = (row) => {
  let extra = {};
  try {
    extra = JSON.parse(row.title);
  } catch (e) {
    extra = { topic: row.title };
  }

  return {
    id: row.id,
    batch: row.course || extra.batch || "General",
    subject: row.subject || "Mathematics",
    date: row.date,
    topic: extra.topic || row.title,
    chapter: extra.chapter || "—",
    hw: extra.hw || "—",
    doubts: extra.doubts || "—",
    next: extra.next || "—",
    remarks: extra.remarks || "—",
    uploadedBy: row.uploadedBy
  };
};

// 1. Get Class Notes
exports.getClassNotes = async (req, res) => {
  try {
    // Extract teacher name matching DB column 'teacher_name' from JWT token payload
    const teacherName = 
      req.user?.teacher_name || 
      req.user?.name || 
      req.query.teacherName || 
      null;

    // Fetch notes matching type = 'Class Note' and assigned to/created by this teacher
    const rawData = await StudyMaterial.getAllMaterial("Class Note", teacherName);

    const formattedData = rawData.map(formatRowAsClassNote);

    res.json({ success: true, data: formattedData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Add Class Note
exports.addClassNote = async (req, res) => {
  try {
    const { batch, subject, topic, chapter, hw, doubts, next, remarks } = req.body;

    // Get exact teacher name using DB column key 'teacher_name' from JWT
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
      course: batch || "General",
      subject: subject || "Mathematics",
      type: "Class Note",
      uploadedBy: teacherName, // Stores actual teacher name in PostgreSQL 'uploaded_by' column
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
    const data = await StudyMaterial.deleteMaterial(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Note not found" });

    res.json({ success: true, message: "Class note deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};