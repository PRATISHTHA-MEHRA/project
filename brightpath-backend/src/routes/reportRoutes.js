const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const auth = require("../middleware/authMiddleware");

router.get("/dashboard", auth, reportController.getDashboard);
router.get("/logs", auth, reportController.getLogs);
router.post("/:key/log", auth, reportController.logGeneration);

module.exports = router;