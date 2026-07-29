const express = require("express");
const router = express.Router();
const leaveController = require("./teacherLeaveController");

router.get("/", leaveController.getLeaves);
router.post("/", leaveController.applyLeave);
router.put("/:id", leaveController.updateLeave);

module.exports = router;