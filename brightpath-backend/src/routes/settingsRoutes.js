const express = require('express');
const router = express.Router();
const C = require('../controllers/settingsController');
const auth = require("../middleware/authMiddleware");

// Centre Profile
router.get('/profile', auth, C.getProfile);
router.put('/profile', auth, C.updateProfile);

// Branches
router.get('/branches',auth, C.getBranches);
router.post('/branches', auth, C.addBranch);
router.put('/branches/:id', auth, C.updateBranch);
router.delete('/branches/:id', auth, C.deleteBranch);

// Classrooms
router.get('/classrooms', auth, C.getClassrooms);
router.post('/classrooms', auth, C.addClassroom);
router.put('/classrooms/:id', auth, C.updateClassroom);
router.delete('/classrooms/:id', auth, C.deleteClassroom);

// Fee reminder rules
router.get('/fee-rules', auth, C.getFeeRules);
router.put('/fee-rules', auth, C.updateFeeRules);

// Roles & permissions
router.get('/roles', auth, C.getRoles);
router.post('/roles', auth, C.addRole);
router.put('/roles/:id', auth, C.updateRole);
router.delete('/roles/:id', auth, C.deleteRole);

// Notification templates
router.get('/templates', auth, C.getTemplates);
router.put('/templates/:key', auth, C.updateTemplate);

// Academic year + holidays
router.get('/academic-year', auth, C.getAcademicYear);
router.put('/academic-year', auth, C.updateAcademicYear);
router.post('/academic-year/holidays', auth, C.addHoliday);
router.delete('/academic-year/holidays/:id', auth, C.deleteHoliday);

module.exports = router;

