const express = require("express");
const router = express.Router();
const timetableController = require("../controllers/timetableController");
const auth = require("../middleware/authMiddleware");

router.get("/slots", auth, timetableController.getTimetable);
router.patch("/slots/:id/status", auth, timetableController.patchSlotStatus);

module.exports = router;