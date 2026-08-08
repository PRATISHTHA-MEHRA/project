const express = require("express");
const router = express.Router();
const teacherExamController = require("./teacherExamController");

// Primary Route Aliases for Single Exams
router.get("/exams/:id", teacherExamController.getExamById);
router.put("/exams/:id", teacherExamController.updateExam);
router.delete("/exams/:id", teacherExamController.deleteExam);

// Test / Exam Management Routes
router.get("/tests", teacherExamController.getAllTests);
router.post("/tests", teacherExamController.createTest);
router.get("/tests/:id", teacherExamController.getExamById);
router.get("/tests/:id/students", teacherExamController.getTestBatchStudents);

// Marks Management Routes
router.get("/marks", teacherExamController.getAllMarksWithRankings);
router.post("/marks/bulk", teacherExamController.submitBulkMarks);

module.exports = router;