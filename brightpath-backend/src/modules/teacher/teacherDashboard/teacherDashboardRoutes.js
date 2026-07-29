const express = require("express");
const router = express.Router();
const dashboardController = require("./teacherDashboardController");

// Optional: Require your auth middleware if available
// const { verifyToken } = require("../middleware/authMiddleware");

/**
 * @route   GET /api/teacher/dashboard
 * @desc    Fetch teacher dashboard KPIs, today's classes, monthly metrics, and notifications
 * @access  Private / Protected (or Public if using token decoding inside controller)
 */
router.get("/", dashboardController.getDashboard);

module.exports = router;