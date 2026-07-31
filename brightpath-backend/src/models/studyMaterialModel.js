const pool = require("../config/db");

const StudyMaterial = {

  // Fetch materials (Optionally filter by type, e.g., 'Class Note')
 // Flexible fetch: Can filter by type, teacher/uploadedBy, or fetch all
  async getAllMaterial(type = null, uploadedBy = null) {
    let query = `
      SELECT
        material_code     AS id,
        title,
        course_name       AS course,
        subject,
        type,
        uploaded_by       AS "uploadedBy",
        TO_CHAR(upload_date, 'YYYY-MM-DD') AS date,
        file_size         AS size,
        download_count    AS downloads,
        original_filename AS "originalFilename"
      FROM study_materials
    `;

    const conditions = [];
    const params = [];

    if (type) {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }

    if (uploadedBy) {
      params.push(uploadedBy);
      conditions.push(`uploaded_by = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

    query += ` ORDER BY upload_date DESC, material_code DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  },
  // Insert any material (Works for Class Notes as well)
  async addMaterial(sm) {
    const result = await pool.query(
      `INSERT INTO study_materials
        (title, course_name, subject, type, uploaded_by, file_size, download_count, file_path, original_filename)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)
       RETURNING
        material_code     AS id,
        title,
        course_name       AS course,
        subject,
        type,
        uploaded_by       AS "uploadedBy",
        TO_CHAR(upload_date, 'YYYY-MM-DD') AS date,
        file_size         AS size,
        download_count    AS downloads,
        original_filename AS "originalFilename"`,
      [
        sm.title,
        sm.course || sm.batch, // Map batch to course_name
        sm.subject || "Mathematics",
        sm.type || "Class Note", // Default to 'Class Note' if coming from teacher notes
        sm.uploadedBy,
        sm.fileSize || sm.size || "—",
        sm.filePath || null,
        sm.originalFilename || null
      ]
    );
    return result.rows[0];
  },

  async deleteMaterial(code) {
    const result = await pool.query(
      `DELETE FROM study_materials WHERE material_code = $1 RETURNING material_code AS id`,
      [code]
    );
    return result.rows[0];
  },

  async incrementDownload(code) {
    const result = await pool.query(
      `UPDATE study_materials SET download_count = download_count + 1
       WHERE material_code = $1
       RETURNING material_code AS id, download_count AS downloads`,
      [code]
    );
    return result.rows[0];
  },

  async getMaterialFilePath(code) {
    const result = await pool.query(
      `SELECT file_path, original_filename FROM study_materials WHERE material_code = $1`,
      [code]
    );
    return result.rows[0];
  }
};

module.exports = StudyMaterial;