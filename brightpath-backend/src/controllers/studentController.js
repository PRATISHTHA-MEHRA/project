const Student = require("../models/studentModel");
const db = require("../config/db"); // Needed to perform lookup queries


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

    // Last-resort fallback so create() never fails outright on a missing course
    if (!courseId) {
        const fallbackCourse = await db.query("SELECT id FROM courses ORDER BY id ASC LIMIT 1");
        if (fallbackCourse.rows.length > 0) {
            courseId = fallbackCourse.rows[0].id;
        } else {
            throw new Error("Cannot handle student records because no courses exist in your database.");
        }
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

    if (!batchId) {
        batchId = existingStudent?.batch_id ?? null;
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
        res.status(500).json({
            success: false,
            message: err.message
        });
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
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Create Student
exports.createStudent = async (req, res) => {
    try {
        if (!req.body.name || !req.body.name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Student name is required."
            });
        }

        
        const dbReadyData = await mapToDatabase(req.body);
        const created = await Student.create(dbReadyData);

   
        const fullStudent = await Student.getById(created.id);

        res.status(201).json({
            success: true,
            message: "Student created successfully",
            data: fullStudent
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
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

        if (req.body.name !== undefined && !req.body.name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Student name cannot be empty."
            });
        }

        const dbReadyData = await mapToDatabase(req.body, existingStudent);
        await Student.update(req.params.id, dbReadyData);

        
        const fullStudent = await Student.getById(req.params.id);

        res.status(200).json({
            success: true,
            message: "Student updated successfully",
            data: fullStudent
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Delete Student
exports.deleteStudent = async (req, res) => {
    try {
        await Student.delete(req.params.id);
        res.status(200).json({
            success: true,
            message: "Student deleted successfully"
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};