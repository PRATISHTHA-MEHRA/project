const Course = require("../models/courseModel");

// Get All
exports.getCourses = async (req, res) => {

    try {

        const courses = await Course.getAll();

        res.status(200).json({
            success: true,
            data: courses,
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message,
        });

    }

};

// Get One

exports.getCourse = async (req, res) => {

    try {

        const course = await Course.getById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        res.json({
            success: true,
            data: course,
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message,
        });

    }

};

// Create

exports.createCourse = async (req, res) => {

    try {

        const course = await Course.create(req.body);

        res.status(201).json({
            success: true,
            message: "Course created successfully",
            data: course,
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message,
        });

    }

};

// Update

exports.updateCourse = async (req, res) => {

    try {

        const course = await Course.update(req.params.id, req.body);

        res.json({
            success: true,
            message: "Course updated successfully",
            data: course,
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message,
        });

    }

};

// Delete

exports.deleteCourse = async (req, res) => {

    try {

        await Course.delete(req.params.id);

        res.json({
            success: true,
            message: "Course deleted successfully",
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message,
        });

    }

};