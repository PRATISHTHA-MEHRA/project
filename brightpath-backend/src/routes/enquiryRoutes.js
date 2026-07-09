const express = require("express");
const router = express.Router();
const enquiryController = require("../controllers/enquiryController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, enquiryController.getEnquiries);
router.get("/:id", auth, enquiryController.getEnquiry);
router.post("/", auth, enquiryController.createEnquiry);
router.put("/:id", auth, enquiryController.updateEnquiry);
router.delete("/:id", auth, enquiryController.deleteEnquiry);
router.post("/:id/convert", auth, enquiryController.convertEnquiry);

module.exports = router;