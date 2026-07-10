const Enquiry = require("../models/enquiryModel");
const db = require("../config/db");
const admissionController = require("./admissionController");


const mapToFrontend = (e) => {
    if (!e) return null;
    return {
        id: `ENQ-${e.id}`,
        name: e.student_name,
        parent: e.parent_name || "",
        mobile: e.mobile || "",
        cls: e.class_level || "",
        course: e.course_interest || "",
        source: e.source || "",
        timing: e.preferred_timing || "",
        followup: e.followup_date ? new Date(e.followup_date).toISOString().split("T")[0] : "",
        counselor: e.counselor || "",
        status: e.status || "New",
        remarks: e.remarks || "",
        date: e.created_at ? new Date(e.created_at).toISOString().split("T")[0] : ""
    };
};

const mapToDatabase = (f) => ({
    student_name: f.name,
    parent_name: f.parent,
    mobile: f.mobile,
    class_level: f.cls,
    course_interest: f.course,
    source: f.source,
    preferred_timing: f.timing,
    followup_date: f.followup || null,
    counselor: f.counselor,
    status: f.status,
    remarks: f.remarks,
    date: f.date || null
});


const parseId = (param) => {
    const raw = String(param).replace("ENQ-", "");
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
};

exports.getEnquiries = async (req, res) => {
    try {
        const rows = await Enquiry.getAll();
        const stats = await Enquiry.getStats();
        const total = parseInt(stats.total, 10) || 0;
        const converted = parseInt(stats.converted_count, 10) || 0;

        res.status(200).json({
            success: true,
            stats: {
                totalEnquiries: total,
                newOpen: parseInt(stats.open_count, 10) || 0,
                converted,
                conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0
            },
            data: rows.map(mapToFrontend)
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getEnquiry = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        if (!id) return res.status(400).json({ success: false, message: "Invalid enquiry id" });

        const entry = await Enquiry.getById(id);
        if (!entry) return res.status(404).json({ success: false, message: "Enquiry not found" });

        res.status(200).json({ success: true, data: mapToFrontend(entry) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createEnquiry = async (req, res) => {
    try {
        const dbReady = mapToDatabase(req.body);
        if (!dbReady.student_name) {
            return res.status(400).json({ success: false, message: "Student name is required" });
        }
        const created = await Enquiry.create(dbReady);
        res.status(201).json({ success: true, message: "Enquiry added", data: mapToFrontend(created) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateEnquiry = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        if (!id) return res.status(400).json({ success: false, message: "Invalid enquiry id" });

        const dbReady = mapToDatabase(req.body);
        if (!dbReady.student_name) {
            return res.status(400).json({ success: false, message: "Student name is required" });
        }

        // Conversion (and the resulting admission record) only ever happens
        // through /convert, so an edit-form status change can't fake it.
        if (dbReady.status === "Converted") {
            return res.status(400).json({
                success: false,
                message: "Use the Convert action to mark an enquiry as converted"
            });
        }

        const updated = await Enquiry.update(id, dbReady);
        if (!updated) return res.status(404).json({ success: false, message: "Enquiry not found" });

        res.status(200).json({ success: true, message: "Enquiry updated", data: mapToFrontend(updated) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


exports.convertEnquiry = async (req, res) => {
    try {
        const enquiryId = parseId(req.params.id);
        if (!enquiryId) return res.status(400).json({ success: false, message: "Invalid enquiry id" });

        const enquiry = await Enquiry.getById(enquiryId);

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found"
            });
        }

        // to prevent duplicate conversion
        const existing = await db.query(
            "SELECT id FROM admissions WHERE mobile = $1",
            [enquiry.mobile]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "This enquiry has already been converted."
            });
        }

      // Merge enquiry data with Convert Modal data
const payload = {
    name: enquiry.student_name,
    mobile: enquiry.mobile,
    parent: enquiry.parent_name,
    cls: enquiry.class_level,

    // Course from enquiry
    course: enquiry.course_interest,

    // Values coming from the Convert modal
    batchId: req.body.batchId,
    feeType: req.body.feeType,
    feeAmt: req.body.feeAmount,
    admission: req.body.admissionDate,
    feeStatus: req.body.feeStatus
};

        // Reuse existing admission logic
        const admission = await admissionController.createAdmissionRecord(payload);

        // Mark enquiry as converted
        await Enquiry.update(enquiryId, {
            student_name: enquiry.student_name,
            parent_name: enquiry.parent_name,
            mobile: enquiry.mobile,
            class_level: enquiry.class_level,
            course_interest: enquiry.course_interest,
            source: enquiry.source,
            preferred_timing: enquiry.preferred_timing,
            followup_date: enquiry.followup_date,
            counselor: enquiry.counselor,
            status: "Converted",
            remarks: enquiry.remarks
        });

        res.status(200).json({
            success: true,
            message: "Enquiry converted successfully.",
            data: admissionController.mapToFrontend(admission)
        });

    } catch (err) {
        console.error(err);

        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

exports.deleteEnquiry = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        if (!id) return res.status(400).json({ success: false, message: "Invalid enquiry id" });

        const deleted = await Enquiry.deleteEnq(id);
        if (!deleted) return res.status(404).json({ success: false, message: "Enquiry not found" });

        res.status(200).json({ success: true, message: "Enquiry deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};