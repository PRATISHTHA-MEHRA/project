const express = require("express");
const router = express.Router();
const classNotesController = require("./classNotesController");
const auth = require("../../../middleware/authMiddleware"); // Optional auth guard

router.get("/", auth, classNotesController.getClassNotes);
router.post("/", auth, classNotesController.addClassNote);
router.delete("/:id", auth, classNotesController.deleteClassNote);

module.exports = router;