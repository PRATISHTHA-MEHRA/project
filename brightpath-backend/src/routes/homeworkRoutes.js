const express = require("express");
const router = express.Router();
const homeworkController = require("../controllers/homeworkController");
const upload = require("../middleware/upload"); // same shared multer config used by study material

router.get("/", homeworkController.getHomeworkList);
router.post("/", upload.single("attachment"), homeworkController.addHomework);
router.put("/:id", upload.single("attachment"), homeworkController.editHomework);
router.delete("/:id", homeworkController.deleteHomework);
router.get("/:id/file", homeworkController.getHomeworkFile);

module.exports = router;