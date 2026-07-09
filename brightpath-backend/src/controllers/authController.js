const bcrypt = require("bcrypt");

const Auth = require("../models/authModel");

const generateToken = require("../utils/generateToken");

exports.login = async (req, res) => {

    try {

        const {

            username,

            password

        } = req.body;

        const admin = await Auth.login(username);

        if (!admin) {

            return res.status(401).json({

                success: false,

                message: "Invalid username"

            });

        }

        const match = await bcrypt.compare(

            password,

            admin.password

        );

        if (!match) {

            return res.status(401).json({

                success: false,

                message: "Invalid password"

            });

        }

        await Auth.updateLogin(admin.id);

        const token = generateToken(admin);

        res.json({

            success: true,

            message: "Login successful",

            token,

            admin: {

                id: admin.id,

                username: admin.username,

                name: admin.full_name,

                role: admin.role

            }

        });

    }

    catch (err) {
    console.error("LOGIN ERROR:", err);

    res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
}

};