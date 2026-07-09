const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const auth = require("../middleware/authMiddleware");

router.get("/dashboard", auth, attendanceController.getAttendanceDashboard);
router.get("/student/:studentId", auth, attendanceController.getStudentHistory);
router.post("/submit", auth, attendanceController.submitAttendance);
router.get("/roster", auth, attendanceController.getBatchRosterList);

module.exports = router;