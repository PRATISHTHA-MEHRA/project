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

module.exports={
    getAllBatches,
    getBatchById,
    createBatch,
    updateBatch,
    deleteBatch
};