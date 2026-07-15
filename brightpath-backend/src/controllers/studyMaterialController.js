
const StudyMaterial = require("../models/studyMaterialModel");

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
    const data = await StudyMaterial.addMaterial(req.body);
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