const Marks = require("../models/marksModel");

// Automated grade assigner matching front-end badges
const calculateGrade = (obtained, total) => {
    const pct = (obtained / total) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 75) return 'A';
    if (pct >= 60) return 'B+';
    if (pct >= 50) return 'B';
    if (pct >= 40) return 'C';
    return 'D';
};

exports.getMarksList = async (req, res) => {
    try {
        const data = await Marks.getMarksWithRankings();
        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.submitBulkMarks = async (req, res) => {
    try {
        const { examId, examName, batch, subject, total, scores } = req.body;

        if (!examId || !Array.isArray(scores) || scores.length === 0) {
            return res.status(400).json({ success: false, message: "Missing exam context parameters or student marks payload arrays." });
        }

        const processedRecords = scores.map(s => {
            const obtained = parseInt(s.obtained);
            const totalMax = parseInt(total);
            return {
                examId, examName, batch, subject, total: totalMax,
                studentId: s.studentId,
                studentName: s.studentName,
                obtained,
                grade: calculateGrade(obtained, totalMax),
                remarks: s.remarks || ""
            };
        });

        const result = await Marks.saveBulkMarks(processedRecords);
        res.status(200).json({ 
            success: true, 
            message: "Bulk marks saved and assessment ranks compiled.", 
            count: result.length 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};