const fs = require("fs/promises");
const StudyMaterial = require("../../../models/studyMaterialModel");

function formatFileSize(bytes) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

exports.getMaterialList = async (req, res) => {
  try {
    const data = await StudyMaterial.getAllMaterial();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addMaterial = async (req, res) => {
  try {
    const fileMeta = req.file
      ? {
          filePath: req.file.path,
          originalFilename: req.file.originalname,
          fileSize: formatFileSize(req.file.size)
        }
      : { filePath: null, originalFilename: null, fileSize: req.body.size || "—" };

    const data = await StudyMaterial.addMaterial({ ...req.body, ...fileMeta });
    res.json({ success: true, data, message: "Material uploaded" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    // 1. Fetch record first to get physical file path
    const material = await StudyMaterial.getMaterialFilePath(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: "Material not found" });
    }

    // 2. Delete database entry
    await StudyMaterial.deleteMaterial(req.params.id);

    // 3. Remove actual file from storage if present
    if (material.file_path) {
      await fs.unlink(material.file_path).catch(() => {
        // Silently handle if file was already missing from disk
      });
    }

    res.json({ success: true, message: "Material deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.downloadMaterial = async (req, res) => {
  try {
    const data = await StudyMaterial.incrementDownload(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Material not found" });
    res.json({ success: true, data, message: "Download counted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Streams file & increments download counter in one operation
exports.getMaterialFile = async (req, res) => {
  try {
    const material = await StudyMaterial.getMaterialFilePath(req.params.id);
    if (!material || !material.file_path) {
      return res.status(404).json({ success: false, message: "No file available for this material" });
    }

    // Increment download counter automatically on file stream
    await StudyMaterial.incrementDownload(req.params.id);

    res.download(material.file_path, material.original_filename || undefined);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};