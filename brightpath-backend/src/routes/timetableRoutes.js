const express = require("express");
const router = express.Router();
const timetableController = require("../controllers/timetableController");



// GET /api/timetable?view=today|weekly&date=YYYY-MM-DD
router.get("/", timetableController.getTimetable);



module.exports = router;