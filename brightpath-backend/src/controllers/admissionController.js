const admissionModel = require("../models/admissionModel");
const db = require("../config/db");

const mapToFrontend = (a) => {
    if (!a) return null;
    return {
        id: a.id.toString(),
        name: a.student_name,
        course: a.course_name || "",
        batch: a.batch_name || "",
        feeType: a.fee_type,
        feeAmt: parseFloat(a.fee_amount) || 0,
        admission: a.admission_date ? a.admission_date : "",
        feeStatus: a.fee_status
    };
};

const getAdmissions = async (req, res) => {
    try {
        const rows = await admissionModel.getAllAdmissions();
        const formattedList = rows.map(r => mapToFrontend(r));
        const stats = await admissionModel.getAdmissionStats();

        res.status(200).json({
            success: true,
            stats: {
                thisMonth: parseInt(stats.month_count) || 0,
                thisQuarter: parseInt(stats.quarter_count) || 0,
                fromDemos: parseInt(stats.demo_count) || 0,
                avgFee: parseInt(stats.avg_fee) || 0
            },
            data: formattedList
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error fetching admissions and stats" });
    }
};

async function resolveCourseId(payload) {
    if (payload.courseId) {
        const result = await db.query("SELECT id FROM courses WHERE id = $1", [payload.courseId]);
        if (result.rows.length === 0) throw new Error(`Course id ${payload.courseId} does not exist`);
        return result.rows[0].id;
    }
    if (payload.course) {
        const result = await db.query("SELECT id FROM courses WHERE course_name = $1 LIMIT 1", [payload.course]);
        if (result.rows.length === 0) throw new Error(`Course "${payload.course}" was not found`);
        return result.rows[0].id;
    }
    throw new Error("Course is required");
}

async function resolveBatchId(payload, courseId) {
    if (payload.batchId) {
        const result = await db.query(
            "SELECT id FROM batches WHERE id = $1 AND course_id = $2",
            [payload.batchId, courseId]
        );
        if (result.rows.length === 0) throw new Error("Selected batch does not belong to the selected course");
        return result.rows[0].id;
    }
    if (payload.batch) {
        const result = await db.query(
            "SELECT id FROM batches WHERE batch_name = $1 AND course_id = $2 LIMIT 1",
            [payload.batch, courseId]
        );
        if (result.rows.length === 0) throw new Error(`Batch "${payload.batch}" was not found for the selected course`);
        return result.rows[0].id;
    }
    throw new Error("Batch is required");
}



async function createAdmissionRecord(payload) {
    if (!payload.name) throw new Error("Student name is required");
    if (!payload.mobile) throw new Error("Mobile number is required");
    if (!payload.feeType) throw new Error("Fee type is required");
    if (payload.feeAmt === undefined || payload.feeAmt === null || payload.feeAmt === "") {
        throw new Error("Fee amount is required");
    }

    const courseId = await resolveCourseId(payload);
    const batchId = await resolveBatchId(payload, courseId);

    const dbData = {
        receipt_code: `RCP-${Date.now().toString().slice(-5)}`,
        student_name: payload.name,
        mobile: payload.mobile,
        parent_name: payload.parent || "",
        class_level: payload.cls || "",
        course_id: courseId,
        batch_id: batchId,
        fee_type: payload.feeType,
        fee_amount: parseFloat(payload.feeAmt),
        admission_date: payload.admission || new Date(),
        fee_status: payload.feeStatus || "Paid"
    };

    const created = await admissionModel.createAdmission(dbData);
    return admissionModel.getAdmissionById(created.id);
}

const createAdmission = async (req, res) => {
    try {
        const fullRecord = await createAdmissionRecord(req.body);
        res.status(201).json({
            success: true,
            message: "Admission completed successfully",
            data: mapToFrontend(fullRecord)
        });
    } catch (error) {
        console.error(error);
  
        res.status(400).json({ success: false, message: error.message || "Error completing admission process" });
    }
};

module.exports = {
    getAdmissions,
    createAdmission,
    createAdmissionRecord, 
    mapToFrontend           
};