const express = require("express");
const router = express.Router();
const attendanceController = require("./teacherAttendanceController");
const auth = require("../../../middleware/authMiddleware");

// All routes require JWT auth
router.get("/batches", auth, attendanceController.getTeacherBatches);
router.get("/students", auth, attendanceController.getBatchStudentsWithAttendance);
router.get("/history", auth, attendanceController.getBatchAttendanceHistory);
router.post("/", auth, attendanceController.submitTeacherAttendance);

module.exports = router;