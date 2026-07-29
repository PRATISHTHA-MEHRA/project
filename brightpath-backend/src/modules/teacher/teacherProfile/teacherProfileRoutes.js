// modules/teacher/teacherProfile/teacherProfileRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../../../middleware/authMiddleware");

const { getTeacherProfile, updateTeacherProfile } = require("./teacherProfileController");

// Change "/profile" to "/" since parent router mounted this at "/profile"
router.get("/", auth, getTeacherProfile);
router.put("/", auth, updateTeacherProfile);

module.exports = router;