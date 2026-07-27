const Demo = require("../models/demoModel");
const db = require("../config/db");
const admissionController = require("./admissionController");

const mapToFrontend = (d) => {
    if (!d) return null;
    return {
        id: `DM-${d.id}`,
        student: d.student_name || "",
        course: d.course_name || "",
        batch: d.batch_name || "",
        teacher: d.teacher_name || "",
        date: d.demo_date ? String(d.demo_date).slice(0, 10) : "",
        time: d.demo_time || "",
        status: d.status || "Scheduled",
        feedback: d.feedback || "-"
    };
};

const mapToDatabase = (f) => {
    return {
        student_name: f.student,
        course_name: f.course,
        batch_name: f.batch,
        teacher_name: f.teacher,
        demo_date: f.date || null,
        demo_time: f.time || null,
        status: f.status || "Scheduled",
        feedback: f.feedback || null,
        enquiry_id: f.enquiry_id || null
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

        if (!dbReady.student_name) {
            return res.status(400).json({ success: false, message: "Student name is required" });
        }
        if (!dbReady.course_name) {
            return res.status(400).json({ success: false, message: "Course name is required" });
        }

        // Auto-assign Teacher, Batch, and Time from the registered course if not explicitly passed
        const courseInfo = await Demo.getCourseDetails(dbReady.course_name);
        if (courseInfo) {
            if (!dbReady.teacher_name) dbReady.teacher_name = courseInfo.teacher_name || "Assigned Teacher";
            if (!dbReady.batch_name) dbReady.batch_name = courseInfo.batch_name || "Regular Batch";
            if (!dbReady.demo_time) dbReady.demo_time = courseInfo.timing || "10:00 AM";
        }

        const created = await Demo.create(dbReady);

        // Update corresponding enquiry status safely
        if (dbReady.enquiry_id) {
            await db.query(
                "UPDATE enquiries SET status = 'Demo Scheduled' WHERE id = $1 AND status NOT IN ('Converted', 'Enrolled')",
                [dbReady.enquiry_id]
            );
        } else {
            await db.query(
                "UPDATE enquiries SET status = 'Demo Scheduled' WHERE student_name = $1 AND status NOT IN ('Converted', 'Enrolled')",
                [dbReady.student_name]
            );
        }

        res.status(201).json({
            success: true,
            message: "Demo scheduled and student assigned to course batch/teacher",
            data: mapToFrontend(created)
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateDemo = async (req, res) => {
    try {
        const rawId = req.params.id ? String(req.params.id).replace("DM-", "") : "";
        const id = Number(rawId);
        
        if (!id) {
            return res.status(400).json({ success: false, message: "Invalid demo ID provided" });
        }

        const dbReady = mapToDatabase(req.body);

        // Auto-fill teacher/batch/time if updated course requires it
        if (dbReady.course_name) {
            const courseInfo = await Demo.getCourseDetails(dbReady.course_name);
            if (courseInfo) {
                if (!dbReady.teacher_name) dbReady.teacher_name = courseInfo.teacher_name;
                if (!dbReady.batch_name) dbReady.batch_name = courseInfo.batch_name;
                if (!dbReady.demo_time) dbReady.demo_time = courseInfo.timing;
            }
        }

        const updated = await Demo.update(id, dbReady);

        if (!updated) {
            return res.status(404).json({ success: false, message: "Demo class record not found" });
        }

        // Synchronize active enquiry pipelines if demo is marked completed
        if (dbReady.status === 'Completed') {
            if (updated.enquiry_id) {
                await db.query(
                    "UPDATE enquiries SET status = 'Demo Completed' WHERE id = $1 AND status NOT IN ('Converted', 'Enrolled')",
                    [updated.enquiry_id]
                );
            } else {
                await db.query(
                    "UPDATE enquiries SET status = 'Demo Completed' WHERE student_name = $1 AND status NOT IN ('Converted', 'Enrolled')",
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
        const rawId = req.params.id ? String(req.params.id).replace("DM-", "") : "";
        const id = Number(rawId);

        if (!id) {
            return res.status(400).json({ success: false, message: "Invalid demo ID provided" });
        }

        client = await db.connect();
        await client.query("BEGIN");

        const demoRes = await client.query("SELECT * FROM demo_classes WHERE id = $1", [id]);
        const demoRow = demoRes.rows[0];

        if (!demoRow) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, message: "Demo instance record not found" });
        }

        const enquiry = await client.query(
            "SELECT * FROM enquiries WHERE student_name = $1 AND status != 'Converted' ORDER BY id DESC LIMIT 1",
            [demoRow.student_name]
        );

        if (!enquiry.rows.length) {
            throw Object.assign(new Error("A matching active enquiry with contact details is required before conversion."), { status: 400 });
        }

        const e = enquiry.rows[0];

        const cleanMobile = String(e.mobile || "").trim().replace(/[\s-]/g, "");
        if (!cleanMobile) {
            throw Object.assign(
                new Error("The matching enquiry has no mobile number recorded. Please update the enquiry with a valid mobile number first."),
                { status: 400 }
            );
        }

        const result = await admissionController.createAdmissionRecord({
            name: e.student_name,
            mobile: cleanMobile,
            parent: e.parent_name,
            cls: e.class_level,
            course: demoRow.course_name,
            batch: demoRow.batch_name,
            teacher: demoRow.teacher_name,
            feeType: "Demo Conversion",
            feeAmt: 0,
            paid: 0,
            discount: 0,
            fine: 0,
            mode: "Cash",
            admission: new Date().toISOString().slice(0, 10)
        }, { client, source: "demo" });

        await client.query("UPDATE demo_classes SET status = 'Completed' WHERE id = $1", [id]);
        await client.query("UPDATE enquiries SET status = 'Converted' WHERE id = $1", [e.id]);
        
        await client.query("COMMIT");

        res.status(200).json({
            success: true,
            message: "Demo converted to admission and assigned to teacher/batch.",
            data: admissionController.mapToFrontend(result.admission),
            receiptId: result.receiptId
        });
    } catch (err) {
        if (client) await client.query("ROLLBACK");
        console.error("Error during demo conversion:", err);
        res.status(err.status || 500).json({
            success: false,
            message: err.message || "Unable to convert the demo."
        });
    } finally {
        if (client) client.release();
    }
};