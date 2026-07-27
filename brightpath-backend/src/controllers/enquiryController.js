const Enquiry = require("../models/enquiryModel");
const db = require("../config/db");
const admissionController = require("./admissionController");

const Demo = require("../models/demoModel");
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

const validateMobile = (mobile) => {
    if (!mobile) return false;
    const cleaned = String(mobile).replace(/[\s-]/g, "");
    return /^\+?[0-9]{7,15}$/.test(cleaned);
};

exports.createEnquiry = async (req, res) => {
    try {
        if (!validateMobile(req.body.mobile)) {
            return res.status(400).json({ success: false, message: "Enter a valid mobile number." });
        }

        const dbReady = mapToDatabase(req.body);
        const created = await Enquiry.create(dbReady);

        // Auto-create Demo Class if "Demo Scheduled" is selected
        if (created.status === 'Demo Scheduled') {
            await Demo.create({
                student_name: created.student_name,
                course_name: created.course_interest,
                batch_name: req.body.batch || "TBD",
                teacher_name: req.body.teacher || created.counselor || "Unassigned",
                demo_date: created.followup_date || new Date().toISOString().slice(0, 10),
                demo_time: "10:00 AM",
                status: "Scheduled",
                feedback: created.remarks || "Scheduled from Enquiry"
            });
        }

        res.status(201).json({ success: true, message: "Enquiry created", data: mapToFrontend(created) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateEnquiry = async (req, res) => {
    try {
        if (!validateMobile(req.body.mobile)) {
            return res.status(400).json({ success: false, message: "Enter a valid mobile number." });
        }

        const id = req.params.id.replace("ENQ-", "");
        const dbReady = mapToDatabase(req.body);
        const updated = await Enquiry.update(id, dbReady);

        if (updated.status === 'Demo Scheduled') {
            const existingDemos = await Demo.getAll();
            const exists = existingDemos.some(d => d.student_name === updated.student_name && d.status === 'Scheduled');

            if (!exists) {
                await Demo.create({
                    student_name: updated.student_name,
                    course_name: updated.course_interest,
                    batch_name: req.body.batch || "TBD",
                    teacher_name: req.body.teacher || updated.counselor || "Unassigned",
                    demo_date: updated.followup_date || new Date().toISOString().slice(0, 10),
                    demo_time: "10:00 AM",
                    status: "Scheduled",
                    feedback: updated.remarks || "Scheduled from Enquiry"
                });
            }
        }

        res.status(200).json({ success: true, message: "Enquiry updated", data: mapToFrontend(updated) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.convertEnquiry = async (req, res) => {
    let client;
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

        client = await db.connect();
        await client.query("BEGIN");

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
        const result = await admissionController.createAdmissionRecord(payload, { client, source: "enquiry" });

        // Mark enquiry as converted
        await client.query("UPDATE enquiries SET status = 'Converted' WHERE id = $1", [enquiryId]);
        await client.query("COMMIT");

        res.status(200).json({
            success: true,
            message: "Enquiry converted successfully.",
            data: admissionController.mapToFrontend(result.admission),
            receiptId: result.receiptId
        });

    } catch (err) {
        if (client) await client.query("ROLLBACK");
        console.error(err);

        res.status(err.status || 500).json({
            success: false,
            message: err.message
        });
    } finally { if (client) client.release(); }
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
