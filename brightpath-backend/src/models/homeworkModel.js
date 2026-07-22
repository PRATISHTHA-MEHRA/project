const pool = require("../config/db");

const Homework = {

  async getAllHomework() {
    const result = await pool.query(`
      SELECT
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
      ORDER BY due_date DESC, id DESC
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

  async editHomework(code, hw) {
    // COALESCE keeps the existing attachment when no new file was uploaded
    // (hw.originalFilename / hw.filePath are undefined/null in that case)
    const result = await pool.query(
      `UPDATE homework_assignments SET
        batch_name = $1, subject = $2, teacher_name = $3, title = $4,
        description = $5, due_date = $6, status = $7,
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
        hw.batch, hw.subject, hw.teacher, hw.title, hw.desc, hw.due, hw.status || "Active",
        hw.originalFilename || null, hw.filePath || null, code
      ]
    );
    return result.rows[0];
  },

  async deleteHomework(code) {
    const result = await pool.query(
      `DELETE FROM homework_assignments WHERE homework_code = $1 RETURNING homework_code AS id`,
      [code]
    );
    return result.rows[0];
  },

  async getHomeworkFilePath(code) {
    const result = await pool.query(
      `SELECT attachment_path, attachment_name FROM homework_assignments WHERE homework_code = $1`,
      [code]
    );
    return result.rows[0];
  }
};

module.exports = Homework;