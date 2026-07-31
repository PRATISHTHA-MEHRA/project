const express = require("express");
const router = express.Router();

const auth = require("../../../middleware/authMiddleware");
const {
  getMyBatches,
  getBatchDetails,
  getBatchStudents,
  updateRemark
} = require("./teacherBatchController");

const classNotesController = require("../classNotes/classNotesController");

// ==========================================
// Core Batch Routes
// Base: /api/teacher/batches
// ==========================================

router.get("/", auth, getMyBatches);
router.get("/:id", auth, getBatchDetails);
router.get("/:id/students", auth, getBatchStudents);
router.put("/:id/students/:studentId/remark", auth, updateRemark);

// ==========================================
// Class Notes Routes (Nested under /batches)
// ==========================================

// Fetch all notes for batch :id
router.get("/:id/notes", auth, classNotesController.getClassNotes);

// Create a new note for batch :id
router.post("/:id/notes", auth, classNotesController.addClassNote);

// Delete note :noteId from batch :id
router.delete("/:id/notes/:noteId", auth, classNotesController.deleteClassNote);

module.exports = router;