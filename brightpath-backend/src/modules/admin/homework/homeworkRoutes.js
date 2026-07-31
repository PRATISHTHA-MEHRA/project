// modules/admin/homework/homeworkRoutes.js
const express = require("express");
const router = express.Router();
const homeworkController = require("./homeworkController");
const auth = require("../../../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Absolute path resolution to avoid path mismatch errors
const uploadDir = path.resolve(__dirname, "../../../uploads/homework");

// Create directory if it does not exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

router.get("/", auth, homeworkController.getHomeworkList);
router.post("/", auth, upload.single("attachment"), homeworkController.addHomework);
router.put("/:id", auth, upload.single("attachment"), homeworkController.editHomework);
router.delete("/:id", auth, homeworkController.deleteHomework);
router.get("/:id/file", auth, homeworkController.getHomeworkFile);

module.exports = router;