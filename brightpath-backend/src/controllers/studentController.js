const Student = require("../models/studentModel");
const db = require("../config/db"); // Needed to perform lookup queries
const Fee = require("../models/feeModel");
const Attendance = require("../models/attendanceModel");
const Marks = require("../models/marksModel");
const PendingFee = require("../models/pendingfeeModel");

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
    console.error("Student request failed:", err);
    return res.status(500).json({ success: false, message: "Unable to process the student request." });
};

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const allowedStatuses = new Set(["Active", "Inactive"]);
const allowedFeeStatuses = new Set(["Paid", "Pending", "Overdue"]);
const allowedGenders = new Set(["M", "F"]);
const isIsoDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

const validateStudentPayload = (body, { creating = false } = {}) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new RequestError("A student data object is required.");
    const data = { ...body };
    ["name", "mobile", "parent", "parentMobile", "cls", "course", "batch", "feeType", "admission", "dob", "school", "address"].forEach(field => {
        if (has(data, field) && typeof data[field] === "string") data[field] = data[field].trim();
    });
    if (creating && !data.name) throw new RequestError("Student name is required.");
    if (has(data, "name") && (!data.name || data.name.length > 120)) throw new RequestError("Enter a valid student name.");
    [["mobile", "Student"], ["parentMobile", "Parent"]].forEach(([field, label]) => {
        if (data[field] && !/^\+?[0-9]{7,15}$/.test(data[field].replace(/[\s-]/g, ""))) throw new RequestError(`${label} mobile must contain 7 to 15 digits.`);
    });
    if (has(data, "status") && !allowedStatuses.has(data.status)) throw new RequestError("Invalid student status.");
    if (has(data, "feeStatus") && !allowedFeeStatuses.has(data.feeStatus)) throw new RequestError("Invalid fee status.");
    if (has(data, "gender") && !allowedGenders.has(data.gender)) throw new RequestError("Invalid gender.");
    [["admission", "Admission date"], ["dob", "Date of birth"]].forEach(([field, label]) => {
        if (data[field] && !isIsoDate(data[field])) throw new RequestError(`${label} must be a valid date.`);
    });
    if (data.dob && data.admission && data.dob > data.admission) throw new RequestError("Date of birth cannot be after the admission date.");
    [["feeAmt", "Fee amount"], ["att", "Attendance"]].forEach(([field, label]) => {
        if (!has(data, field) || data[field] === "") return;
        const value = Number(data[field]);
        if (!Number.isFinite(value) || value < 0 || (field === "att" && value > 100)) throw new RequestError(`${label} must be ${field === "att" ? "between 0 and 100" : "zero or greater"}.`);
        data[field] = value;
    });
    if (creating) {
        ["mobile", "parent", "parentMobile", "cls", "course", "feeType", "admission"].forEach(field => {
            if (!data[field] && !data[`${field}Id`]) throw new RequestError(`${field === "cls" ? "Class" : field.replace(/([A-Z])/g, " $1")} is required.`);
        });
    }
    return data;
};

exports.getStudentFees = async (req, res) => {
    try {
        const student = await Student.getById(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        const fees = await Fee.getReceiptsByStudentId(req.params.id, student.student_code);
        res.status(200).json({ success: true, data: fees });
    } catch (err) {
        sendError(res, err);
    }
};


exports.getStudentAttendance = async (req, res) => {
    try {
        const logs = await Attendance.getRecentLogsByStudent(req.params.id);
        const mapped = logs.map(l => ({
            date: l.attendance_date instanceof Date
                ? l.attendance_date
                : String(l.attendance_date).slice(0, 10),
            batch: l.batch_name,
            status: l.status
        }));
        res.status(200).json({ success: true, data: mapped });
    } catch (err) {
        sendError(res, err);
    }
};

exports.getStudentExams = async (req, res) => {
    try {
        const student = await Student.getById(req.params.id);
        if (!student) throw new RequestError("Student not found", 404);
        const exams = await Marks.getMarksByStudentId(student.id, student.student_code);
        res.status(200).json({ success: true, data: exams });
    } catch (err) {
        sendError(res, err);
    }
};


const generateStudentCode = async () => {
    const res = await db.query(
        `SELECT MAX(CAST(SUBSTRING(student_code FROM 'STU-([0-9]+)') AS INTEGER)) AS max_num
         FROM students
         WHERE student_code ~ '^STU-[0-9]+$'`
    );
    const nextNum = (res.rows[0].max_num ?? 1000) + 1;
    return `STU-${nextNum}`;
};


const mapToDatabase = async (frontendData, existingStudent = null) => {

    // ---- Resolve course_id ----
    let courseId = frontendData.courseId ?? null;

    if (!courseId && frontendData.course) {
        const courseRes = await db.query(
            "SELECT id FROM courses WHERE LOWER(TRIM(course_name)) = LOWER(TRIM($1)) ORDER BY id ASC LIMIT 1",
            [frontendData.course]
        );
        if (courseRes.rows.length > 0) {
            courseId = courseRes.rows[0].id;
        }
    }

    if (!courseId) {
        courseId = existingStudent?.course_id ?? null;
    }

    if (!courseId) {
        throw new RequestError("A valid course is required.");
    }
    const courseExists = await db.query("SELECT id FROM courses WHERE id = $1", [courseId]);
    if (!courseExists.rows.length) {
        throw new RequestError("Selected course does not exist.");
    }

    
    let batchId = frontendData.batchId ?? null;

    if (!batchId && frontendData.batch) {
        const batchRes = await db.query(
            "SELECT id FROM batches WHERE LOWER(TRIM(batch_name)) = LOWER(TRIM($1)) ORDER BY id ASC LIMIT 1",
            [frontendData.batch]
        );
        if (batchRes.rows.length > 0) {
            batchId = batchRes.rows[0].id;
        }
    }

    const batchWasProvided = has(frontendData, "batch") || has(frontendData, "batchId");
    if (!batchId && !batchWasProvided) {
        batchId = existingStudent?.batch_id ?? null;
    }
    if (batchId) {
        const batchExists = await db.query("SELECT id FROM batches WHERE id = $1", [batchId]);
        if (!batchExists.rows.length) throw new RequestError("Selected batch does not exist.");
    }

     let studentCode = existingStudent?.student_code ?? null;
 
    if (!studentCode) {
        studentCode = await generateStudentCode();
    }

    return {
        student_code: studentCode,
        student_name: frontendData.name ?? existingStudent?.student_name ?? null,
        mobile: frontendData.mobile ?? existingStudent?.mobile ?? null,
        parent_name: frontendData.parent ?? existingStudent?.parent_name ?? null,
        parent_mobile: frontendData.parentMobile ?? existingStudent?.parent_mobile ?? null,
        class_name: frontendData.cls ?? existingStudent?.class_name ?? null,
        course_id: courseId,
        batch_id: batchId,
        fee_type: frontendData.feeType ?? existingStudent?.fee_type ?? null,
        fee_amount: frontendData.feeAmt ?? existingStudent?.fee_amount ?? null,
        admission_date: frontendData.admission ?? existingStudent?.admission_date ?? null,
        status: frontendData.status ?? existingStudent?.status ?? "Active",
        fee_status: frontendData.feeStatus ?? existingStudent?.fee_status ?? "Pending",
        attendance: frontendData.att ?? existingStudent?.attendance ?? 0,
        gender: frontendData.gender ?? existingStudent?.gender ?? null,
        dob: frontendData.dob ?? existingStudent?.dob ?? null,
        address: frontendData.address ?? existingStudent?.address ?? null,
        school_name: frontendData.school ?? existingStudent?.school_name ?? null
    };
};

// Get All Students
exports.getStudents = async (req, res) => {
    try {
        const students = await Student.getAll();
        res.status(200).json({
            success: true,
            data: students
        });
    }
    catch (err) {
        sendError(res, err);
    }
};

// Get Student
exports.getStudent = async (req, res) => {
    try {
        const student = await Student.getById(req.params.id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }
        res.status(200).json({
            success: true,
            data: student
        });
    }
    catch (err) {
        sendError(res, err);
    }
};

// Create Student
exports.createStudent = async (req, res) => {
    try {
        const payload = validateStudentPayload(req.body, { creating: true });
        const dbReadyData = await mapToDatabase(payload);
        const created = await Student.create(dbReadyData);

        const fullStudent = await Student.getById(created.id);

        try {
            await PendingFee.seedInitialPendingFee(fullStudent);
        } catch (seedErr) {
            console.error("Pending-fee seed failed for student", fullStudent?.id, ":", seedErr.message);
        }

        res.status(201).json({
            success: true,
            message: "Student created successfully",
            data: fullStudent
        });
    }
    catch (err) {
        sendError(res, err);
    }
};
// Update Student
exports.updateStudent = async (req, res) => {
    try {
        const existingStudent = await Student.getById(req.params.id);

        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const payload = validateStudentPayload(req.body);
        const dbReadyData = await mapToDatabase(payload, existingStudent);
        await Student.update(req.params.id, dbReadyData);

        
        const fullStudent = await Student.getById(req.params.id);

        res.status(200).json({
            success: true,
            message: "Student updated successfully",
            data: fullStudent
        });
    }
    catch (err) {
        sendError(res, err);
    }
};

// Delete Student
exports.deleteStudent = async (req, res) => {
    try {
        const deleted = await Student.delete(req.params.id);
        if (!deleted) throw new RequestError("Student not found", 404);
        res.status(200).json({
            success: true,
            message: "Student deleted successfully"
        });
    }
    catch (err) {
        sendError(res, err);
    }
};
