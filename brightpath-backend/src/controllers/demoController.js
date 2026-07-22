const Demo = require("../models/demoModel");
const db = require("../config/db");

const mapToFrontend = (d) => {
    if (!d) return null;
    return {
        id: `DM-${d.id}`,
        student: d.student_name,
        course: d.course_name,
        batch: d.batch_name,
        teacher: d.teacher_name,
        date: d.demo_date ? d.demo_date.toISOString().split('T')[0] : "",
        time: d.demo_time,
        status: d.status,
        feedback: d.feedback || "-"
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
        const created = await Demo.create(dbReady);

        await db.query(
            "UPDATE enquiries SET status = 'Demo Scheduled' WHERE student_name = $1 AND status != 'Converted'",
            [dbReady.student_name]
        );

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

        // Synchronize with active enquiry pipelines if marked completed
        if (dbReady.status === 'Completed') {
            await db.query(
                "UPDATE enquiries SET status = 'Demo Completed' WHERE student_name = $1 AND status != 'Converted'",
                [dbReady.student_name]
            );
        }

        res.status(200).json({ success: true, message: "Demo class updated", data: mapToFrontend(updated) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.convertDemoToAdmission = async (req, res) => {
    try {
        const id = req.params.id.replace("DM-", "");
        const demoRow = await Demo.getById(id);

        if (!demoRow) {
            return res.status(404).json({ success: false, message: "Demo instance record not found" });
        }

        // 1. Force state updates on demo class tracking to Completed
        await Demo.update(id, { ...demoRow, status: 'Completed' });

        // 2. Synchronize Enquiry Pipeline to 'Converted' state
        await db.query(
            "UPDATE enquiries SET status = 'Converted' WHERE student_name = $1",
            [demoRow.student_name]
        );

        // 3. SAFE LOOKUP: Resolve or auto-generate course records to prevent FK violations
        let courseId = null;
        if (demoRow.course_name) {
            const courseRes = await db.query("SELECT id FROM courses WHERE course_name = $1 LIMIT 1", [demoRow.course_name]);
            if (courseRes.rows.length > 0) {
                courseId = courseRes.rows[0].id;
            } else {
                // Generate fallback parameters if course fields require more columns than course_name
                const newCourse = await db.query("INSERT INTO courses (course_name) VALUES ($1) RETURNING id", [demoRow.course_name]);
                courseId = newCourse.rows[0].id;
            }
        }

        // 4. SAFE LOOKUP: Resolve or auto-generate batch records safely with batch_code
        let batchId = null;
        if (demoRow.batch_name) {
            const batchRes = await db.query("SELECT id FROM batches WHERE batch_name = $1 AND course_id = $2 LIMIT 1", [demoRow.batch_name, courseId]);
            if (batchRes.rows.length > 0) {
                batchId = batchRes.rows[0].id;
            } else {
                // Generate a randomized batch code matching standard layouts (e.g., BTC-84291)
                const generatedBatchCode = `BTC-${Math.floor(10000 + Math.random() * 90000)}`;
                
                // Added batch_code field safely into the insert query pipeline
                const newBatch = await db.query(`
                    INSERT INTO batches (batch_name, batch_code, course_id) 
                    VALUES ($1, $2, $3) 
                    RETURNING id
                `, [demoRow.batch_name, generatedBatchCode, courseId]);
                
                batchId = newBatch.rows[0].id;
            }
        }

        // Fetch mobile number lookup fallback from enquiries to bridge details securely
        const enqData = await db.query("SELECT mobile, parent_name, class_level FROM enquiries WHERE student_name = $1 LIMIT 1", [demoRow.student_name]);
        const mobileNum = enqData.rows.length > 0 ? enqData.rows[0].mobile : "0000000000";
        const parentName = enqData.rows.length > 0 ? enqData.rows[0].parent_name : "Parent";
        const classLevel = enqData.rows.length > 0 ? enqData.rows[0].class_level : "Class 10";

        // 5. Verify duplicate avoidance logic and insert cleanly
        const checkAdmit = await db.query("SELECT id FROM admissions WHERE student_name = $1 AND mobile = $2", [demoRow.student_name, mobileNum]);
        
        if (checkAdmit.rows.length === 0) {
            await db.query(`
                INSERT INTO admissions (
                    receipt_code, student_name, mobile, parent_name, 
                    class_level, course_id, batch_id, fee_type, 
                    fee_amount, admission_date, fee_status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE, $10)
            `, [
                `RCP-${Date.now().toString().slice(-5)}`,
                demoRow.student_name,
                mobileNum,
                parentName,
                classLevel,
                courseId,
                batchId,
                'From Demos',
                2450.00,
                'Paid'
            ]);
        }

        res.status(200).json({ success: true, message: "Demo converted successfully to active student admission profile" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};