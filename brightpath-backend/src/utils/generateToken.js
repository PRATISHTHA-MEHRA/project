const jwt = require("jsonwebtoken");

module.exports = (admin) => {

    return jwt.sign(

        {

            id: admin.id,

            username: admin.username,

            role: admin.role

        },

        process.env.JWT_SECRET,

        {

            expiresIn: "1d"

        }

    );

};