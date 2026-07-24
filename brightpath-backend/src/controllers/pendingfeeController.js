const Fee = require("../models/pendingfeeModel");

exports.getPendingFeesSummary = async (req, res) => {
    try {
        const records = await Fee.getPendingFeesList();
        res.status(200).json({ success: true, data: records });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


exports.getTotalDue = async (req, res) => {
    try {
        const { studentId } = req.params;
        const total = await Fee.getTotalDueForStudent(studentId);
        res.status(200).json({ success: true, data: { total } });
    } catch (err) {
        sendFeeError(res, err);
    }
};

exports.getCurrentDue = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { feeType, period } = req.query;
        if (!feeType || !period) {
            return res.status(400).json({ success: false, message: "feeType and period query params are required." });
        }
        const row = await Fee.getCurrentDueForStudent(studentId, feeType, period);
        res.status(200).json({ success: true, data: row });
    } catch (err) {
        sendFeeError(res, err);
    }
};


exports.addFeeCallNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, promiseDate, note } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: "Follow-up disposition status state is mandatory." });
        }

        const updatedRecord = await Fee.saveCallNoteTransaction(id, {
            status, 
            promiseDate: promiseDate === '' ? null : promiseDate, 
            note
        });

        if (!updatedRecord) {
            return res.status(404).json({ success: false, message: "Target fee record key identifier not found." });
        }

        res.status(200).json({ success: true, message: "Call timeline ledger record attached successfully." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.triggerBulkReminders = async (req, res) => {
    try {
        // Mock notification layer routing integration stub
        res.status(200).json({ 
            success: true, 
            message: "Automated bulk WhatsApp communication dispatch vectors queued successfully." 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};