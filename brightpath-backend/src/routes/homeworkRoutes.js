const express = require("express");
const router = express.Router();
const homeworkController = require("../controllers/homeworkController");
const upload = require("../middleware/upload"); // same shared multer config used by study material

router.get("/", auth, homeworkController.getHomeworkList);
router.post("/", auth, upload.single("attachment"), homeworkController.addHomework);
router.put("/:id", auth,  upload.single("attachment"), homeworkController.editHomework);
router.delete("/:id", auth, homeworkController.deleteHomework);
router.get("/:id/file", auth, homeworkController.getHomeworkFile);

module.exports = router;