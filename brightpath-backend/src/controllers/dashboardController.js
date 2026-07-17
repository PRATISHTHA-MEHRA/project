const Fee = require("../models/feeModel");
const PendingFee = require("../models/pendingfeeModel");
const TeacherPayment = require("../models/teacherPaymentModel");
const Student = require("../models/studentModel");
const Batch = require("../models/batchModel");
const Course = require("../models/courseModel");
const Enquiry = require("../models/enquiryModel");
const Income = require("../models/incomeExpenseModel");
const Expense = require("../models/incomeExpenseModel");
const Teacher = require("../models/teacherModel");
const Timetable = require("../models/timetableModel");
const Attendance = require("../models/attendanceModel");
const Admission = require("../models/admissionModel");


const toNum = v => (v === null || v === undefined || v === '') ? 0 : Number(v);

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
      if (admission instanceof Date) admission = admission.toISOString().slice(0, 10);
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
    if (!todayClasses.length) todayClasses = rawSchedule || [];
    todayClasses = todayClasses.map(t => ({ ...t, students: toNum(t.students) }));

    res.json({
      success: true,
      data: {
        fees, pendingFees, teacherPayments, students,
        batches, courses, enquiries, income, expense,
        totalTeachers: (teachers || []).length,
        todayClasses,
        attendancePct: attendanceKpis?.overall_pct !== undefined ? toNum(attendanceKpis.overall_pct) : null,
        newAdmissionsThisMonth: admissionStats?.month_count !== undefined ? toNum(admissionStats.month_count) : null,
        avgAdmissionFee: admissionStats?.avg_fee !== undefined ? toNum(admissionStats.avg_fee) : null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};