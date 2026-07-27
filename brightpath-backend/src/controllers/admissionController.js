const crypto = require("crypto");
const admissionModel = require("../models/admissionModel");
const PendingFee = require("../models/pendingfeeModel");
const db = require("../config/db");

class RequestError extends Error {
    constructor(message, status = 400) { 
        super(message); 
        this.status = status; 
    }
}

const sendError = (res, err) => {
    if (err instanceof RequestError) {
        return res.status(err.status).json({ success: false, message: err.message });
    }
    if (err?.code === "23505") {
        return res.status(409).json({ success: false, message: "An admission or student already exists for this entry." });
    }
    console.error("Admission request failed:", err);
    return res.status(500).json({ success: false, message: "Unable to complete the admission request." });
};

const mapToFrontend = a => !a ? null : ({
    id: String(a.id),
    receiptCode: a.receipt_code || "",
    name: a.student_name,
    mobile: a.mobile || "",
    parent: a.parent_name || "",
    parentMobile: a.parent_mobile || "",
    cls: a.class_level || "",
    courseId: a.course_id,
    course: a.course_name || "",
    batchId: a.batch_id,
    batch: a.batch_name || "",
    feeType: a.fee_type,
    feeAmt: Number(a.fee_amount) || 0,
    admission: a.admission_date || "",
    feeStatus: a.effective_fee_status || a.fee_status,
    gender: a.gender || "",
    dob: a.dob || "",
    address: a.address || "",
    school: a.school_name || ""
});

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const dateIsValid = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

const allowedGenders = new Set(["M", "F", "MALE", "FEMALE", "O", "OTHER"]);

const validatePayload = input => {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new RequestError("Admission details are required.");
    }
    const p = { ...input };

    // Trim string inputs
    ["name", "mobile", "parent", "parentMobile", "cls", "course", "batch", "feeType", "admission", "mode", "txn", "remarks", "gender", "dob", "address", "school"].forEach(k => {
        if (typeof p[k] === "string") p[k] = p[k].trim();
    });

    // Handle Gender mapping/normalization
    if (p.gender) {
        const g = p.gender.toUpperCase();
        if (g === "MALE" || g === "M") p.gender = "M";
        else if (g === "FEMALE" || g === "F") p.gender = "F";
        else if (g === "OTHER" || g === "O") p.gender = "O";
        else throw new RequestError("Invalid gender value.");
    } else {
        p.gender = null; // Provide fallback if optional
    }

    // Label mapping for human-readable error messages
    const requiredLabels = {
        name: "Student Name",
        mobile: "Student Mobile Number",
        parent: "Parent Name",
        parentMobile: "Parent Mobile Number",
        cls: "Class",
        course: "Course",
        batch: "Batch",
        feeType: "Fee Type",
        admission: "Admission Date",
        gender: "Gender",
        dob: "Date of Birth",
        address: "Address",
        school: "School Name"
    };

    // 1. ALL fields validation - Reject empty values
    Object.keys(requiredLabels).forEach(key => {
        if (!p[key]) {
            throw new RequestError(`${requiredLabels[key]} is required.`);
        }
    });

    // 2. Mobile validation
    if (!/^\+?[0-9]{7,15}$/.test(p.mobile.replace(/[\s-]/g, ""))) {
        throw new RequestError("Enter a valid student mobile number.");
    }
    if (!/^\+?[0-9]{7,15}$/.test(p.parentMobile.replace(/[\s-]/g, ""))) {
        throw new RequestError("Enter a valid parent mobile number.");
    }

    // 3. Date validation
    if (!dateIsValid(p.admission)) throw new RequestError("Admission date must be a valid date (YYYY-MM-DD).");
    if (!dateIsValid(p.dob)) throw new RequestError("Date of birth must be a valid date (YYYY-MM-DD).");

    // 4. Financial field parsing & validation
    ["feeAmt", "paid", "discount", "fine"].forEach(k => {
        if (!has(p, k)) p[k] = k === "feeAmt" ? undefined : 0;
        p[k] = Number(p[k]);
        if (!Number.isFinite(p[k]) || p[k] < 0) {
            throw new RequestError(`${k === "feeAmt" ? "Fee amount" : k} must be a non-negative number.`);
        }
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

// BEFORE
async function nextStudentCode(client) {
    await client.query("SELECT pg_advisory_xact_lock(842019)");
    const result = await client.query(
        "SELECT MAX(CAST(SUBSTRING(student_code FROM 'STU-([0-9]+)') AS INTEGER)) AS max_num FROM students WHERE student_code ~ '^STU-[0-9]+$'"
    );
    // Setting fallback to 999 ensures the very first student code is STU-1000
    return `STU-${(result.rows[0].max_num ?? 999) + 1}`;
}
async function createAdmissionRecord(input, { client, source = "direct" } = {}) {
    const payload = validatePayload(input);
    const ownsClient = !client;
    const tx = client || await db.connect();

    try {
        if (ownsClient) await tx.query("BEGIN");

        const duplicate = await tx.query(
            "SELECT id FROM students WHERE mobile = $1 AND course_id = (SELECT id FROM courses WHERE " + 
            (payload.courseId ? "id = $2" : "LOWER(TRIM(course_name)) = LOWER(TRIM($2))") + " LIMIT 1)", 
            [payload.mobile, payload.courseId || payload.course]
        );
        if (duplicate.rows.length) throw new RequestError("A student with this mobile number already exists in this course.", 409);

        const courseId = await resolveCourseId(payload, tx);
        const batchId = await resolveBatchId(payload, courseId, tx);
        const studentCode = await nextStudentCode(tx);
        const receiptCode = `${source === "demo" ? "DEMO" : source === "enquiry" ? "ENQ" : "ADM"}-${crypto.randomUUID()}`;

        // 1. Insert into Students table with mandatory personal info and defaults
        const studentRes = await tx.query(`
            INSERT INTO students (
                student_code, student_name, mobile, parent_name, parent_mobile, 
                class_name, course_id, batch_id, fee_type, fee_amount, 
                admission_date, status, fee_status, attendance, gender, dob, address, school_name
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Active', $12, 0, $13, $14, $15, $16) 
            RETURNING *`,
            [
                studentCode, payload.name, payload.mobile, payload.parent, payload.parentMobile,
                payload.cls, courseId, batchId, payload.feeType, payload.feeAmt,
                payload.admission, payload.feeStatus, payload.gender, payload.dob, payload.address, payload.school
            ]
        );
        const createdStudent = studentRes.rows[0];

        // 2. Insert into Admissions table
        const admission = await tx.query(`
            INSERT INTO admissions (
                receipt_code, student_name, mobile, parent_name, class_level, 
                course_id, batch_id, fee_type, fee_amount, admission_date, fee_status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
            RETURNING id`,
            [receiptCode, payload.name, payload.mobile, payload.parent, payload.cls, courseId, batchId, payload.feeType, payload.feeAmt, payload.admission, payload.feeStatus]
        );

        // 3. Insert Fee Receipt
        const feeReceipt = await tx.query(`
            INSERT INTO fee_receipts (
                id, student_id, student_name, batch_name, fee_type, period, 
                due_amount, discount, fine, paid_amount, payment_mode, 
                transaction_id, collected_by, payment_date, balance, remarks
            )
            VALUES ($1, $2, $3, (SELECT batch_name FROM batches WHERE id=$4), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
            RETURNING id`,
            [
                `RCP-${crypto.randomUUID()}`, studentCode, payload.name, batchId, payload.feeType, 
                payload.period || payload.admission, payload.feeAmt, payload.discount, payload.fine, 
                payload.paid, payload.mode, payload.txn || null, "Admission", payload.admission, payload.balance, payload.remarks || null
            ]
        );
// 4. Seed initial pending fee record for downstream fee module operations
        if (payload.balance > 0 && PendingFee && typeof PendingFee.seedInitialPendingFee === "function") {
            try {
                // Fetch batch name using batchId since student table only holds batch_id
                const batchRes = await tx.query("SELECT batch_name FROM batches WHERE id = $1 LIMIT 1", [batchId]);
                const batchName = batchRes.rows[0]?.batch_name || "";

                await PendingFee.seedInitialPendingFee(
                    {
                        ...createdStudent,
                        batch_name: batchName,
                        balance: payload.balance,
                        period: payload.period || new Date(payload.admission).toLocaleString("en-US", { month: "short", year: "numeric" })
                    },
                    tx // Pass active transaction handle
                );
            } catch (seedErr) {
                console.error("Pending fee seed warning:", seedErr);
            }
        }

        const full = await tx.query(`
            SELECT a.*, c.course_name, b.batch_name 
            FROM admissions a 
            LEFT JOIN courses c ON a.course_id = c.id 
            LEFT JOIN batches b ON a.batch_id = b.id 
            WHERE a.id = $1`, 
            [admission.rows[0].id]
        );

        if (ownsClient) await tx.query("COMMIT");
        return { admission: full.rows[0], receiptId: feeReceipt.rows[0].id, studentId: createdStudent.id };

    } catch (err) {
        if (ownsClient) await tx.query("ROLLBACK");
        throw err;
    } finally { 
        if (ownsClient) tx.release(); 
    }
}

// Controller Endpoints
const getAdmissions = async (req, res) => {
    try {
        const [rows, stats] = await Promise.all([
            admissionModel.getAllAdmissions(),
            admissionModel.getAdmissionStats()
        ]);
        res.status(200).json({
            success: true,
            stats: {
                thisMonth: Number(stats.month_count) || 0,
                thisQuarter: Number(stats.quarter_count) || 0,
                fromDemos: Number(stats.demo_count) || 0,
                avgFee: Number(stats.avg_fee) || 0
            },
            data: rows.map(mapToFrontend)
        });
    } catch (err) { 
        sendError(res, err); 
    }
};

const createAdmission = async (req, res) => {
    try {
        const result = await createAdmissionRecord(req.body);
        res.status(201).json({
            success: true,
            message: "Admission completed and receipt generated.",
            data: mapToFrontend(result.admission),
            receiptId: result.receiptId
        });
    } catch (err) { 
        sendError(res, err); 
    }
};

module.exports = { 
    getAdmissions, 
    createAdmission, 
    createAdmissionRecord, 
    mapToFrontend, 
    validatePayload 
};