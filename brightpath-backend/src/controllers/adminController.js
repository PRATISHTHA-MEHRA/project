const AdminUser = require("../models/adminModel");

exports.create = async (req, res) => {

    try {

        const {
            username,
            password,
            email,
            full_name
        } = req.body;

        if (!username || !password || !full_name || !email) {

            return res.status(400).json({
                success: false,
                message: "username, password and full_name and email are required"
            });

        }

        const existing = await AdminUser.findByUsername(username);

        if (existing) {

            return res.status(409).json({
                success: false,
                message: "Username already exists"
            });

        }

        const admin = await AdminUser.create({ username, password, email, full_name });

        res.status(201).json({
            success: true,
            message: "Admin created successfully",
            data: admin
        });

    }
    catch (err) {

        console.error("CREATE ADMIN ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message || "Internal Server Error"
        });

    }

};

exports.list = async (req, res) => {

    try {

        const admins = await AdminUser.list();

        res.json({
            success: true,
            data: admins
        });

    }
    catch (err) {

        console.error("LIST ADMIN ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message || "Internal Server Error"
        });

    }

};

exports.update = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            full_name,
            status,
            password
        } = req.body;

        const existing = await AdminUser.findById(id);

        if (!existing) {

            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });

        }

    
        if (existing.role === "Super Admin") {

            return res.status(403).json({
                success: false,
                message: "Super Admin accounts cannot be modified via this API"
            });

        }

        const updated = await AdminUser.update(id, { full_name, status, password });

        res.json({
            success: true,
            message: "Admin updated successfully",
            data: updated
        });

    }
    catch (err) {

        console.error("UPDATE ADMIN ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message || "Internal Server Error"
        });

    }

};