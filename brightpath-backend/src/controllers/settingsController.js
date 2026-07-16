
const M = require('../models/settingsModel');


const h = (fn) => async (req, res) => {
  try {
    const data = await fn(req);
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

module.exports = {
  // Profile
  getProfile: h(async () => (await M.getProfile()).rows[0]),
  updateProfile: h(async (req) => (await M.updateProfile(req.body)).rows[0]),

  // Branches
  getBranches: h(async () => (await M.getBranches()).rows),
  addBranch: h(async (req) => (await M.addBranch(req.body)).rows[0]),
  updateBranch: h(async (req) => (await M.updateBranch(req.params.id, req.body)).rows[0]),
  deleteBranch: h(async (req) => { await M.deleteBranch(req.params.id); return { id: req.params.id }; }),

  // Classrooms
  getClassrooms: h(async () => (await M.getClassrooms()).rows),
  addClassroom: h(async (req) => (await M.addClassroom(req.body)).rows[0]),
  updateClassroom: h(async (req) => (await M.updateClassroom(req.params.id, req.body)).rows[0]),
  deleteClassroom: h(async (req) => { await M.deleteClassroom(req.params.id); return { id: req.params.id }; }),

  // Fee reminder rules
  getFeeRules: h(async () => (await M.getFeeRules()).rows[0]),
  updateFeeRules: h(async (req) => (await M.updateFeeRules(req.body)).rows[0]),

  // Roles
  getRoles: h(async () => (await M.getRoles()).rows),
  addRole: h(async (req) => (await M.addRole(req.body)).rows[0]),
  updateRole: h(async (req) => (await M.updateRole(req.params.id, req.body)).rows[0]),
  deleteRole: h(async (req) => { await M.deleteRole(req.params.id); return { id: req.params.id }; }),

  // Notification templates
  getTemplates: h(async () => (await M.getTemplates()).rows),
  updateTemplate: h(async (req) => (await M.updateTemplate(req.params.key, req.body.content)).rows[0]),

  // Academic year + holidays
  getAcademicYear: h(async () => {
    const year = (await M.getAcademicYear()).rows[0];
    const holidays = (await M.getHolidays()).rows;
    return { ...year, holidays };
  }),
  updateAcademicYear: h(async (req) => (await M.updateAcademicYear(req.body)).rows[0]),
  addHoliday: h(async (req) => (await M.addHoliday(req.body)).rows[0]),
  deleteHoliday: h(async (req) => { await M.deleteHoliday(req.params.id); return { id: req.params.id }; }),
};