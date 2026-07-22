const Homework = require("../models/homeworkModel");

exports.getHomeworkList = async (req, res) => {
  try {
    const data = await Homework.getAllHomework();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addHomework = async (req, res) => {
  try {
    const fileMeta = req.file
      ? { originalFilename: req.file.originalname, filePath: req.file.path }
      : { originalFilename: null, filePath: null };

    const data = await Homework.addHomework({ ...req.body, ...fileMeta });
    res.json({ success: true, data, message: "Homework assigned & students notified" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.editHomework = async (req, res) => {
  try {
    const fileMeta = req.file
      ? { originalFilename: req.file.originalname, filePath: req.file.path }
      : { originalFilename: null, filePath: null };

    const data = await Homework.editHomework(req.params.id, { ...req.body, ...fileMeta });
    if (!data) return res.status(404).json({ success: false, message: "Homework not found" });
    res.json({ success: true, data, message: "Homework updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteHomework = async (req, res) => {
  try {
    const data = await Homework.deleteHomework(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Homework not found" });
    res.json({ success: true, message: "Homework deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getHomeworkFile = async (req, res) => {
  try {
    const hw = await Homework.getHomeworkFilePath(req.params.id);
    if (!hw || !hw.attachment_path) {
      return res.status(404).json({ success: false, message: "No attachment available for this homework" });
    }
    res.download(hw.attachment_path, hw.attachment_name || undefined);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};