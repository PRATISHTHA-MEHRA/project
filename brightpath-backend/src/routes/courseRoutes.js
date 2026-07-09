const express = require("express");
const router = express.Router();

const courseController = require("../controllers/courseController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, courseController.getCourses);

router.get("/:id", auth, courseController.getCourse);

router.post("/", auth, courseController.createCourse);

router.put("/:id", auth, courseController.updateCourse);

router.delete("/:id", auth, courseController.deleteCourse);

module.exports = router;