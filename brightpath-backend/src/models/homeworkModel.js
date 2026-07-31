const pool = require("../config/db");

const Homework = {

// Inside homeworkModel.js
// Inside homeworkModel.js

async getAllHomework() {
  const result = await pool.query(`
    SELECT
      h.homework_code   AS id,
      h.batch_name      AS batch,
      h.subject,
      COALESCE(t.teacher_name, h.teacher_name) AS teacher,
      h.title,
      h.description     AS desc,
      TO_CHAR(h.due_date, 'YYYY-MM-DD') AS due,
      h.submitted_count AS submitted,
      h.pending_count   AS pending,
      h.status,
      h.attachment_name AS attachment
    FROM homework_assignments h
    LEFT JOIN teachers t ON CAST(t.id AS VARCHAR) = h.teacher_name
    ORDER BY h.due_date DESC, h.homework_code DESC
  `);
  return result.rows;
},

  async addHomework(hw) {
    const result = await pool.query(
      `INSERT INTO homework_assignments
        (batch_name, subject, teacher_name, title, description, due_date, submitted_count, pending_count, status, attachment_name, attachment_path)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING
        homework_code   AS id,
        batch_name      AS batch,
        subject,
        teacher_name    AS teacher,
        title,
        description     AS desc,
        TO_CHAR(due_date, 'YYYY-MM-DD') AS due,
        submitted_count AS submitted,
        pending_count   AS pending,
        status,
        attachment_name AS attachment`,
      [
        hw.batch, hw.subject, hw.teacher, hw.title, hw.desc, hw.due,
        hw.submitted || 0, hw.pending || 0, hw.status || "Active",
        hw.originalFilename || null, hw.filePath || null
      ]
    );
    return result.rows[0];
  },

// homeworkModel.js

  async editHomework(code, hw) {
    const hwCode = parseInt(code, 10);
    const result = await pool.query(
      `UPDATE homework_assignments SET
        batch_name = COALESCE($1, batch_name),
        subject = COALESCE($2, subject),
        teacher_name = COALESCE($3, teacher_name),
        title = COALESCE($4, title),
        description = COALESCE($5, description),
        due_date = COALESCE($6, due_date),
        status = COALESCE($7, status),
        attachment_name = COALESCE($8, attachment_name),
        attachment_path = COALESCE($9, attachment_path),
        updated_at = NOW()
       WHERE homework_code = $10
       RETURNING
        homework_code   AS id,
        batch_name      AS batch,
        subject,
        teacher_name    AS teacher,
        title,
        description     AS desc,
        TO_CHAR(due_date, 'YYYY-MM-DD') AS due,
        submitted_count AS submitted,
        pending_count   AS pending,
        status,
        attachment_name AS attachment`,
      [
        hw.batch || null, 
        hw.subject || null, 
        hw.teacher || null, 
        hw.title || null, 
        hw.desc || null, 
        hw.due || null, 
        hw.status || "Active",
        hw.originalFilename || null, 
        hw.filePath || null, 
        hwCode
      ]
    );
    return result.rows[0];
  },

  async deleteHomework(code) {
    const hwCode = parseInt(code, 10);
    const result = await pool.query(
      `DELETE FROM homework_assignments WHERE homework_code = $1 RETURNING homework_code AS id`,
      [hwCode]
    );
    return result.rows[0];
  },

  async getHomeworkFilePath(code) {
    const hwCode = parseInt(code, 10);
    const result = await pool.query(
      `SELECT attachment_path, attachment_name FROM homework_assignments WHERE homework_code = $1`,
      [hwCode]
    );
    return result.rows[0];
  },

 

  async getHomeworkFilePath(code) {
    const result = await pool.query(
      `SELECT attachment_path, attachment_name FROM homework_assignments WHERE homework_code = $1`,
      [code]
    );
    return result.rows[0];
  },

  // --- Teacher Panel Methods ---

async getHomeworkByTeacher(teacherIdentifier, teacherName = "") {
    // Allows searching by Teacher ID (e.g. "4") OR Teacher Name (e.g. "John Doe")
    const result = await pool.query(
      `SELECT
        homework_code   AS id,
        batch_name      AS batch,
        subject,
        teacher_name    AS teacher,
        title,
        description     AS desc,
        TO_CHAR(due_date, 'YYYY-MM-DD') AS due,
        submitted_count AS submitted,
        pending_count   AS pending,
        status,
        attachment_name AS attachment
      FROM homework_assignments
      WHERE LOWER(teacher_name) = LOWER($1) 
         OR LOWER(teacher_name) = LOWER($2)
      ORDER BY due_date DESC, homework_code DESC`,
      [String(teacherIdentifier), String(teacherName || teacherIdentifier)]
    );
    return result.rows;
  },

  async getHomeworkSubmissions(homeworkCode) {
    const hwRes = await pool.query(
      `SELECT homework_code AS id, batch_name AS batch, subject, title, description AS desc, TO_CHAR(due_date, 'YYYY-MM-DD') AS due, status
       FROM homework_assignments WHERE homework_code = $1`,
      [homeworkCode]
    );
    
    if (hwRes.rows.length === 0) return null;

    const subsRes = await pool.query(
      `SELECT 
        submission_id AS id,
        student_id,
        student_name,
        TO_CHAR(submission_date, 'YYYY-MM-DD HH24:MI') AS submitted_at,
        file_name AS attachment,
        status,
        grade_marks AS grade,
        teacher_feedback AS feedback
       FROM homework_submissions
       WHERE homework_code = $1
       ORDER BY submission_date DESC`,
      [homeworkCode]
    );

    return {
      assignment: hwRes.rows[0],
      submissions: subsRes.rows
    };
  },

  async evaluateSubmission(submissionId, { status, grade, feedback }) {
    const result = await pool.query(
      `UPDATE homework_submissions
       SET status = $1, grade_marks = $2, teacher_feedback = $3, checked_at = NOW()
       WHERE submission_id = $4
       RETURNING submission_id, homework_code, status, grade_marks AS grade, teacher_feedback AS feedback`,
      [status || 'Checked', grade, feedback, submissionId]
    );

    if (result.rows.length > 0) {
      const hwCode = result.rows[0].homework_code;
      await pool.query(
        `UPDATE homework_assignments
         SET 
           submitted_count = (SELECT COUNT(*) FROM homework_submissions WHERE homework_code = $1 AND status = 'Checked'),
           pending_count = (SELECT COUNT(*) FROM homework_submissions WHERE homework_code = $1 AND status = 'Pending')
         WHERE homework_code = $1`,
        [hwCode]
      );
    }

    return result.rows[0];
  }
};

module.exports = Homework;