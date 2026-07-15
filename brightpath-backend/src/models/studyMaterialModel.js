const pool = require("../config/db");

const StudyMaterial = {

  async getAllMaterial() {
    const result = await pool.query(`
      SELECT
        material_code  AS id,
        title,
        course_name    AS course,
        subject,
        type,
        uploaded_by    AS "uploadedBy",
        TO_CHAR(upload_date, 'YYYY-MM-DD') AS date,
        file_size      AS size,
        download_count AS downloads
      FROM study_materials
      ORDER BY upload_date DESC, id DESC
    `);
    return result.rows;
  },

  async addMaterial(sm) {
    const result = await pool.query(
      `INSERT INTO study_materials
        (title, course_name, subject, type, uploaded_by, file_size, download_count)
       VALUES ($1,$2,$3,$4,$5,$6,0)
       RETURNING
        material_code  AS id,
        title,
        course_name    AS course,
        subject,
        type,
        uploaded_by    AS "uploadedBy",
        TO_CHAR(upload_date, 'YYYY-MM-DD') AS date,
        file_size      AS size,
        download_count AS downloads`,
      [sm.title, sm.course, sm.subject, sm.type || "PDF", sm.uploadedBy, sm.size || "—"]
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
  }
};

module.exports = StudyMaterial;