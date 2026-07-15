
const express = require("express");
const router = express.Router();
const homeworkController = require("../controllers/homeworkController");

router.get("/", homeworkController.getHomeworkList);
router.post("/", homeworkController.addHomework);
router.put("/:id", homeworkController.editHomework);
router.delete("/:id", homeworkController.deleteHomework);

module.exports = router;

