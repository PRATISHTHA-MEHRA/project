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

        if (!teacher || !teacher.password) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials."
            });
        }

        const isMatch = await bcrypt.compare(password, teacher.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials."
            });
        }

        const token = jwt.sign(
            {
                id: teacher.id,
                name: teacher.teacher_name || teacher.name,
                role: "teacher"
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const teacherData = teacher.toObject ? teacher.toObject() : { ...teacher };
        delete teacherData.password;

        res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            teacher: teacherData
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
};

// ================= SEND OTP =================

exports.sendOtp = async (req, res) => {
    try {
        const { identifier } = req.body;

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: "Identifier is required."
            });
        }

        const teacher = await Teacher.findByIdentifier(identifier);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher account not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "OTP sent successfully. (Bypass: 123456)"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to send OTP."
        });
    }
};

// ================= VERIFY OTP =================

exports.verifyOtp = async (req, res) => {
    try {
        const { identifier, otp } = req.body;

        if (!identifier || !otp) {
            return res.status(400).json({
                success: false,
                message: "Identifier and OTP are required."
            });
        }

        if (otp !== "123456") {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP."
            });
        }

        res.status(200).json({
            success: true,
            message: "OTP verified successfully."
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "OTP verification failed."
        });
    }
};

// ================= FORGOT PASSWORD =================

exports.forgotPassword = async (req, res) => {
    try {
        const { identifier, otp, password } = req.body;

        if (!identifier || !otp || !password) {
            return res.status(400).json({
                success: false,
                message: "Identifier, OTP, and new password are required."
            });
        }

        if (otp !== "123456") {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP."
            });
        }

        const teacher = await Teacher.findByIdentifier(identifier);

        if (!teacher) {
            return res.status(400).json({
                success: false,
                message: "Failed to update password. Please check your credentials."
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

// ================= CHANGE PASSWORD (AUTHENTICATED) =================

// ================= CHANGE PASSWORD (AUTHENTICATED) =================

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // 1. Extract ID from JWT middleware payload
        const teacherId = req.user?.id;

        if (!teacherId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing user ID in token."
            });
        }

        // 2. Query database using getById (Primary Key lookup)
        const teacher = await Teacher.getById(teacherId);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher account not found."
            });
        }

        // 3. Validate current password
        const isMatch = await bcrypt.compare(currentPassword, teacher.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect current password."
            });
        }

        // 4. Hash and update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await Teacher.updatePassword(teacher.id, hashedPassword);

        return res.status(200).json({
            success: true,
            message: "Password updated successfully."
        });

    } catch (err) {
        console.error("Change Password Error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to update password."
        });
    }
};