const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ==========================
// Middlewares
// ==========================
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

// ==========================
// Routes
// ==========================

// Admin Portal
app.use("/api/admin", require("./routes/admin.routes"));

//Teacher Portal
app.use("/api/teacher", require("./routes/teacher.routes"));

// // Student Portal
// app.use("/api/student", require("./routes/student.routes"));

// Health Check
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "BrightPath Backend API is running."
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

// ==========================
// Server
// ==========================
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});