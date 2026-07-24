const crypto = require("crypto");
const admissionModel = require("../models/admissionModel");
const db = require("../config/db");

class RequestError extends Error {
    constructor(message, status = 400) { super(message); this.status = status; }
}

const sendError = (res, err) => {
    if (err instanceof RequestError) return res.status(err.status).json({ success: false, message: err.message });
    if (err?.code === "23505") return res.status(409).json({ success: false, message: "An admission already exists for this student." });
    console.error("Admission request failed:", err);
    return res.status(500).json({ success: false, message: "Unable to complete the admission." });
};

const mapToFrontend = a => !a ? null : ({
    id: String(a.id), name: a.student_name, mobile: a.mobile || "", parent: a.parent_name || "",
    cls: a.class_level || "", course: a.course_name || "", batch: a.batch_name || "",
    feeType: a.fee_type, feeAmt: Number(a.fee_amount) || 0,
    admission: a.admission_date || "", feeStatus: a.effective_fee_status || a.fee_status
});

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const dateIsValid = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

const validatePayload = input => {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new RequestError("Admission details are required.");
    const p = { ...input };
    ["name", "mobile", "parent", "cls", "course", "batch", "feeType", "admission", "mode", "txn", "remarks"].forEach(k => {
        if (typeof p[k] === "string") p[k] = p[k].trim();
    });
    ["name", "mobile", "parent", "cls", "feeType", "admission"].forEach(k => { if (!p[k]) throw new RequestError(`${k === "cls" ? "Class" : k} is required.`); });
    if (!p.course && !p.courseId) throw new RequestError("Course is required.");
    if (!p.batch && !p.batchId) throw new RequestError("Batch is required.");
    if (!/^\+?[0-9]{7,15}$/.test(p.mobile.replace(/[\s-]/g, ""))) throw new RequestError("Enter a valid mobile number.");
    if (!dateIsValid(p.admission)) throw new RequestError("Admission date must be valid.");
    ["feeAmt", "paid", "discount", "fine"].forEach(k => {
        if (!has(p, k)) p[k] = k === "feeAmt" ? undefined : 0;
        p[k] = Number(p[k]);
        if (!Number.isFinite(p[k]) || p[k] < 0) throw new RequestError(`${k === "feeAmt" ? "Fee amount" : k} must be a non-negative number.`);
    });
    if (!p.mode) p.mode = "Cash";
    p.balance = Math.max(0, p.feeAmt - p.discount + p.fine - p.paid);
    p.feeStatus = p.balance === 0 ? "Paid" : "Pending";
    return p;
};

async function resolveCourseId(payload, client) {
    const result = payload.courseId
        ? await client.query("SELECT id FROM courses WHERE id = $1", [payload.courseId])
        : await client.query("SELECT id FROM courses WHERE LOWER(TRIM(course_name)) = LOWER(TRIM($1)) LIMIT 1", [payload.course]);
    if (!result.rows.length) throw new RequestError("Selected course does not exist.");
    return result.rows[0].id;
}

async function resolveBatchId(payload, courseId, client) {
    const result = payload.batchId
        ? await client.query("SELECT id FROM batches WHERE id = $1 AND course_id = $2", [payload.batchId, courseId])
        : await client.query("SELECT id FROM batches WHERE LOWER(TRIM(batch_name)) = LOWER(TRIM($1)) AND course_id = $2 LIMIT 1", [payload.batch, courseId]);
    if (!result.rows.length) throw new RequestError("Selected batch does not belong to the selected course.");
    return result.rows[0].id;
}

async function nextStudentCode(client) {
    await client.query("SELECT pg_advisory_xact_lock(842019)");
    const result = await client.query("SELECT MAX(CAST(SUBSTRING(student_code FROM 'STU-([0-9]+)') AS INTEGER)) AS max_num FROM students WHERE student_code ~ '^STU-[0-9]+$'");
    return `STU-${(result.rows[0].max_num ?? 1000) + 1}`;
}

async function createAdmissionRecord(input, { client, source = "direct" } = {}) {
    const payload = validatePayload(input);
    const ownsClient = !client;
    const tx = client || await db.connect();
    try {
        if (ownsClient) await tx.query("BEGIN");
        const duplicate = await tx.query("SELECT id FROM students WHERE mobile = $1 LIMIT 1", [payload.mobile]);
        if (duplicate.rows.length) throw new RequestError("A student with this mobile number already exists.", 409);
        const courseId = await resolveCourseId(payload, tx);
        const batchId = await resolveBatchId(payload, courseId, tx);
        const studentCode = await nextStudentCode(tx);
        const receiptCode = `${source === "demo" ? "DEMO" : source === "enquiry" ? "ENQ" : "ADM"}-${crypto.randomUUID()}`;
        const student = await tx.query(`INSERT INTO students (student_code, student_name, mobile, parent_name, class_name, course_id, batch_id, fee_type, fee_amount, admission_date, status, fee_status, attendance)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Active',$11,0) RETURNING id`,
            [studentCode, payload.name, payload.mobile, payload.parent, payload.cls, courseId, batchId, payload.feeType, payload.feeAmt, payload.admission, payload.feeStatus]);
        const admission = await tx.query(`INSERT INTO admissions (receipt_code, student_name, mobile, parent_name, class_level, course_id, batch_id, fee_type, fee_amount, admission_date, fee_status)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
            [receiptCode, payload.name, payload.mobile, payload.parent, payload.cls, courseId, batchId, payload.feeType, payload.feeAmt, payload.admission, payload.feeStatus]);
        const feeReceipt = await tx.query(`INSERT INTO fee_receipts (id, student_id, student_name, batch_name, fee_type, period, due_amount, discount, fine, paid_amount, payment_mode, transaction_id, collected_by, payment_date, balance, remarks)
            VALUES ($1,$2,$3,(SELECT batch_name FROM batches WHERE id=$4),$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
            [`RCP-${crypto.randomUUID()}`, studentCode, payload.name, batchId, payload.feeType, payload.period || payload.admission, payload.feeAmt, payload.discount, payload.fine, payload.paid, payload.mode, payload.txn || null, "Admission", payload.admission, payload.balance, payload.remarks || null]);
        const full = await tx.query(`SELECT a.*, c.course_name, b.batch_name FROM admissions a LEFT JOIN courses c ON a.course_id=c.id LEFT JOIN batches b ON a.batch_id=b.id WHERE a.id=$1`, [admission.rows[0].id]);
        if (ownsClient) await tx.query("COMMIT");
        return { admission: full.rows[0], receiptId: feeReceipt.rows[0].id, studentId: student.rows[0].id };
    } catch (err) {
        if (ownsClient) await tx.query("ROLLBACK");
        throw err;
    } finally { if (ownsClient) tx.release(); }
}

const getAdmissions = async (req, res) => {
    try {
        const [rows, stats] = await Promise.all([admissionModel.getAllAdmissions(), admissionModel.getAdmissionStats()]);
        res.status(200).json({ success: true, stats: { thisMonth: Number(stats.month_count) || 0, thisQuarter: Number(stats.quarter_count) || 0, fromDemos: Number(stats.demo_count) || 0, avgFee: Number(stats.avg_fee) || 0 }, data: rows.map(mapToFrontend) });
    } catch (err) { sendError(res, err); }
};

const createAdmission = async (req, res) => {
    try {
        const result = await createAdmissionRecord(req.body);
        res.status(201).json({ success: true, message: "Admission completed and receipt generated.", data: mapToFrontend(result.admission), receiptId: result.receiptId });
    } catch (err) { sendError(res, err); }
};

module.exports = { getAdmissions, createAdmission, createAdmissionRecord, mapToFrontend, validatePayload };
