const express = require('express');
const router = express.Router();
const C = require('../controllers/settingsController');

// Centre Profile
router.get('/profile', C.getProfile);
router.put('/profile', C.updateProfile);

// Branches
router.get('/branches', C.getBranches);
router.post('/branches', C.addBranch);
router.put('/branches/:id', C.updateBranch);
router.delete('/branches/:id', C.deleteBranch);

// Classrooms
router.get('/classrooms', C.getClassrooms);
router.post('/classrooms', C.addClassroom);
router.put('/classrooms/:id', C.updateClassroom);
router.delete('/classrooms/:id', C.deleteClassroom);

// Fee reminder rules
router.get('/fee-rules', C.getFeeRules);
router.put('/fee-rules', C.updateFeeRules);

// Roles & permissions
router.get('/roles', C.getRoles);
router.post('/roles', C.addRole);
router.put('/roles/:id', C.updateRole);
router.delete('/roles/:id', C.deleteRole);

// Notification templates
router.get('/templates', C.getTemplates);
router.put('/templates/:key', C.updateTemplate);

// Academic year + holidays
router.get('/academic-year', C.getAcademicYear);
router.put('/academic-year', C.updateAcademicYear);
router.post('/academic-year/holidays', C.addHoliday);
router.delete('/academic-year/holidays/:id', C.deleteHoliday);

module.exports = router;

