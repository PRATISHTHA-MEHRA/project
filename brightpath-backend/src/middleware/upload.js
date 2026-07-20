const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Files land in <project-root>/uploads/study-material/
const uploadDir = path.join(__dirname, "..", "uploads", "study-material");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB cap — bump if you expect bigger PDFs/videos
});

module.exports = upload;