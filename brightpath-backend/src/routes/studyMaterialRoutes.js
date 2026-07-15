
const express = require("express");
const router = express.Router();
const studyMaterialController = require("../controllers/studyMaterialController");

router.get("/", studyMaterialController.getMaterialList);
router.post("/", studyMaterialController.addMaterial);
router.delete("/:id", studyMaterialController.deleteMaterial);
router.post("/:id/download", studyMaterialController.downloadMaterial);

module.exports = router;

