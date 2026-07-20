const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, authorize("Super Admin"), adminController.create);
router.get("/", authMiddleware, authorize("Super Admin"), adminController.list);
router.put("/:id", authMiddleware, authorize("Super Admin"), adminController.update);

module.exports = router;