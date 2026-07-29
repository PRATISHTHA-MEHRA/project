const router = require("express").Router();

// Authentication
router.use("/auth", require("../modules/teacher/auth/authRoutes"));

// Teacher Dashboard
router.use("/dashboard", require("../modules/teacher/teacherDashboard/teacherDashboardRoutes"));

// Teacher Profile
router.use("/profile", require("../modules/teacher/teacherProfile/teacherProfileRoutes"));

// Teacher Batches
router.use("/batches", require("../modules/teacher/teacherBatch/teacherBatchRoutes"));

// Teacher Timetable
router.use("/timetable", require("../modules/teacher/teacherTimetable/teacherTimetableRoutes"));

// Add Teacher Attendance Route
router.use("/attendance", require("../modules/teacher/teacherAttendance/teacherAttendanceRoutes"));

// Teacher Exams
router.use("/exams", require("../modules/teacher/teacherExamController/teacherExamRoutes"));

// Teacher Payments
router.use("/payments", require("../modules/teacher/teacherPayment/teacherPaymentRoutes"));

// Teacher Leaves
router.use("/leaves", require("../modules/teacher/teacherLeave/teacherLeaveRoutes"));


module.exports = router;