const Teacher = require("../models/teacherModel");

// Get All Teachers
exports.getTeachers = async (req, res) => {

    try {

        const teachers = await Teacher.getAll();

        res.status(200).json({
            success: true,
            data: teachers
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// Get Teacher
exports.getTeacher = async (req, res) => {

    try {

        const teacher = await Teacher.getById(req.params.id);

        if (!teacher) {

            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });

        }

        res.status(200).json({
            success: true,
            data: teacher
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// Create Teacher
exports.createTeacher = async (req, res) => {

    try {

        const teacher = await Teacher.create(req.body);

        res.status(201).json({

            success: true,
            message: "Teacher created successfully",
            data: teacher

        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

};

// Update Teacher
exports.updateTeacher = async (req, res) => {

    try {

        const teacher = await Teacher.update(req.params.id, req.body);

        res.status(200).json({

            success: true,
            message: "Teacher updated successfully",
            data: teacher

        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

};

// Delete Teacher
exports.deleteTeacher = async (req, res) => {

    try {

        await Teacher.delete(req.params.id);

        res.status(200).json({

            success: true,
            message: "Teacher deleted successfully"

        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

};