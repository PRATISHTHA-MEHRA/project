const express = require("express");
const router = express.Router();

const teacherController = require("../controllers/teacherController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, teacherController.getTeachers);

router.get("/:id", auth, teacherController.getTeacher);

router.post("/", auth, teacherController.createTeacher);

router.put("/:id", auth, teacherController.updateTeacher);

router.delete("/:id", auth, teacherController.deleteTeacher);

module.exports = router;