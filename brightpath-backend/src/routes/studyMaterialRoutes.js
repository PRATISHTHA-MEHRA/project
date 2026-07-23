const express = require("express");
const router = express.Router();
const studyMaterialController = require("../controllers/studyMaterialController");
const upload = require("../middleware/upload");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, studyMaterialController.getMaterialList);
router.post("/", auth, upload.single("file"), studyMaterialController.addMaterial);
router.delete("/:id", auth, studyMaterialController.deleteMaterial);
router.post("/:id/download", auth, studyMaterialController.downloadMaterial);
router.get("/:id/file", auth, studyMaterialController.getMaterialFile);

module.exports = router;