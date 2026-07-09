const db = require("../config/db");

class Teacher {

    // Get All Teachers
    static async getAll() {

        const result = await db.query(`
            SELECT *
            FROM teachers
            ORDER BY created_at DESC
        `);

        return result.rows;
    }

    // Get Teacher By ID
    static async getById(id) {

        const result = await db.query(
            "SELECT * FROM teachers WHERE id=$1",
            [id]
        );

        return result.rows[0];
    }

    // Create Teacher
    static async create(data) {

        const query = `
            INSERT INTO teachers
            (
                teacher_code,
                teacher_name,
                mobile,
                email,
                qualification,
                experience,
                subjects,
                payment_type,
                joining_date,
                status
            )

            VALUES
            (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
            )

            RETURNING *;
        `;

        const values = [

            data.teacher_code,
            data.teacher_name,
            data.mobile,
            data.email,
            data.qualification,
            data.experience,
            data.subjects,
            data.payment_type,
            data.joining_date,
            data.status

        ];

        const result = await db.query(query, values);

        return result.rows[0];
    }

    // Update Teacher
    static async update(id, data) {

        const query = `
            UPDATE teachers
            SET
                teacher_code=$1,
                teacher_name=$2,
                mobile=$3,
                email=$4,
                qualification=$5,
                experience=$6,
                subjects=$7,
                payment_type=$8,
                joining_date=$9,
                status=$10

            WHERE id=$11

            RETURNING *;
        `;

        const values = [

            data.teacher_code,
            data.teacher_name,
            data.mobile,
            data.email,
            data.qualification,
            data.experience,
            data.subjects,
            data.payment_type,
            data.joining_date,
            data.status,
            id

        ];

        const result = await db.query(query, values);

        return result.rows[0];
    }

    // Delete Teacher
    static async delete(id) {

        const result = await db.query(
            "DELETE FROM teachers WHERE id=$1 RETURNING *",
            [id]
        );

        return result.rows[0];
    }

}

module.exports = Teacher;