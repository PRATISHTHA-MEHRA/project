const express = require("express");
const router = express.Router();
const payController = require("./teacherPaymentController");
const auth = require("../../../middleware/authMiddleware");

router.get("/dashboard", auth, payController.getPaymentDashboard);
router.get("/preview", auth, payController.getPaymentPreview);
router.post("/add", auth, payController.addNewVoucher);
router.patch("/pay/:id", auth, payController.updatePaymentDetails);

module.exports = router;
