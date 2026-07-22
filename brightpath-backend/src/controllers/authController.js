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

        // Credentials are correct at this point — now check if the
        // account is allowed to log in at all.
        if (admin.status !== "Active") {

            return res.status(403).json({

                success: false,

                message: "This account has been deactivated. Please contact a Super Admin."

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

// Password rule: at least 8 characters, containing at least one
// letter and one number. Adjust this regex if your product rules differ.
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

exports.resetPassword = async (req, res) => {

    try {

        const {
            username,
            newPassword,
            confirmPassword
        } = req.body;

        if (!username || !newPassword || !confirmPassword) {

            return res.status(400).json({

                success: false,

                message: "Username, new password and confirm password are required"

            });

        }

        if (newPassword !== confirmPassword) {

            return res.status(400).json({

                success: false,

                message: "New password and confirm password do not match"

            });

        }

        if (!PASSWORD_RULE.test(newPassword)) {

            return res.status(400).json({

                success: false,

                message: "New password must be at least 8 characters long and include at least one letter and one number"

            });

        }

        const admin = await Auth.login(username);

        if (!admin) {

            return res.status(401).json({

                success: false,

                message: "Invalid username"

            });

        }

        if (admin.status !== "Active") {

            return res.status(403).json({

                success: false,

                message: "This account has been deactivated. Please contact a Super Admin."

            });

        }

        const sameAsOld = await bcrypt.compare(

            newPassword,

            admin.password

        );

        if (sameAsOld) {

            return res.status(400).json({

                success: false,

                message: "New password must be different from the current password"

            });

        }

        const hashed = await bcrypt.hash(newPassword, 10);

        await Auth.updatePassword(admin.id, hashed);

        res.json({

            success: true,

            message: "Password updated successfully"

        });

    }

    catch (err) {

        console.error("RESET PASSWORD ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message || "Internal Server Error"
        });

    }

};