const express = require("express");
const router = express.Router();
const batchController = require("../controllers/batchController");
const auth = require("../middleware/authMiddleware");

// Get All Batches
router.get("/", auth, batchController.getBatches);

// Get Single Batch
router.get("/:id", auth, batchController.getBatch);

// Create Batch
router.post("/", auth, batchController.createBatch);

// Update Batch
router.put("/:id", auth, batchController.updateBatch);

// Delete Batch
router.delete("/:id", auth, batchController.deleteBatch);

module.exports = router;