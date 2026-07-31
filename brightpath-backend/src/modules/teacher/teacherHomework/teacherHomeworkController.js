const fs = require("fs/promises");
const Homework = require("../../../models/homeworkModel");

/**
 * 1. Get assigned homework for logged-in teacher
 * GET /api/teacher/homework
 */
/**
 * 1. Get assigned homework for logged-in teacher
 * GET /api/teacher/homework
 */
exports.getMyHomework = async (req, res) => {
  try {
    // 1. Read query params (GET) -> 2. Fall back to authenticated user context
    const teacherId = 
      req.query.teacherId || 
      req.query.teacher || 
      req.user?.id || 
      req.user?._id || 
      req.user?.userId;

    const teacherName = 
      req.query.teacherName || 
      req.user?.name || 
      req.user?.teacher_name || 
      req.user?.fullName || 
      req.user?.username;

    if (!teacherId && !teacherName) {
      return res.status(400).json({ 
        success: false, 
        message: "Teacher identification missing in request params or auth session." 
      });
    }

    console.log(`Fetching homework for Teacher Name: "${teacherName || 'N/A'}", ID: "${teacherId || 'N/A'}"`);

    // Fetch matching homework using both properties
    const data = await Homework.getHomeworkByTeacher(teacherId, teacherName);
    
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 2. Assign new homework by Teacher
 * POST /api/teacher/homework
 */
// Inside createTeacherHomework in teacherHomeworkController.js

// teacherHomeworkController.js
const teacherModel = require("../../../models/teacherModel"); // path to the model you provided

exports.createTeacherHomework = async (req, res) => {
  try {
    let teacherName = 
      req.user?.name || 
      req.user?.teacher_name || 
      req.user?.fullName || 
      req.body.teacher_name;

    const teacherId = req.user?.id || req.user?._id || req.body.teacher;

    // If req.user.name was missing, fetch the teacher's profile from DB using their ID
    if (!teacherName && teacherId) {
      const teacherObj = await teacherModel.getById(teacherId);
      if (teacherObj) {
        teacherName = teacherObj.teacher_name;
      }
    }

    // Final fallback to ID if teacher record isn't found
    const finalTeacher = teacherName || String(teacherId);

    if (!finalTeacher) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication error: Could not identify logged-in teacher." 
      });
    }

    const fileMeta = req.file
      ? { originalFilename: req.file.originalname, filePath: req.file.path }
      : { originalFilename: null, filePath: null };

    const payload = {
      ...req.body,
      teacher: finalTeacher,
      status: req.body.status || "Active"
    };

    console.log(`Assigning homework to teacher: "${finalTeacher}"`);

    const data = await Homework.addHomework({ ...payload, ...fileMeta });
    
    res.status(201).json({ 
      success: true, 
      data, 
      message: "Homework assigned successfully" 
    });
  } catch (err) {
    console.error("Create homework error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 3. View student submissions for a specific homework assignment
 * GET /api/teacher/homework/:id/submissions
 */
exports.getHomeworkSubmissions = async (req, res) => {
  try {
    const hwCode = req.params.id;
    const data = await Homework.getHomeworkSubmissions(hwCode);
    
    if (!data) {
      return res.status(404).json({ success: false, message: "Homework assignment not found" });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 4. Grade / Mark a student submission
 * PUT /api/teacher/homework/submission/:submissionId
 */
exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, grade, feedback } = req.body;

    const updated = await Homework.evaluateSubmission(submissionId, { status, grade, feedback });
    
    if (!updated) {
      return res.status(404).json({ success: false, message: "Submission record not found" });
    }

    res.json({ 
      success: true, 
      data: updated, 
      message: "Submission evaluated and updated successfully" 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 5. Delete a homework assignment
 * DELETE /api/teacher/homework/:id
 */
exports.deleteHomework = async (req, res) => {
  try {
    const hwCode = req.params.id;
    
    // Call model to remove homework record
    const deleted = await Homework.deleteHomework(hwCode);
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Homework assignment not found" });
    }

    res.json({ 
      success: true, 
      message: "Homework deleted successfully" 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};