const Exam = require("../../../models/examModel");

// Get All Exams
exports.getExamsList = async (req, res) => {
    try {
        const list = await Exam.getAllExams();
        res.status(200).json({ 
            success: true, 
            count: list.length,
            data: list 
        });
    } catch (err) {
        console.error("Error fetching exams:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get Single Exam By ID
exports.getExam = async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await Exam.getExamById(id);

        if (!exam) {
            return res.status(404).json({ success: false, message: "Assessment record not found." });
        }

        res.status(200).json({ success: true, data: exam });
    } catch (err) {
        console.error("Error fetching exam:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Add Exam
exports.addExam = async (req, res) => {
    try {
        const { name, course, batch, subject, teacher, date, total, pass, status, syllabus } = req.body;

        if (!name || !date) {
            return res.status(400).json({ 
                success: false, 
                message: "Test name and valid target date are required fields." 
            });
        }

        const newTest = await Exam.createExam({
            name,
            course: course || "",
            batch: batch || "",
            subject: subject || "",
            teacher: teacher || "",
            date,
            total: Number.isNaN(parseInt(total)) ? 100 : parseInt(total),
            pass: Number.isNaN(parseInt(pass)) ? 33 : parseInt(pass),
            status: status || "Scheduled",
            syllabus: syllabus || ""
        });

        res.status(201).json({ 
            success: true, 
            message: "Exam created successfully.",
            data: newTest 
        });
    } catch (err) {
        console.error("Error adding exam:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Edit Exam
exports.editExam = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, course, batch, subject, teacher, date, total, pass, status, syllabus } = req.body;

        const updated = await Exam.updateExam(id, {
            name,
            course: course || "",
            batch: batch || "",
            subject: subject || "",
            teacher: teacher || "",
            date,
            total: Number.isNaN(parseInt(total)) ? 100 : parseInt(total),
            pass: Number.isNaN(parseInt(pass)) ? 33 : parseInt(pass),
            status: status || "Scheduled",
            syllabus: syllabus || ""
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: "Assessment target entity row not found." });
        }

        res.status(200).json({ 
            success: true, 
            message: "Test record modifications committed successfully.",
            data: updated 
        });
    } catch (err) {
        console.error("Error updating exam:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete Exam
exports.deleteExam = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Exam.deleteExam(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: "Exam record not found or already deleted." });
        }

        res.status(200).json({ 
            success: true, 
            message: "Exam record deleted successfully.",
            id: deleted.id 
        });
    } catch (err) {
        console.error("Error deleting exam:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};