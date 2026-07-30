const Report = require("../../../models/reportModel");
const pool = require("../../../config/db");

const Fee = require("../../../models/feeModel");
const PendingFee = require("../../../models/pendingfeeModel");
const TeacherPayment = require("../../../models/teacherPaymentModel");
const Student = require("../../../models/studentModel");
const Batch = require("../../../models/batchModel");
const Course = require("../../../models/courseModel");
const Enquiry = require("../../../models/enquiryModel");
const Income = require("../../../models/incomeExpenseModel");
const Expense = require("../../../models/incomeExpenseModel");

const toNum = v => (v === null || v === undefined || v === '') ? 0 : Number(v);
const normName = s => String(s || '').trim().toLowerCase();

/* ---------------- month helpers ---------------- */
function monthKeyOf(dateStr){
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function prevMonthOf(month){
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1); // m-1 = current month index, -1 more = previous month
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthLabelOf(month){
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
}
function quarterLabelOf(month){
  const [y, m] = month.split('-').map(Number);
  return `Q${Math.floor((m - 1) / 3) + 1} ${y}`;
}
// Same "fall back to unfiltered if nothing has a parseable date" behavior the
// frontend used to have, kept here so real-but-undated records don't vanish.
function filterByMonth(list, month, dateField = 'date'){
  const withDates = list.filter(item => monthKeyOf(item[dateField]));
  if (withDates.length === 0) return list;
  return withDates.filter(item => monthKeyOf(item[dateField]) === month);
}
function pctDelta(curr, prev){
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / Math.abs(prev)) * 1000) / 10;
}

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
  // Collection trend is grouped by the PERIOD the fee was billed for
  // (fee_receipts.period, e.g. "Jan 2026"), not by payment_date.
  // The regex guard skips any malformed/legacy period values instead of
  // letting a bad TO_DATE() parse blow up the whole dashboard query.
  const feeTrend = await pool.query(`
    SELECT TO_CHAR(TO_DATE(period, 'Mon YYYY'), 'Mon') AS m,
           TO_DATE(period, 'Mon YYYY') AS mkey,
           COALESCE(SUM(paid_amount), 0) AS value
    FROM fee_receipts
    WHERE period ~ '^[A-Za-z]{3} [0-9]{4}$'
      AND TO_DATE(period, 'Mon YYYY') >= date_trunc('month', now()) - interval '5 months'
    GROUP BY TO_DATE(period, 'Mon YYYY')
    ORDER BY TO_DATE(period, 'Mon YYYY')
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

/* ---------------- chart aggregations (previously done in the browser) ---------------- */
function computeCourseRevenue(students, courses){
  return courses.map(cr => {
    const activeCount = students.filter(s => s.course === cr.name && s.status === 'Active').length;
    return { label: cr.name, value: activeCount * toNum(cr.monthly) };
  }).filter(r => r.label && r.value > 0).sort((a, b) => b.value - a.value);
}
function computeTeacherPayout(teacherPayments){
  const byTeacher = {};
  teacherPayments.forEach(t => {
    const key = normName(t.teacher);
    if (!key) return;
    if (!byTeacher[key]) byTeacher[key] = { label: t.teacher, value: 0 };
    byTeacher[key].value += toNum(t.paid);
  });
  return Object.values(byTeacher).sort((a, b) => b.value - a.value);
}
const SOURCE_PALETTE = ['var(--brand)', 'var(--blue)', 'var(--violet)', 'var(--green)', 'var(--amber)', 'var(--red)', 'var(--yellow)', 'var(--slate)'];
function computeAdmissionSource(enquiries){
  const bySource = {};
  enquiries.forEach(e => {
    const key = normName(e.source);
    if (!key) return;
    if (!bySource[key]) bySource[key] = { label: e.source, count: 0 };
    bySource[key].count += 1;
  });
  const rows = Object.values(bySource).sort((a, b) => b.count - a.count);
  const total = rows.reduce((a, r) => a + r.count, 0) || 1;
  return rows.map((r, i) => ({
    label: r.label,
    value: Math.round((r.count / total) * 100),
    color: SOURCE_PALETTE[i % SOURCE_PALETTE.length]
  }));
}

/* ---------------- report catalogue: record counts + periods, computed server-side ---------------- */
const REPORT_DEFS = [
  { key: 'daily-fee',    name: 'Daily Fee Collection',   cat: 'Finance' },
  { key: 'monthly-fee',  name: 'Monthly Fee Collection', cat: 'Finance' },
  { key: 'pending-fees', name: 'Pending Fees Report',    cat: 'Finance' },
  { key: 'teacher-due',  name: 'Teacher Payment Due',    cat: 'Finance' },
  { key: 'income',       name: 'Income Report',          cat: 'Finance' },
  { key: 'expense',      name: 'Expense Report',         cat: 'Finance' },
  { key: 'pnl',          name: 'Profit & Loss',          cat: 'Finance' },
  { key: 'stu-att',      name: 'Student Attendance',     cat: 'Academic' },
  { key: 'batch-att',    name: 'Batch Attendance',       cat: 'Academic' },
  { key: 'admissions',   name: 'Admission Report',       cat: 'Academic' },
  { key: 'enquiry-conv', name: 'Enquiry Conversion',     cat: 'Marketing' },
  { key: 'course-rev',   name: 'Course-wise Revenue',    cat: 'Finance' },
  { key: 'batch-rev',    name: 'Batch-wise Revenue',     cat: 'Finance' },
  { key: 'pay-mode',     name: 'Payment Mode Report',    cat: 'Finance' },
  { key: 'discount',     name: 'Discount Report',        cat: 'Finance' },
];

function recordCountsFor({ feesMonth, pendingFees, teacherPayments, incomeMonth, expenseMonth, students, batches, enquiries, courses }){
  return {
    'daily-fee': Math.min(feesMonth.length, 12),
    'monthly-fee': Math.min(feesMonth.length, 20),
    'pending-fees': pendingFees.length,
    'teacher-due': teacherPayments.filter(t => t.status !== 'Paid').length,
    'income': incomeMonth.length,
    'expense': expenseMonth.length,
    'pnl': 1,
    'stu-att': students.length,
    'batch-att': batches.filter(b => b.status !== 'Upcoming').length,
    'admissions': Math.min(students.length, 31),
    'enquiry-conv': enquiries.length,
    'course-rev': courses.length,
    'batch-rev': batches.length,
    'pay-mode': 5,
    'discount': feesMonth.filter(f => toNum(f.discount) > 0).length
  };
}

function periodsFor(month){
  const label = monthLabelOf(month);
  const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return {
    'daily-fee': todayLabel,
    'monthly-fee': label,
    'pending-fees': label,
    'teacher-due': monthLabelOf(prevMonthOf(month)), // payment-due report reflects the prior month's work
    'income': label,
    'expense': label,
    'pnl': label,
    'stu-att': label,
    'batch-att': label,
    'admissions': quarterLabelOf(month),
    'enquiry-conv': label,
    'course-rev': label,
    'batch-rev': label,
    'pay-mode': label,
    'discount': label
  };
}

exports.getDashboard = async (req, res) => {
  try {
    const month = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : monthKeyOf(new Date());
    const prevMonth = prevMonthOf(month);

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
      rawBatches, rawCourses, rawEnquiries, rawIncome, rawExpense, reportLogsRaw, monthlyTrend
    ] = results.map(r => r.status === 'fulfilled' ? r.value : []);

    results.forEach((r, i) => {
      if (r.status === 'rejected') console.warn(`Dashboard sub-query ${i} failed:`, r.reason.message);
    });

    const fees = (rawFees || []).map(f => ({
      ...f, due: toNum(f.due), paid: toNum(f.paid), discount: toNum(f.discount),
      fine: toNum(f.fine), balance: toNum(f.balance)
    }));
    const pendingFees = (rawPendingFees || []).map(p => ({ ...p, due: toNum(p.due) }));
    const teacherPayments = (rawTeacherPayments || []).map(t => ({
      ...t, gross: toNum(t.gross), ded: toNum(t.ded), adv: toNum(t.adv),
      net: toNum(t.net), paid: toNum(t.paid), balance: toNum(t.balance), collection: toNum(t.collection)
    }));
    const income = (rawIncome || []).map(x => ({ ...x, amount: toNum(x.amount) }));
    const expense = (rawExpense || []).map(x => ({ ...x, amount: toNum(x.amount) }));
    const courses = (rawCourses || []).map(c => ({
      name: c.course_name, code: c.course_code, category: c.category, level: c.level,
      subject: c.subject, duration: c.duration, monthly: toNum(c.monthly_fee),
      quarterly: toNum(c.quarterly_fee), semiAnnual: toNum(c.semi_annual_fee),
      annual: toNum(c.annual_fee), status: c.status, description: c.description
    }));
    const students = (rawStudents || []).map(s => ({
      id: s.student_code || s.id, name: s.student_name, cls: s.class_name, course: s.course_name,
      batch: s.batch_name, feeType: s.fee_type, feeAmt: toNum(s.fee_amount), admission: s.admission_date,
      status: s.status, feeStatus: s.fee_status, att: toNum(s.attendance), gender: s.gender, dob: s.dob,
      mobile: s.mobile, parentName: s.parent_name, parentMobile: s.parent_mobile, address: s.address,
      schoolName: s.school_name
    }));
    const batches = (rawBatches || []).map(b => ({ ...b, cur: toNum(b.cur ?? b.current_students) }));
    const enquiries = rawEnquiries || [];

    const reportLogs = {};
    (reportLogsRaw || []).forEach(l => { reportLogs[l.report_key] = l.generated_at; });

    /* ---- month-filtered slices (server-side, replaces client-side filterByMonth) ---- */
    const feesMonth = filterByMonth(fees, month, 'period');
    const feesPrevMonth = filterByMonth(fees, prevMonth, 'period');
    const incomeMonth = filterByMonth(income, month, 'date');
    const incomePrevMonth = filterByMonth(income, prevMonth, 'date');
    const expenseMonth = filterByMonth(expense, month, 'date');
    const expensePrevMonth = filterByMonth(expense, prevMonth, 'date');

    /* ---- KPIs: real numbers + real month-over-month deltas ---- */
    const totalCollection = feesMonth.reduce((a, f) => a + f.paid, 0);
    const totalCollectionPrev = feesPrevMonth.reduce((a, f) => a + f.paid, 0);

    const outstandingDues = pendingFees.reduce((a, p) => a + p.due, 0);
    // Pending fees is a live snapshot, not a per-month historical record, so we
    // can't honestly compute a MoM delta for it without a dues-history table.

    const netProfitMonth = incomeMonth.reduce((a, x) => a + x.amount, 0) - expenseMonth.reduce((a, x) => a + x.amount, 0);
    const netProfitPrevMonth = incomePrevMonth.reduce((a, x) => a + x.amount, 0) - expensePrevMonth.reduce((a, x) => a + x.amount, 0);

    const newAdmissions = students.filter(s => monthKeyOf(s.admission) === month).length;
    const newAdmissionsPrev = students.filter(s => monthKeyOf(s.admission) === prevMonth).length;

    const kpis = {
      month,
      totalCollection: { value: totalCollection, deltaPct: pctDelta(totalCollection, totalCollectionPrev) },
      outstandingDues: { value: outstandingDues, deltaPct: null },
      netProfit: { value: Math.abs(netProfitMonth), isLoss: netProfitMonth < 0, deltaPct: pctDelta(netProfitMonth, netProfitPrevMonth) },
      newAdmissions: { value: newAdmissions, delta: newAdmissions - newAdmissionsPrev }
    };

    /* ---- charts (previously computeCourseRevenue/computeTeacherPayout/computeAdmissionSource on the frontend) ---- */
    const charts = {
      collectionTrend: monthlyTrend?.collectionTrend || [],
      incomeExpense: monthlyTrend?.incomeExpense || [],
      courseRevenue: computeCourseRevenue(students, courses),
      teacherPayout: computeTeacherPayout(teacherPayments),
      admissionSource: computeAdmissionSource(enquiries)
    };

    /* ---- report catalogue: record counts + periods, computed server-side ---- */
    const recordCounts = recordCountsFor({ feesMonth, pendingFees, teacherPayments, incomeMonth, expenseMonth, students, batches, enquiries, courses });
    const periods = periodsFor(month);
    const reports = REPORT_DEFS.map(r => ({
      ...r,
      period: periods[r.key],
      recordCount: recordCounts[r.key] ?? 0,
      lastGenerated: reportLogs[r.key] || null
    }));

    res.json({
      success: true,
      data: {
        month, prevMonth,
        kpis, charts, reports,
        reportLogs,
        // raw + month-filtered lists still needed to render the report-detail modals
        fees: feesMonth, pendingFees, teacherPayments, students, batches, courses,
        enquiries, income: incomeMonth, expense: expenseMonth
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = exports;