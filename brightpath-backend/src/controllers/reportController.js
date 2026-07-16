const Report = require("../models/reportModel");

const Fee = require("../models/feeModel");
const PendingFee = require("../models/pendingfeeModel");
const TeacherPayment = require("../models/teacherPaymentModel");
const Student = require("../models/studentModel");
const Batch = require("../models/batchModel");
const Course = require("../models/courseModel");
const Enquiry = require("../models/enquiryModel");
const Income = require("../models/incomeExpenseModel");
const Expense = require("../models/incomeExpenseModel");

exports.getLogs = async (req, res) => {
  try {
    const data = await Report.getLatestLogs();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.logGeneration = async (req, res) => {
  try {
    const { name, action } = req.body;
    const data = await Report.logGeneration(req.params.key, name, action);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const results = await Promise.allSettled([
      Fee.getAllReceipts(),
      PendingFee.getPendingFeesList(),
      TeacherPayment.getAllPayments(),
      Student.getAll(),
      Batch.getAllBatches(),
      Course.getAll(),
      Enquiry.getAll(),
      Income.getIncomeList(),
      Expense.getExpenseList(),
      Report.getLatestLogs()
    ]);

    const [
      fees, pendingFees, teacherPayments, rawStudents,
      batches, rawCourses, enquiries, income, expense, reportLogs
    ] = results.map(r => r.status === 'fulfilled' ? r.value : []);

    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.warn(`Dashboard sub-query ${i} failed:`, r.reason.message);
      }
    });

    // courseModel.getAll() does SELECT * -> raw DB column names.
    // Map to what reports.html's buildBody() expects (cr.name, cr.monthly, etc.)
    const courses = (rawCourses || []).map(c => ({
      name: c.course_name,
      code: c.course_code,
      category: c.category,
      level: c.level,
      subject: c.subject,
      duration: c.duration,
      monthly: c.monthly_fee,
      quarterly: c.quarterly_fee,
      semiAnnual: c.semi_annual_fee,
      annual: c.annual_fee,
      status: c.status,
      description: c.description
    }));


    const students = (rawStudents || []).map(s => {
      let admission = s.admission_date;
      if (admission instanceof Date) {
        admission = admission.toISOString().slice(0, 10); // 'YYYY-MM-DD' so .startsWith() works
      }
      return {
        id: s.student_code || s.id,
        name: s.student_name,
        cls: s.class_name,
        course: s.course_name,  
        batch: s.batch_name,    
        feeType: s.fee_type,
        feeAmt: s.fee_amount,
        admission,
        status: s.status,
        feeStatus: s.fee_status,
        att: s.attendance,
        gender: s.gender,
        dob: s.dob,
        mobile: s.mobile,
        parentName: s.parent_name,
        parentMobile: s.parent_mobile,
        address: s.address,
        schoolName: s.school_name
      };
    });

    const logsMap = {};
    (reportLogs || []).forEach(l => { logsMap[l.report_key] = l.generated_at; });

    res.json({
      success: true,
      data: {
        fees,
        pendingFees,
        teacherPayments,
        students,
        batches,
        courses,
        enquiries,
        income,
        expense,
        reportLogs: logsMap
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = exports;