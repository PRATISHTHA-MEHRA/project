const db = require("../config/db");

class Student {

    // Get All Students 
    static async getAll() {

        const query = `
            SELECT
                s.*,
                c.course_name,
                b.batch_name
            FROM students s
            LEFT JOIN courses c
                ON s.course_id = c.id
            LEFT JOIN batches b
                ON s.batch_id = b.id
            ORDER BY s.created_at DESC, s.id DESC;
        `;

        const result = await db.query(query);

        return result.rows;
    }

    // Get Student By ID 
    static async getById(id) {

        const query = `
            SELECT
                s.*,
                c.course_name,
                b.batch_name
            FROM students s
            LEFT JOIN courses c
                ON s.course_id = c.id
            LEFT JOIN batches b
                ON s.batch_id = b.id
            WHERE s.id=$1;
        `;

        const result = await db.query(query, [id]);

        return result.rows[0];
    }

    // Create Student
    static async create(data) {

        const query = `
            INSERT INTO students
            (
                student_code,
                student_name,
                mobile,
                parent_name,
                parent_mobile,
                class_name,
                course_id,
                batch_id,
                fee_type,
                fee_amount,
                admission_date,
                status,
                fee_status,
                attendance,
                gender,
                dob,
                address,
                school_name
            )

            VALUES
            (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,
                $10,$11,$12,$13,$14,$15,$16,$17,$18
            )

            RETURNING *;
        `;

        const values = [

            data.student_code,
            data.student_name,
            data.mobile,
            data.parent_name,
            data.parent_mobile,
            data.class_name,
            data.course_id,
            data.batch_id,
            data.fee_type,
            data.fee_amount,
            data.admission_date,
            data.status,
            data.fee_status,
            data.attendance,
            data.gender,
            data.dob,
            data.address,
            data.school_name

        ];

        const result = await db.query(query, values);

        return result.rows[0];
    }

    // Update Student
    static async update(id, data) {

        const query = `
            UPDATE students
            SET
                student_code=$1,
                student_name=$2,
                mobile=$3,
                parent_name=$4,
                parent_mobile=$5,
                class_name=$6,
                course_id=$7,
                batch_id=$8,
                fee_type=$9,
                fee_amount=$10,
                admission_date=$11,
                status=$12,
                fee_status=$13,
                attendance=$14,
                gender=$15,
                dob=$16,
                address=$17,
                school_name=$18

            WHERE id=$19

            RETURNING *;
        `;

        const values = [

            data.student_code,
            data.student_name,
            data.mobile,
            data.parent_name,
            data.parent_mobile,
            data.class_name,
            data.course_id,
            data.batch_id,
            data.fee_type,
            data.fee_amount,
            data.admission_date,
            data.status,
            data.fee_status,
            data.attendance,
            data.gender,
            data.dob,
            data.address,
            data.school_name,
            id

        ];

        const result = await db.query(query, values);

        return result.rows[0];
    }

    // Delete Student
    static async delete(id) {

        const result = await db.query(

            "DELETE FROM students WHERE id=$1 RETURNING *",

            [id]

        );

        return result.rows[0];
    }

}

module.exports = Student;