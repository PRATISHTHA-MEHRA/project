const express = require("express");
const router = express.Router();
const admissionController = require("../controllers/admissionController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, admissionController.getAdmissions);
router.post("/", auth, admissionController.createAdmission);

module.exports = router;