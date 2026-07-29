const express = require("express");
const router = express.Router();
const teacherExamController = require("./teacherExamController");

// Test / Exam Management Routes
router.get("/tests", teacherExamController.getAllTests);
router.post("/tests", teacherExamController.createTest);
router.get("/tests/:id/students", teacherExamController.getTestBatchStudents);

// Marks Management Routes
router.get("/marks", teacherExamController.getAllMarksWithRankings);
router.post("/marks/bulk", teacherExamController.submitBulkMarks);

module.exports = router;