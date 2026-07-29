const express = require("express");

const router = express.Router();

const authController = require("./authController");

router.post("/login", authController.login);

router.post("/forgot-password", authController.forgotPassword);

module.exports = router;