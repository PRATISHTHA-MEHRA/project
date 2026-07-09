const express = require("express");
const router = express.Router();
const demoController = require("../controllers/demoController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, demoController.getDemos);
router.post("/", auth, demoController.createDemo);
router.put("/:id", auth, demoController.updateDemo);
router.post("/:id/convert", auth, demoController.convertDemoToAdmission);

module.exports = router;