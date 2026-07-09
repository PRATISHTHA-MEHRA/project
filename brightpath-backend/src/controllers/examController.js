const Exam = require("../models/examModel");

exports.getExamsList = async (req, res) => {
    try {
        const list = await Exam.getAllExams();
        res.status(200).json({ success: true, data: list });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.addExam = async (req, res) => {
    try {
        const { name, course, batch, subject, teacher, date, total, pass, status, syllabus } = req.body;

        if (!name || !date) {
            return res.status(400).json({ success: false, message: "Test name and valid target date are required fields." });
        }

        const newTest = await Exam.createExam({
            name, course, batch, subject, teacher, date,
            total: parseInt(total || 100), pass: parseInt(pass || 33),
            status: status || 'Scheduled', syllabus
        });

        res.status(201).json({ success: true, data: newTest });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.editExam = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, course, batch, subject, teacher, date, total, pass, status, syllabus } = req.body;

        const updated = await Exam.updateExam(id, {
            name, course, batch, subject, teacher, date,
            total: parseInt(total), pass: parseInt(pass), status, syllabus
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: "Assessment target entity row not found." });
        }

        res.status(200).json({ success: true, message: "Test record modifications committed successfully." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};