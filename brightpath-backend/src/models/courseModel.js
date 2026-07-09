const db = require("../config/db");

class Course {

    // Get All Courses
    static async getAll() {
        const result = await db.query(
            "SELECT * FROM courses ORDER BY created_at DESC"
        );
        return result.rows;
    }

    // Get Course By ID
    static async getById(id) {
        const result = await db.query(
            "SELECT * FROM courses WHERE id=$1",
            [id]
        );
        return result.rows[0];
    }

    // Create Course
    static async create(data) {

        const query = `
        INSERT INTO courses
        (
            course_code,
            course_name,
            category,
            level,
            subject,
            duration,
            monthly_fee,
            quarterly_fee,
            semi_annual_fee,
            annual_fee,
            status,
            description
        )

        VALUES
        (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
        )

        RETURNING *;
        `;

        const values = [
            data.course_code,
            data.course_name,
            data.category,
            data.level,
            data.subject,
            data.duration,
            data.monthly_fee,
            data.quarterly_fee,
            data.semi_annual_fee,
            data.annual_fee,
            data.status,
            data.description,
        ];

        const result = await db.query(query, values);

        return result.rows[0];
    }

    // Update

    static async update(id, data) {

        const query = `
        UPDATE courses
        SET
            course_code=$1,
            course_name=$2,
            category=$3,
            level=$4,
            subject=$5,
            duration=$6,
            monthly_fee=$7,
            quarterly_fee=$8,
            semi_annual_fee=$9,
            annual_fee=$10,
            status=$11,
            description=$12

        WHERE id=$13

        RETURNING *;
        `;

        const values = [
            data.course_code,
            data.course_name,
            data.category,
            data.level,
            data.subject,
            data.duration,
            data.monthly_fee,
            data.quarterly_fee,
            data.semi_annual_fee,
            data.annual_fee,
            data.status,
            data.description,
            id,
        ];

        const result = await db.query(query, values);

        return result.rows[0];
    }

    // Delete

    static async delete(id) {

        const result = await db.query(
            "DELETE FROM courses WHERE id=$1 RETURNING *",
            [id]
        );

        return result.rows[0];
    }

}

module.exports = Course;