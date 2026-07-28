const router = require("express").Router();

// Authentication
router.use("/auth", require("../modules/admin/auth/authRoutes"));

// Dashboard
router.use("/dashboard", require("../modules/admin/dashboard/dashboardRoutes"));

// Students
router.use("/students", require("../modules/admin/student/studentRoutes"));

// Admissions
router.use("/admissions", require("../modules/admin/admission/admissionRoutes"));

// Teachers
router.use("/teachers", require("../modules/admin/teacher/teacherRoutes"));

// Courses
router.use("/courses", require("../modules/admin/courseAndSubject/courseRoutes"));

// Batches
router.use("/batches", require("../modules/admin/batches/batchRoutes"));

// Attendance
router.use("/attendance", require("../modules/admin/attendance/attendanceRoutes"));

// Timetable
router.use("/timetable", require("../modules/admin/timetable/timetableRoutes"));

// Fees
router.use("/fees", require("../modules/admin/feeCollection/feeRoutes"));

// Pending Fees
router.use(
    "/pending-fees",
    require("../modules/admin/pendingFees/pendingfeeRoutes")
);

// Teacher Payments
router.use(
    "/teacher-payments",
    require("../modules/admin/teachersPayment/teacherPaymentRoutes")
);

// Income & Expense
router.use(
    "/income-expense",
    require("../modules/admin/incomeAndExpenses/incomeExpenseRoutes")
);

// Exams
router.use("/exams", require("../modules/admin/exams/examRoutes"));

// Marks
router.use("/marks", require("../modules/admin/marks/marksRoutes"));

// Homework
router.use("/homework", require("../modules/admin/homework/homeworkRoutes"));

// Study Material
router.use(
    "/study-material",
    require("../modules/admin/studyMaterial/studyMaterialRoutes")
);

// Enquiries
router.use("/enquiries", require("../modules/admin/enquiry/enquiryRoutes"));

// Demo Classes
router.use("/demo-classes", require("../modules/admin/demoClasses/demoRoutes"));
// Reports
router.use("/reports", require("../modules/admin/report/reportRoutes"));

// Settings
router.use("/settings", require("../modules/admin/setting/settingsRoutes"));

module.exports = router;