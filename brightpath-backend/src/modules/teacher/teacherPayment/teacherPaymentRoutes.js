// modules/teacher/teacherPayment/teacherPaymentRoutes.js
const express = require("express");
const router = express.Router();
const teacherPaymentController = require("./teacherPaymentController");

// Import your auth middleware (adjust path as per your project)
const { protect } = require("../../../middleware/authMiddleware");

// Apply auth middleware if available, or call directly
if (protect) {
    router.get("/", protect, teacherPaymentController.getMyEarnings);
} else {
    router.get("/", teacherPaymentController.getMyEarnings);
}

module.exports = router;