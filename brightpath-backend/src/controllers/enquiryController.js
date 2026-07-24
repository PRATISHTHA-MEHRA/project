const Enquiry = require("../models/enquiryModel");
const Demo = require("../models/demoModel");
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
        batch: e.batch_name || "",
        teacher: e.teacher_name || "",
        demoDate: e.demo_date ? new Date(e.demo_date).toISOString().split("T")[0] : "",
        demoTime: e.demo_time || "",
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
    batch_name: f.batch || null,
    teacher_name: f.teacher || null,
    demo_date: f.demoDate || null,
    demo_time: f.demoTime || null,
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

// Mobile is optional, but if it's provided it must be exactly 10 digits.
// This is checked here (not just in the browser) because the API can be
// called directly, bypassing whatever the webpage enforces.
const isValidMobile = (mobile) => !mobile || /^\d{10}$/.test(mobile);

// Keeps the Demo Classes module in sync whenever an enquiry's status is set
// (or created) as "Demo Scheduled" or "Demo Completed" - whether that happens
// on a brand-new enquiry or on an edit to an existing one.
// - If no demo record exists for this enquiry yet, one is created straight
//   away with the matching status (Scheduled or Completed).
// - If one already exists, it's updated to match, but only if it's not
//   already at that status.
async function syncDemoWithStatus(enquiryRow, status) {
    if (status !== "Demo Scheduled" && status !== "Demo Completed") return;

    const targetDemoStatus = status === "Demo Completed" ? "Completed" : "Scheduled";
    const linkedDemo = await Demo.getByEnquiryId(enquiryRow.id);

    if (!linkedDemo) {
        await Demo.create({
            student_name: enquiryRow.student_name,
            course_name: enquiryRow.course_interest,
            batch_name: enquiryRow.batch_name,
            teacher_name: enquiryRow.teacher_name,
            demo_date: enquiryRow.demo_date,
            demo_time: enquiryRow.demo_time,
            status: targetDemoStatus,
            feedback: "-",
            enquiry_id: enquiryRow.id
        });
        return;
    }

    if (linkedDemo.status !== targetDemoStatus) {
        await Demo.update(linkedDemo.id, {
            student_name: linkedDemo.student_name,
            course_name: linkedDemo.course_name,
            batch_name: linkedDemo.batch_name,
            teacher_name: linkedDemo.teacher_name,
            demo_date: linkedDemo.demo_date,
            demo_time: linkedDemo.demo_time,
            status: targetDemoStatus,
            feedback: linkedDemo.feedback
        });
    }
}

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
        if (!isValidMobile(dbReady.mobile)) {
            return res.status(400).json({ success: false, message: "Mobile number must be exactly 10 digits" });
        }
        if ((dbReady.status === "Demo Scheduled" || dbReady.status === "Demo Completed") && (!dbReady.batch_name || !dbReady.teacher_name || !dbReady.demo_date || !dbReady.demo_time)) {
            return res.status(400).json({ success: false, message: "Select a batch, teacher, date and time before setting this status" });
        }
        const created = await Enquiry.create(dbReady);
        await syncDemoWithStatus(created, dbReady.status);
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
        if (!isValidMobile(dbReady.mobile)) {
            return res.status(400).json({ success: false, message: "Mobile number must be exactly 10 digits" });
        }

        // Conversion (and the resulting admission record) only ever happens
        // through /convert, so an edit-form status change can't fake it.
        if (dbReady.status === "Converted") {
            return res.status(400).json({
                success: false,
                message: "Use the Convert action to mark an enquiry as converted"
            });
        }
        if ((dbReady.status === "Demo Scheduled" || dbReady.status === "Demo Completed") && (!dbReady.batch_name || !dbReady.teacher_name || !dbReady.demo_date || !dbReady.demo_time)) {
            return res.status(400).json({ success: false, message: "Select a batch, teacher, date and time before setting this status" });
        }

        const updated = await Enquiry.update(id, dbReady);
        if (!updated) return res.status(404).json({ success: false, message: "Enquiry not found" });

        // Keep the Demo Classes module in sync when the status is changed
        // here on the Enquiries page, instead of from the Demo Classes page.
        await syncDemoWithStatus(updated, dbReady.status);

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