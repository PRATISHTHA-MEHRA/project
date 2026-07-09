const express = require("express");
const router = express.Router();
const marksController = require("../controllers/marksController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, marksController.getMarksList);
router.post("/bulk", auth, marksController.submitBulkMarks);

module.exports = router;