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

    // Fallback teacher name if not explicitly passed in req.body
    const teacher = req.body.teacher || req.user?.name || req.user?.teacher_name;

    const data = await Homework.addHomework({
      ...req.body,
      teacher,
      ...fileMeta
    });

    res.json({ success: true, data, message: "Homework assigned & students notified" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// homeworkController.js

exports.editHomework = async (req, res) => {
  try {
    const code = req.params.id;
    let oldFilePath = null;

    const existing = await Homework.getHomeworkFilePath(code);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Homework not found" });
    }
    oldFilePath = existing.attachment_path;

    const fileMeta = req.file
      ? { originalFilename: req.file.originalname, filePath: req.file.path }
      : { originalFilename: null, filePath: null };

    const data = await Homework.editHomework(code, {
      batch: req.body.batch,
      subject: req.body.subject,
      teacher: req.body.teacher,
      title: req.body.title,
      desc: req.body.desc,
      due: req.body.due,
      status: req.body.status,
      ...fileMeta
    });

    if (oldFilePath && req.file) {
      await fs.unlink(oldFilePath).catch(() => {});
    }

    res.json({ success: true, data, message: "Homework updated successfully" });
  } catch (err) {
    console.error("Edit Homework Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteHomework = async (req, res) => {
  try {
    const code = req.params.id;

    const hw = await Homework.getHomeworkFilePath(code);
    if (!hw) {
      return res.status(404).json({ success: false, message: "Homework not found" });
    }

    await Homework.deleteHomework(code);

    // Gracefully attempt file deletion
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