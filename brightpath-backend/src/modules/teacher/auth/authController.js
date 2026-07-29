const Teacher = require("../../../models/teacherModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ================= LOGIN =================

exports.login = async (req, res) => {
    try {

        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: "Identifier and password are required."
            });
        }

        const teacher = await Teacher.findByIdentifier(identifier);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found."
            });
        }

        if (!teacher.password) {
            return res.status(400).json({
                success: false,
                message: "Password not set. Please use Forgot Password."
            });
        }

        const isMatch = await bcrypt.compare(password, teacher.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password."
            });
        }

        const token = jwt.sign(
            {
                id: teacher.id,
                role: "teacher"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        delete teacher.password;

        res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            teacher
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Login failed."
        });

    }
};

// ================= FORGOT PASSWORD =================

exports.forgotPassword = async (req, res) => {

    try {

        const { identifier, password } = req.body;

        if (!identifier || !password) {

            return res.status(400).json({
                success: false,
                message: "Identifier and new password are required."
            });

        }

        const teacher = await Teacher.findByIdentifier(identifier);

        if (!teacher) {

            return res.status(404).json({
                success: false,
                message: "Teacher not found."
            });

        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await Teacher.updatePassword(
            teacher.id,
            hashedPassword
        );

        res.status(200).json({
            success: true,
            message: "Password updated successfully."
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Failed to update password."
        });

    }

};