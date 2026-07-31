const express = require("express");
const router = express.Router();
const authController = require("./authController");
const auth = require("../../../middleware/authMiddleware");


router.post("/login", authController.login);
router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);
router.post("/forgot-password", authController.forgotPassword);
router.post("/change-password", auth,  authController.changePassword);

module.exports = router;