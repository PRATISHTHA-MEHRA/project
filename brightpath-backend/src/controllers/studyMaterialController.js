const StudyMaterial = require("../models/studyMaterialModel");

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
    const data = await StudyMaterial.deleteMaterial(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Material not found" });
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

// Actually streams the uploaded file back to the browser.
exports.getMaterialFile = async (req, res) => {
  try {
    const material = await StudyMaterial.getMaterialFilePath(req.params.id);
    if (!material || !material.file_path) {
      return res.status(404).json({ success: false, message: "No file available for this material" });
    }
    res.download(material.file_path, material.original_filename || undefined);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};