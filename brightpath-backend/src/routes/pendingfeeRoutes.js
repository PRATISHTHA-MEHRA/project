const express = require("express");
const router = express.Router();
const feeController = require("../controllers/pendingfeeController");
const auth = require("../middleware/authMiddleware");

// 2. MAKE SURE YOU ARE CALLING THE CORRECT CONTROLLER VARIABLE NAME:
router.get("/", auth, feeController.getPendingFeesSummary);
router.get("/:studentId/total", auth, feeController.getTotalDue);
router.get("/:studentId", auth, feeController.getCurrentDue);
router.post("/bulk-reminder", auth, feeController.triggerBulkReminders);
router.post("/:id/notes", auth, feeController.addFeeCallNote);

module.exports = router;