const express = require("express");
const router = express.Router();

const teacherController = require("./teacherController");
const auth = require("../../../middleware/authMiddleware");

router.get("/", auth, teacherController.getTeachers);

router.get("/:id", auth, teacherController.getTeacher);

router.post("/", auth, teacherController.createTeacher);

router.put("/:id", auth, teacherController.updateTeacher);

router.delete("/:id", auth, teacherController.deleteTeacher);

// Dynamic dropdown route MUST be placed before /:id routes
router.get("/dropdown", auth, teacherController.getTeacherDropdown);

module.exports = router;