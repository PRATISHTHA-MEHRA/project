const Fee = require("../../../models/feeModel");
const PendingFee = require("../../../models/pendingfeeModel");
const TeacherPayment = require("../../../models/teacherPaymentModel");
const Student = require("../../../models/studentModel");
const Batch = require("../../../models/batchModel");
const Course = require("../../../models/courseModel");
const Enquiry = require("../../../models/enquiryModel");
const Income = require("../../../models/incomeExpenseModel");
const Expense = require("../../../models/incomeExpenseModel");
const Teacher = require("../../../models/teacherModel");
const Timetable = require("../../../models/timetableModel");
const Attendance = require("../../../models/attendanceModel");
const Admission = require("../../../models/admissionModel");


const toNum = v => (v === null || v === undefined || v === '') ? 0 : Number(v);

// ---- chart helpers -------------------------------------------------------

// Periods in this schema are stored as "Jun 2026" style strings
// (see pendingfeeModel.seedInitialPendingFee), NOT "YYYY-MM". Keys below
// match that exact format so lookups actually hit.
const lastNMonthKeys = (n) => {
  const out = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const fullLabel = dt.toLocaleString('en-US', { month: 'short', year: 'numeric' }); // "Jun 2026"
    out.push({ key: fullLabel.trim().toLowerCase(), shortLabel: fullLabel.split(' ')[0] });
  }
  return out;
};

const normPeriod = (p) => String(p || '').trim().toLowerCase();

const computeCollectionTrend = (fees) => {
  const months = lastNMonthKeys(6);
  const byMonth = {};
  months.forEach(m => byMonth[m.key] = 0);

  fees.forEach(f => {
    const key = normPeriod(f.period);
    if (byMonth[key] !== undefined) byMonth[key] += toNum(f.paid);
  });

  return months.map(m => ({ m: m.shortLabel, v: Math.round(byMonth[m.key] / 1000) }));
};

const computeIncomeExpense = (income, expense) => {
  const months = lastNMonthKeys(6);
  const inc = {}, exp = {};
  months.forEach(m => { inc[m.key] = 0; exp[m.key] = 0; });

  // income/expense rows use real calendar dates (not period strings),
  // so we bucket by calendar month here instead of the period key.
  const dateMonthKey = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    return d.toLocaleString('en-US', { month: 'short', year: 'numeric' }).trim().toLowerCase();
  };

  income.forEach(x => {
    const key = dateMonthKey(x.date);
    if (key && inc[key] !== undefined) inc[key] += toNum(x.amount);
  });
  expense.forEach(x => {
    const key = dateMonthKey(x.date);
    if (key && exp[key] !== undefined) exp[key] += toNum(x.amount);
  });

  return months.map(m => ({
    m: m.shortLabel,
    inc: Math.round(inc[m.key] / 1000),
    exp: Math.round(exp[m.key] / 1000)
  }));
};

// NOTE: this is "currently outstanding dues, grouped by the billing period
// they belong to" — not a true historical trend. student_pending_fees rows
// get updated/cleared as they're paid (see syncPendingBalance), there's no
// archived snapshot table, so a paid-off due simply vanishes from this view
// rather than showing up as "paid" in a past month. Real trending would
// need a periodic snapshot job. This is still genuine live data though,
// not mock.
const computePendingTrend = (pendingFees) => {
  const months = lastNMonthKeys(6);
  const byMonth = {};
  months.forEach(m => byMonth[m.key] = 0);

  pendingFees.forEach(p => {
    const key = normPeriod(p.period);
    if (byMonth[key] !== undefined) byMonth[key] += toNum(p.due);
  });

  return months.map(m => ({ m: m.shortLabel, v: Math.round(byMonth[m.key] / 1000) }));
};


const computeCourseRevenue = (fees) => {
  const byCourse = {};
  fees.forEach(f => {
    const key = String(f.course || '').trim();
    if (!key) return;
    if (!byCourse[key]) byCourse[key] = { label: f.course, value: 0 };
    byCourse[key].value += toNum(f.paid);
  });
  return Object.values(byCourse)
    .filter(r => r.value > 0)
    .sort((a, b) => b.value - a.value);
};

const computeTeacherPayout = (teacherPayments) => {
  const byTeacher = {};
  teacherPayments.forEach(t => {
    const key = String(t.teacher || '').trim().toLowerCase();
    if (!key) return;
    if (!byTeacher[key]) byTeacher[key] = { label: t.teacher, value: 0 };
    byTeacher[key].value += toNum(t.paid);
  });
  return Object.values(byTeacher).sort((a, b) => b.value - a.value);
};


const computeBatchCount = (students, batches) => {
  return batches
    .filter(b => b.batch_name)
    .map(b => {
      const count = students.filter(s => s.batch === b.batch_name && s.status === 'Active').length;
      return { label: b.batch_name, value: count };
    })
    .filter(r => r.value > 0)
    .sort((a, b) => b.value - a.value);
};


const computeCurrentPeriodFeeStats = (fees) => {
  const currentPeriod = new Date()
    .toLocaleString('en-US', { month: 'short', year: 'numeric' })
    .trim().toLowerCase();

  const rows = fees.filter(f => normPeriod(f.period) === currentPeriod);
  const totalDue = rows.reduce((a, f) => a + toNum(f.due), 0);
  const totalPaid = rows.reduce((a, f) => a + toNum(f.paid), 0);

  return {
    monthlyCollection: totalPaid, // real ₹ collected against this period's billing
    feeCollectionRatePct: totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : null
  };
};

// Of enquiries that reached the demo stage (Demo Scheduled / Demo Completed /
// Converted — i.e. excludes New/Contacted/Interested which never got a demo),
// what percentage converted.
const computeDemoConversion = (enquiries) => {
  const demoStageStatuses = ['demo scheduled', 'demo completed', 'converted'];
  const demoRows = enquiries.filter(e => demoStageStatuses.includes(String(e.status || '').trim().toLowerCase()));
  const converted = demoRows.filter(e => String(e.status || '').trim().toLowerCase() === 'converted').length;

  if (!demoRows.length) return null;
  return Math.round((converted / demoRows.length) * 100);
};

const computeAdmissionSource = (enquiries) => {
  const PALETTE = ['var(--brand)', 'var(--blue)', 'var(--violet)', 'var(--green)', 'var(--amber)', 'var(--red)', 'var(--yellow)', 'var(--slate)'];
  const bySource = {};
  enquiries.forEach(e => {
    const key = String(e.source || '').trim().toLowerCase();
    if (!key) return;
    if (!bySource[key]) bySource[key] = { label: e.source, count: 0 };
    bySource[key].count += 1;
  });
  const rows = Object.values(bySource).sort((a, b) => b.count - a.count);
  const total = rows.reduce((a, r) => a + r.count, 0) || 1;
  return rows.map((r, i) => ({
    label: r.label,
    value: Math.round((r.count / total) * 100),
    color: PALETTE[i % PALETTE.length]
  }));
};

// ---------------------------------------------------------------------------

exports.getSummary = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

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
      Teacher.getAll(),
      Timetable.getMasterSchedules(),
      Attendance.getDailyKPIs(today),
      Admission.getAdmissionStats()
    ]);

    const [
      rawFees, rawPendingFees, rawTeacherPayments, rawStudents,
      rawBatches, rawCourses, rawEnquiries, rawIncome, rawExpense,
      teachers, rawSchedule, attendanceKpis, admissionStats
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
      category: c.category,
      level: c.level,
      monthly: toNum(c.monthly_fee),
      status: c.status
    }));

    const students = (rawStudents || []).map(s => {
      let admission = s.admission_date;
      if (admission instanceof Date) admission = admission;
      return {
        id: s.student_code || s.id,
        name: s.student_name,
        course: s.course_name,
        batch: s.batch_name,
        status: s.status,
        admission
      };
    });

    const batches = (rawBatches || []).map(b => ({
      ...b, cur: toNum(b.cur ?? b.current_students)
    }));

    const enquiries = rawEnquiries || [];

    const weekday = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    const weekdayFull = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    let todayClasses = (rawSchedule || []).filter(cls => {
      const days = String(cls.days || '').toLowerCase();
      return days.includes(weekday.toLowerCase()) || days.includes(weekdayFull.toLowerCase());
    });

    todayClasses = todayClasses.map(t => ({ ...t, students: toNum(t.students) }));

    // ---- server-side chart aggregation (replaces frontend compute* fns) ----
    const charts = {
      collectionTrend: computeCollectionTrend(fees),
      incomeExpense: computeIncomeExpense(income, expense),
      pendingTrend: computePendingTrend(pendingFees),
      courseRevenue: computeCourseRevenue(fees),
      teacherPayout: computeTeacherPayout(teacherPayments),
      batchCount: computeBatchCount(students, batches),
      admissionSource: computeAdmissionSource(enquiries)
    };

    const periodFeeStats = computeCurrentPeriodFeeStats(fees);

    res.json({
      success: true,
      data: {
        fees, pendingFees, teacherPayments, students,
        batches, courses, enquiries, income, expense,
        totalTeachers: (teachers || []).length,
        todayClasses,
        attendancePct: attendanceKpis?.overall_pct !== undefined ? toNum(attendanceKpis.overall_pct) : null,
        newAdmissionsThisMonth: admissionStats?.month_count !== undefined ? toNum(admissionStats.month_count) : null,
        avgAdmissionFee: admissionStats?.avg_fee !== undefined ? toNum(admissionStats.avg_fee) : null,
        monthlyCollection: periodFeeStats.monthlyCollection, // by billing period, not payment date
        feeCollectionRatePct: periodFeeStats.feeCollectionRatePct,
        demoConversionPct: computeDemoConversion(enquiries),
        charts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};