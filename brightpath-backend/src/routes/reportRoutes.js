const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

router.get("/dashboard", reportController.getDashboard);
router.get("/logs", reportController.getLogs);
router.post("/:key/log", reportController.logGeneration);

module.exports = router;