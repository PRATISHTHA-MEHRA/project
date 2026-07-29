const express = require("express");
const router = express.Router();

const auth = require("../../../middleware/authMiddleware");
const {
    getMyBatches,
    getBatchDetails,
    getBatchStudents,
    updateRemark
} = require("./teacherBatchController");

router.get("/", auth, getMyBatches);
router.get("/:id", auth, getBatchDetails);
router.get("/:id/students",auth, getBatchStudents);
router.put("/:id/students/:studentId/remark", auth, updateRemark);

module.exports = router;