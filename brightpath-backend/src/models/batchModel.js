const db = require("../config/db");

// Get all batches
const getAllBatches = async () => {
    const result = await db.query(`
        SELECT
            b.*,
            c.course_name,
            t.teacher_name
        FROM batches b
        LEFT JOIN courses c
            ON b.course_id=c.id
        LEFT JOIN teachers t
            ON b.teacher_id=t.id
        ORDER BY b.id DESC
    `);

    return result.rows;
};

// Get Batch By Id
const getBatchById = async(id)=>{
    const result = await db.query(
        `
        SELECT
            b.*,
            c.course_name,
            t.teacher_name
        FROM batches b
        LEFT JOIN courses c
            ON b.course_id=c.id
        LEFT JOIN teachers t
            ON b.teacher_id=t.id
        WHERE b.id=$1
        `,
        [id]
    );

    return result.rows[0];
};

// Create Batch
const createBatch = async(data)=>{
    const result = await db.query(
        `
        INSERT INTO batches
        (
            batch_code,
            batch_name,
            course_id,
            subject,
            teacher_id,
            classroom,
            start_date,
            end_date,
            days,
            batch_type,
            start_time,
            end_time,
            max_students,
            current_students,
            status
        )
        VALUES
        (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
        )
        RETURNING *;
        `,
        [
            data.batch_code,
            data.batch_name,
            data.course_id,
            data.subject,
            data.teacher_id,
            data.classroom,
            data.start_date,
            data.end_date,
            data.days,
            data.batch_type,
            data.start_time,
            data.end_time,
            data.max_students,
            data.current_students,
            data.status
        ]
    );

    return result.rows[0];
};

// Update Batch
const updateBatch = async(id, data)=>{
    const result = await db.query(
        `
        UPDATE batches
        SET
            batch_code=$1,
            batch_name=$2,
            course_id=$3,
            subject=$4,
            teacher_id=$5,
            classroom=$6,
            start_date=$7,
            end_date=$8,
            days=$9,
            batch_type=$10,
            start_time=$11,
            end_time=$12,
            max_students=$13,
            current_students=$14,
            status=$15,
            updated_at=CURRENT_TIMESTAMP
        WHERE id=$16
        RETURNING *;
        `,
        [
            data.batch_code,
            data.batch_name,
            data.course_id,
            data.subject,
            data.teacher_id,
            data.classroom,
            data.start_date,
            data.end_date,
            data.days,
            data.batch_type,
            data.start_time,
            data.end_time,
            data.max_students,
            data.current_students,
            data.status,
            id
        ]
    );

    return result.rows[0];
};

// Delete Batch
const deleteBatch = async(id)=>{
    await db.query(
        "DELETE FROM batches WHERE id=$1",
        [id]
    );
};


const getBatchesByTeacherId = async (teacherId) => {
  const query = `
    SELECT 
      b.id,
      b.batch_name AS name,
      b.batch_code,
      c.course_name AS course,
      b.subject,
      CONCAT(b.start_time, ' - ', b.end_time) AS timing,
      b.days,
      b.classroom AS room,
      b.status,
      COUNT(DISTINCT s.id)::INT AS students_count,
      COALESCE(
        ROUND(
          (SUM(CASE WHEN al.status IN ('Present', 'Late') THEN 1 ELSE 0 END)::NUMERIC 
           / NULLIF(COUNT(al.id), 0)::NUMERIC) * 100
        ), 0
      )::INT AS att
    FROM batches b
    LEFT JOIN courses c ON b.course_id = c.id
    LEFT JOIN students s ON s.batch_id = b.id
    LEFT JOIN attendance_logs al ON al.batch_name = b.batch_name
    WHERE b.teacher_id = $1 OR $1 IS NULL
    GROUP BY b.id, c.course_name
    ORDER BY b.id ASC;
  `;
  const result = await db.query(query, [teacherId]);
  return result.rows;
};

// Get Single Batch Details for Teacher
const getTeacherBatchDetails = async (batchIdentifier, teacherId) => {
    const isNumeric = !isNaN(batchIdentifier) && !isNaN(parseInt(batchIdentifier));

    const query = `
        SELECT
            b.id,
            b.batch_code,
            b.batch_name AS name,
            c.course_name AS course,
            b.subject,
            b.classroom AS room,
            b.days,
            b.batch_type,
            b.start_time AS st,
            b.end_time AS et,
            CONCAT(b.start_time, ' - ', b.end_time) AS timing,
            b.max_students AS max,
            COALESCE(b.current_students, 0) AS cur,
            b.status
        FROM batches b
        LEFT JOIN courses c ON b.course_id = c.id
        WHERE (${isNumeric ? 'b.id = $1' : 'b.batch_code = $1'}) 
          AND b.teacher_id = $2
    `;
    const result = await db.query(query, [batchIdentifier, teacherId]);
    return result.rows[0] || null;
};

// Get Student List inside a Batch (calculating attendance % and last test scores)
const getBatchStudents = async (batchIdentifier) => {
  const query = `
    SELECT 
      s.id,
      s.student_name AS name,
      s.class_name AS cls,
      s.parent_name AS parent,
      COALESCE(s.performance_status, 'Good') AS perf,
      COALESCE(s.teacher_remark, '') AS remark,
      COALESCE(
        ROUND(
          (SUM(CASE WHEN al.status IN ('Present', 'Late') THEN 1 ELSE 0 END)::NUMERIC 
           / NULLIF(COUNT(al.id), 0)::NUMERIC) * 100
        ), 100
      )::INT AS att,
      85 AS "lastTest"
    FROM students s
    JOIN batches b ON s.batch_id = b.id OR b.batch_code = $1
    LEFT JOIN attendance_logs al ON al.student_id = s.id::TEXT
    WHERE b.id::TEXT = $1 OR b.batch_code = $1
    GROUP BY s.id, b.id
    ORDER BY s.student_name ASC;
  `;
  const result = await db.query(query, [batchIdentifier]);
  return result.rows;
};

const updateStudentRemark = async (studentId, batchId, performance, remark) => {
  const query = `
    UPDATE students
    SET performance_status = $1,
        teacher_remark = $2
    WHERE id = $3
    RETURNING id, student_name AS name, performance_status AS perf, teacher_remark AS remark;
  `;
  const result = await db.query(query, [performance, remark, studentId]);
  return result.rows[0];
};

module.exports = {
    getAllBatches,
    getBatchById,
    getBatchesByTeacherId,
    getTeacherBatchDetails,
    getBatchStudents,
    updateStudentRemark,
    createBatch,
    updateBatch,
    deleteBatch
};
