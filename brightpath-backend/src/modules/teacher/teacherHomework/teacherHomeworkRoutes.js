// routes/teacherHomework.js

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Set up storage for homework attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "src/uploads/homework/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Import controller & Auth Middleware
const teacherHwController = require("./teacherHomeworkController");
const auth = require("../../../middleware/authMiddleware");

// Apply middleware so req.user gets populated
router.get("/", auth, teacherHwController.getMyHomework);
router.post("/", auth, upload.single("attachment"), teacherHwController.createTeacherHomework);
router.get("/:id/submissions", auth, teacherHwController.getHomeworkSubmissions);
router.put("/submission/:submissionId", auth, teacherHwController.gradeSubmission);
// Add DELETE route to your existing routes
router.delete("/:id", auth, teacherHwController.deleteHomework);

module.exports = router;