const express = require("express");
const router = express.Router();

const studentController = require("../controllers/studentController");
const auth = require("../middleware/authMiddleware");

router.get("/:id/fees", studentController.getStudentFees);
router.get("/:id/attendance", studentController.getStudentAttendance);
router.get("/:id/exams", studentController.getStudentExams);

// Get All Students
router.get("/", auth, studentController.getStudents);

// Get Student By ID
router.get("/:id", auth, studentController.getStudent);

// Create Student
router.post("/", auth, studentController.createStudent);

// Update Student
router.put("/:id", auth, studentController.updateStudent);

// Delete Student
router.delete("/:id", auth, studentController.deleteStudent);



module.exports = router;