const express = require("express");
const router = express.Router();
const examController = require("../controllers/examController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, examController.getExamsList);
router.post("/", auth, examController.addExam);
router.put("/:id", auth, examController.editExam);

module.exports = router;