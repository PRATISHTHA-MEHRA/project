const Demo = require("../models/demoModel");
const Enquiry = require("../models/enquiryModel");
const db = require("../config/db");
const admissionController = require("./admissionController");

const mapToFrontend = (d) => {
    if (!d) return null;
    return {
        id: `DM-${d.id}`,
        student: d.student_name,
        course: d.course_name,
        batch: d.batch_name,
        teacher: d.teacher_name,
        date: d.demo_date ? d.demo_date : "",
        time: d.demo_time,
        status: d.status,
        feedback: d.feedback || "-",
        enquiryId: d.enquiry_id || null
    };
};

const mapToDatabase = (f) => {
    return {
        student_name: f.student,
        course_name: f.course,
        batch_name: f.batch,
        teacher_name: f.teacher,
        demo_date: f.date,
        demo_time: f.time,
        status: f.status,
        feedback: f.feedback
    };
};

exports.getDemos = async (req, res) => {
    try {
        const rows = await Demo.getAll();
        res.status(200).json({ success: true, data: rows.map(mapToFrontend) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createDemo = async (req, res) => {
    try {
        const dbReady = mapToDatabase(req.body);

        // A demo scheduled directly from this page (rather than via the
        // enquiry's own status field) still needs to be linked to its
        // enquiry, so both modules stay in sync going forward.
        const matchedEnquiry = await Enquiry.getOpenByName(dbReady.student_name);
        if (matchedEnquiry) dbReady.enquiry_id = matchedEnquiry.id;

        const created = await Demo.create(dbReady);

        if (matchedEnquiry) {
            await db.query(
                "UPDATE enquiries SET status = 'Demo Scheduled' WHERE id = $1",
                [matchedEnquiry.id]
            );
        }

        res.status(201).json({ success: true, message: "Demo scheduled", data: mapToFrontend(created) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateDemo = async (req, res) => {
    try {
        const id = req.params.id.replace("DM-", "");
        const dbReady = mapToDatabase(req.body);
        const updated = await Demo.update(id, dbReady);

        // Synchronize with active enquiry pipelines if marked completed.
        // Prefer the real enquiry_id link; fall back to name matching only
        // for older demo records created before that link existed.
        if (dbReady.status === 'Completed') {
            if (updated.enquiry_id) {
                await db.query(
                    "UPDATE enquiries SET status = 'Demo Completed' WHERE id = $1 AND status != 'Converted'",
                    [updated.enquiry_id]
                );
            } else {
                await db.query(
                    "UPDATE enquiries SET status = 'Demo Completed' WHERE student_name = $1 AND status != 'Converted'",
                    [dbReady.student_name]
                );
            }
        }

        res.status(200).json({ success: true, message: "Demo class updated", data: mapToFrontend(updated) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.convertDemoToAdmission = async (req, res) => {
    let client;
    try {
        const id = req.params.id.replace("DM-", "");
        const demoRow = await Demo.getById(id);

        if (!demoRow) {
            return res.status(404).json({ success: false, message: "Demo instance record not found" });
        }

        client = await db.connect();
        await client.query("BEGIN");

        // Prefer the real enquiry_id link; fall back to name matching only
        // for older demo records created before that link existed.
        let e;
        if (demoRow.enquiry_id) {
            const byId = await client.query("SELECT * FROM enquiries WHERE id = $1", [demoRow.enquiry_id]);
            e = byId.rows[0];
        }
        if (!e) {
            const byName = await client.query(
                "SELECT * FROM enquiries WHERE student_name = $1 AND status != 'Converted' ORDER BY id DESC LIMIT 1",
                [demoRow.student_name]
            );
            e = byName.rows[0];
        }
        if (!e) throw Object.assign(new Error("A matching active enquiry with contact details is required before conversion."), { status: 400 });

        const result = await admissionController.createAdmissionRecord({
            name: e.student_name, mobile: e.mobile, parent: e.parent_name, cls: e.class_level,
            course: demoRow.course_name, batch: demoRow.batch_name, feeType: "Demo Conversion",
            feeAmt: 0, paid: 0, discount: 0, fine: 0, mode: "Cash",
            admission: new Date().toISOString().slice(0, 10)
        }, { client, source: "demo" });
        await client.query("UPDATE demo_classes SET status = 'Completed' WHERE id = $1", [id]);
        await client.query("UPDATE enquiries SET status = 'Converted' WHERE id = $1", [e.id]);
        await client.query("COMMIT");
        res.status(200).json({ success: true, message: "Demo converted to admission.", data: admissionController.mapToFrontend(result.admission), receiptId: result.receiptId });
    } catch (err) {
        if (client) await client.query("ROLLBACK");
        console.error(err);
        res.status(err.status || 500).json({ success: false, message: err.status ? err.message : "Unable to convert the demo." });
    } finally { if (client) client.release(); }
};