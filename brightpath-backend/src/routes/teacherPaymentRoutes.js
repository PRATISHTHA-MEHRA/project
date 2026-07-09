const express = require("express");
const router = express.Router();
const payController = require("../controllers/teacherPaymentController");
const auth = require("../middleware/authMiddleware");

router.get("/dashboard", auth, payController.getPaymentDashboard);
router.post("/add", auth, payController.addNewVoucher);
router.patch("/pay/:id", auth, payController.updatePaymentDetails);

module.exports = router;