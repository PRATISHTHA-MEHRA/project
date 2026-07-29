// src/modules/teacher/teacherTimetable/teacherTimetableRoutes.js
const express = require("express");
const router = express.Router();
const teacherTimetableController = require("./teacherTimetableController");
const auth = require("../../../middleware/authMiddleware");

// Change "/timetable" to "/"
router.get("/", auth, teacherTimetableController.getTeacherTimetable);

module.exports = router;