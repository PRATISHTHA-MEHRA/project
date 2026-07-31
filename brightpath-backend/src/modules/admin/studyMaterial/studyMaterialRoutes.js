const express = require("express");
const router = express.Router();
const studyMaterialController = require("./studyMaterialController");

const auth = require("../../../middleware/authMiddleware");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Absolute path resolution to avoid path mismatch errors
const uploadDir = path.resolve(__dirname, "../../../uploads/study-material");

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

router.get("/", auth, studyMaterialController.getMaterialList);
router.post("/", auth, upload.single("attachment"), studyMaterialController.addMaterial);
router.delete("/:id", auth, studyMaterialController.deleteMaterial);
router.post("/:id/download", auth, studyMaterialController.downloadMaterial);
router.get("/:id/file", auth, studyMaterialController.getMaterialFile);

module.exports = router;