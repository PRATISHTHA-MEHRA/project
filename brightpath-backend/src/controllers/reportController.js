const Report = require("../models/reportModel");
const pool = require("../config/db"); 

const Fee = require("../models/feeModel");
const PendingFee = require("../models/pendingfeeModel");
const TeacherPayment = require("../models/teacherPaymentModel");
const Student = require("../models/studentModel");
const Batch = require("../models/batchModel");
const Course = require("../models/courseModel");
const Enquiry = require("../models/enquiryModel");
const Income = require("../models/incomeExpenseModel");
const Expense = require("../models/incomeExpenseModel");

const toNum = v => (v === null || v === undefined || v === '') ? 0 : Number(v);

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

async function getMonthlyTrend() {
  const feeTrend = await pool.query(`
    SELECT TO_CHAR(date_trunc('month', payment_date), 'Mon') AS m,
           COALESCE(SUM(paid_amount), 0) AS value
    FROM fee_receipts
    WHERE payment_date >= date_trunc('month', now()) - interval '5 months'
    GROUP BY date_trunc('month', payment_date)
    ORDER BY date_trunc('month', payment_date)
  `);

  const incomeTrend = await pool.query(`
    SELECT date_trunc('month', entry_date) AS mkey,
           TO_CHAR(date_trunc('month', entry_date), 'Mon') AS m,
           COALESCE(SUM(amount), 0) AS inc
    FROM income_entries
    WHERE entry_date >= date_trunc('month', now()) - interval '5 months'
    GROUP BY date_trunc('month', entry_date)
  `);

  const expenseTrend = await pool.query(`
    SELECT date_trunc('month', entry_date) AS mkey,
           TO_CHAR(date_trunc('month', entry_date), 'Mon') AS m,
           COALESCE(SUM(amount), 0) AS exp
    FROM expense_entries
    WHERE entry_date >= date_trunc('month', now()) - interval '5 months'
    GROUP BY date_trunc('month', entry_date)
  `);


  const byMonth = {};
  incomeTrend.rows.forEach(r => {
    byMonth[r.mkey] = byMonth[r.mkey] || { m: r.m, inc: 0, exp: 0 };
    byMonth[r.mkey].inc = toNum(r.inc);
  });
  expenseTrend.rows.forEach(r => {
    byMonth[r.mkey] = byMonth[r.mkey] || { m: r.m, inc: 0, exp: 0 };
    byMonth[r.mkey].exp = toNum(r.exp);
  });
  const incomeExpense = Object.keys(byMonth).sort().map(k => byMonth[k]);

  return {
    collectionTrend: feeTrend.rows.map(r => ({ m: r.m, value: toNum(r.value) })),
    incomeExpense
  };
}


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
      Report.getLatestLogs(),
      getMonthlyTrend()
    ]);

    const [
      rawFees, rawPendingFees, rawTeacherPayments, rawStudents,
      rawBatches, rawCourses, rawEnquiries, rawIncome, rawExpense, reportLogs, monthlyTrend
    ] = results.map(r => r.status === 'fulfilled' ? r.value : []);

    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.warn(`Dashboard sub-query ${i} failed:`, r.reason.message);
      }
    });

    const fees = (rawFees || []).map(f => ({
      ...f, due: toNum(f.due), paid: toNum(f.paid), discount: toNum(f.discount),
      fine: toNum(f.fine), balance: toNum(f.balance)
    }));

    const pendingFees = (rawPendingFees || []).map(p => ({
      ...p, due: toNum(p.due)
    }));

    const teacherPayments = (rawTeacherPayments || []).map(t => ({
      ...t, gross: toNum(t.gross), ded: toNum(t.ded), adv: toNum(t.adv),
      net: toNum(t.net), paid: toNum(t.paid), balance: toNum(t.balance),
      collection: toNum(t.collection)
    }));

    const income = (rawIncome || []).map(x => ({ ...x, amount: toNum(x.amount) }));
    const expense = (rawExpense || []).map(x => ({ ...x, amount: toNum(x.amount) }));

    const courses = (rawCourses || []).map(c => ({
      name: c.course_name,
      code: c.course_code,
      category: c.category,
      level: c.level,
      subject: c.subject,
      duration: c.duration,
      monthly: toNum(c.monthly_fee),
      quarterly: toNum(c.quarterly_fee),
      semiAnnual: toNum(c.semi_annual_fee),
      annual: toNum(c.annual_fee),
      status: c.status,
      description: c.description
    }));

    const students = (rawStudents || []).map(s => {
      let admission = s.admission_date;
      if (admission instanceof Date) admission = admission;
      return {
        id: s.student_code || s.id,
        name: s.student_name,
        cls: s.class_name,
        course: s.course_name,
        batch: s.batch_name,
        feeType: s.fee_type,
        feeAmt: toNum(s.fee_amount),
        admission,
        status: s.status,
        feeStatus: s.fee_status,
        att: toNum(s.attendance),
        gender: s.gender,
        dob: s.dob,
        mobile: s.mobile,
        parentName: s.parent_name,
        parentMobile: s.parent_mobile,
        address: s.address,
        schoolName: s.school_name
      };
    });

    const batches = (rawBatches || []).map(b => ({
      ...b, cur: toNum(b.cur ?? b.current_students)
    }));

    const enquiries = rawEnquiries || [];

    const logsMap = {};
    (reportLogs || []).forEach(l => { logsMap[l.report_key] = l.generated_at; });

    
    const { collectionTrend, incomeExpense } = monthlyTrend || {};

    res.json({
      success: true,
      data: {
        fees, pendingFees, teacherPayments, students,
        batches, courses, enquiries, income, expense,
        reportLogs: logsMap,
        collectionTrend, incomeExpense
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = exports;