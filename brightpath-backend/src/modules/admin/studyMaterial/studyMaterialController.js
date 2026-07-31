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

// Transform DB rows for Admin display
const formatMaterialForAdmin = (row) => {
  let displayTitle = row.title;
  let extraDetails = {};

  try {
    // Attempt to parse title JSON string created by Teacher Controller
    extraDetails = JSON.parse(row.title);
    if (extraDetails && extraDetails.topic) {
      displayTitle = extraDetails.topic;
    }
  } catch (e) {
    displayTitle = row.title;
  }

  return {
    ...row,
    title: displayTitle,
    topic: displayTitle,
    details: extraDetails
  };
};

// 1. Get Material List for Admin
exports.getMaterialList = async (req, res) => {
  try {
    const rawData = await StudyMaterial.getAllMaterial();
    const data = rawData.map(formatMaterialForAdmin);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Add Material by Admin
exports.addMaterial = async (req, res) => {
  try {
    const fileMeta = req.file
      ? {
          filePath: req.file.path,
          originalFilename: req.file.originalname,
          fileSize: formatFileSize(req.file.size)
        }
      : { filePath: null, originalFilename: null, fileSize: req.body.size || "—" };

    const materialPayload = {
      ...req.body,
      ...fileMeta,
      type: req.body.type || "Class Note",
      uploadedBy: req.body.assignedTeacher || req.body.uploadedBy || "Admin" 
    };

    const data = await StudyMaterial.addMaterial(materialPayload);
    res.json({ success: true, data, message: "Material uploaded successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.getMaterialFilePath(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: "Material not found" });
    }

    await StudyMaterial.deleteMaterial(req.params.id);

    if (material.file_path) {
      await fs.unlink(material.file_path).catch(() => {});
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

exports.getMaterialFile = async (req, res) => {
  try {
    const material = await StudyMaterial.getMaterialFilePath(req.params.id);
    if (!material || !material.file_path) {
      return res.status(404).json({ success: false, message: "No file available for this material" });
    }

    await StudyMaterial.incrementDownload(req.params.id);

    res.download(material.file_path, material.original_filename || undefined);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};