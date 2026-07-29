const fs = require("fs/promises");
const Homework = require("../../../models/homeworkModel");

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
    const code = req.params.id;
    let oldFilePath = null;

    // Check if new file is uploaded; if so, fetch old path to clean it up
    if (req.file) {
      const existing = await Homework.getHomeworkFilePath(code);
      if (existing) oldFilePath = existing.attachment_path;
    }

    const fileMeta = req.file
      ? { originalFilename: req.file.originalname, filePath: req.file.path }
      : { originalFilename: null, filePath: null };

    const data = await Homework.editHomework(code, { ...req.body, ...fileMeta });
    if (!data) return res.status(404).json({ success: false, message: "Homework not found" });

    // Clean up old file asynchronously after successful update
    if (oldFilePath && req.file) {
      await fs.unlink(oldFilePath).catch(() => {});
    }

    res.json({ success: true, data, message: "Homework updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteHomework = async (req, res) => {
  try {
    const code = req.params.id;

    // 1. Fetch file path before deleting record
    const hw = await Homework.getHomeworkFilePath(code);
    if (!hw) {
      return res.status(404).json({ success: false, message: "Homework not found" });
    }

    // 2. Remove record from database
    await Homework.deleteHomework(code);

    // 3. Remove physical file if it exists
    if (hw.attachment_path) {
      await fs.unlink(hw.attachment_path).catch(() => {});
    }

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