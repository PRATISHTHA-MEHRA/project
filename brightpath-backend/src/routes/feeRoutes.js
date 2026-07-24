const express = require("express");
const router = express.Router();
const feeController = require("../controllers/feeController");
const auth = require("../middleware/authMiddleware");

router.get("/dashboard", auth, feeController.getFeeDashboard);
router.post("/collect", auth, feeController.collectFees);
router.get("/pending/:studentId", auth, feeController.getCurrentDue);
module.exports = router;