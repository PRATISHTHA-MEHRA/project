const Demo = require("../../../models/demoModel");
const db = require("../../../config/db");
const admissionController = require("../admission/admissionController");

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

        // Gather parameters sent from frontend modal fallback to demo record
        const body = req.body || {};
        const cleanMobile = String(body.mobile || "").trim().replace(/[\s-]/g, "");

        if (!cleanMobile) {
            throw Object.assign(new Error("A valid student mobile number is required for conversion."), { status: 400 });
        }

        const result = await admissionController.createAdmissionRecord({
            name: body.name || demoRow.student_name,
            mobile: cleanMobile,
            parent: body.parent || "",
            parentMobile: body.parentMobile || "",
            gender: body.gender || "M",
            dob: body.dob || null,
            school: body.school || "",
            address: body.address || "",
            cls: body.cls || "Class 10",
            course: demoRow.course_name,
            batch: demoRow.batch_name,
            teacher: demoRow.teacher_name,
            feeType: "Demo Conversion",
            feeAmt: Number(body.feeAmt) || 0,
            paid: Number(body.paid) || 0,
            discount: Number(body.discount) || 0,
            fine: Number(body.fine) || 0,
            mode: body.mode || "Cash",
            admission: body.admission || new Date().toISOString().slice(0, 10)
        }, { client, source: "demo" });

        // Update Demo status to Completed
        await client.query("UPDATE demo_classes SET status = 'Completed' WHERE id = $1", [id]);
        
        // Mark associated enquiry as Converted if matching name exists
        await client.query(
            "UPDATE enquiries SET status = 'Converted' WHERE student_name = $1 AND status != 'Converted'", 
            [demoRow.student_name]
        );
        
        await client.query("COMMIT");

        res.status(200).json({
            success: true,
            message: "Demo converted to admission successfully.",
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