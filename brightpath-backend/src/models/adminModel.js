const db = require("../config/db");
const bcrypt = require("bcrypt");

class AdminUser {

    static async findByUsername(username) {

        const query = `
        SELECT *
        FROM admins
        WHERE username=$1
        `;

        const result = await db.query(query, [username]);

        return result.rows[0];

    }

   static async findById(id) {
    const query = `
    SELECT id, username, full_name, email, role, status, last_login
    FROM admins
    WHERE id=$1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
}

static async list() {
    const query = `
    SELECT id, username, full_name, email, role, status, last_login
    FROM admins
    ORDER BY id DESC
    `;
    const result = await db.query(query);
    return result.rows;
}

    static async create({ username, password, email, full_name }) {

        const hashedPassword = await bcrypt.hash(password, 10);

        // role is hardcoded to "Admin" here — Super Admin accounts are never
        // created through this API, only assigned directly in the database.
        const query = `
        INSERT INTO admins (username, password, email, full_name, role, status)
        VALUES ($1, $2, $3, $4, 'Admin', 'Active')
        RETURNING id, username, full_name, role, status
        `;

        const result = await db.query(query, [username, hashedPassword, email, full_name]);

        return result.rows[0];

    }

  

    static async update(id, { full_name, status, password }) {

        if (password) {

            const hashedPassword = await bcrypt.hash(password, 10);

            const query = `
            UPDATE admins
            SET full_name=$1, status=$2, password=$3
            WHERE id=$4
            RETURNING id, username, full_name, role, status
            `;

            const result = await db.query(query, [full_name, status, hashedPassword, id]);

            return result.rows[0];

        }

        const query = `
        UPDATE admins
        SET full_name=$1, status=$2
        WHERE id=$3
        RETURNING id, username, full_name, role, status
        `;

        const result = await db.query(query, [full_name, status, id]);

        return result.rows[0];

    }

}

module.exports = AdminUser;