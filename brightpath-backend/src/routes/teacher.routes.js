const router = require("express").Router();

// Authentication
router.use("/auth", require("../modules/teacher/auth/authRoutes"));

// Teacher Profile
router.use("/profile", require("../modules/teacher/teacherProfile/teacherProfileRoutes"));

// Teacher Batches
router.use("/batches", require("../modules/teacher/teacherBatch/teacherBatchRoutes"));

// Teacher Timetable
router.use("/timetable", require("../modules/teacher/teacherTimetable/teacherTimetableRoutes"));

// Add Teacher Attendance Route
router.use("/attendance", require("../modules/teacher/teacherAttendance/teacherAttendanceRoutes"));

module.exports = router;