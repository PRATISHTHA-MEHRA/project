const express = require("express");
const router = express.Router();
const timetableController = require("../controllers/timetableController");
const auth = require("../middleware/authMiddleware");



// GET /api/timetable?view=today|weekly&date=YYYY-MM-DD
router.get("/", auth, timetableController.getTimetable);



module.exports = router;