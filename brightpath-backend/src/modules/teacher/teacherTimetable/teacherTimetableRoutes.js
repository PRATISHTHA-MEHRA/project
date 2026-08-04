// src/modules/teacher/teacherTimetable/teacherTimetableRoutes.js
const express = require("express");
const router = express.Router();
const teacherTimetableController = require("./teacherTimetableController");
const auth = require("../../../middleware/authMiddleware");

// Change "/timetable" to "/"
router.get("/", auth, teacherTimetableController.getTeacherTimetable);
// PATCH /api/teacher/timetable/:id/complete
router.patch("/:id/complete", auth, teacherTimetableController.markScheduleComplete);

module.exports = router;