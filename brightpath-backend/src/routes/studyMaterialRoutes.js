const express = require("express");
const router = express.Router();
const studyMaterialController = require("../controllers/studyMaterialController");
const upload = require("../middleware/upload");

router.get("/", studyMaterialController.getMaterialList);
router.post("/", upload.single("file"), studyMaterialController.addMaterial);
router.delete("/:id", studyMaterialController.deleteMaterial);
router.post("/:id/download", studyMaterialController.downloadMaterial);
router.get("/:id/file", studyMaterialController.getMaterialFile);

module.exports = router;