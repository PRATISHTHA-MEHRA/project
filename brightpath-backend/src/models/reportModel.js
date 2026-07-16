// models/reportModel.js
// NOTE: adjust this require to whatever examModel.js / homeworkModel.js uses in your project
const pool = require("../config/db");

const Report = {

  // latest generated_at per report_key
  async getLatestLogs() {
    const result = await pool.query(`
      SELECT DISTINCT ON (report_key)
        report_key,
        TO_CHAR(generated_at, 'DD Mon YYYY, HH12:MI AM') AS generated_at
      FROM report_generation_log
      ORDER BY report_key, generated_at DESC
    `);
    return result.rows;
  },

  async logGeneration(key, name, action) {
    const result = await pool.query(
      `INSERT INTO report_generation_log (report_key, report_name, action)
       VALUES ($1,$2,$3)
       RETURNING report_key, TO_CHAR(generated_at, 'DD Mon YYYY, HH12:MI AM') AS generated_at`,
      [key, name || null, action || "view"]
    );
    return result.rows[0];
  }
};

module.exports = Report;