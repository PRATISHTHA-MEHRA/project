const express = require("express");

const cors = require("cors");



const courseRoutes = require("./routes/courseRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const studentRoutes = require("./routes/studentRoutes");
const authRoutes=require("./routes/authRoutes");
const batchRoutes = require("./routes/batchRoutes");
const admissionRoutes = require("./routes/admissionRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");
const demoRoutes = require("./routes/demoRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const feeRoutes = require("./routes/feeRoutes");
const teacherPaymentRoutes = require("./routes/teacherPaymentRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const examRoutes = require("./routes/examRoutes");
const marksRoutes = require("./routes/marksRoutes");
const pendingFeeRoutes = require("./routes/pendingfeeRoutes");
const incomeExpenseRoutes = require("./routes/incomeExpenseRoutes");
const homeworkRoutes=require("./routes/homeworkRoutes");
const studyMaterialRoutes=require("./routes/studyMaterialRoutes");
const reportRoutes=require("./routes/reportRoutes");
const settingsRoutes=require("./routes/settingsRoutes");
const app = express();

app.use(cors());

app.use(express.json());

require("dotenv").config();
app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

app.use("/api/courses", courseRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/auth",authRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/demo-classes", demoRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/teacher-payments",teacherPaymentRoutes);
app.use("/api/timetable", require("./routes/timetableRoutes"));
app.use("/api/exams", require("./routes/examRoutes"));
app.use("/api/marks", require("./routes/marksRoutes"));
app.use("/api/pending-fees", require("./routes/pendingfeeRoutes"));
app.use("/api/income-expense", incomeExpenseRoutes);
app.use("/api/homework",homeworkRoutes);
app.use("/api/study-material",studyMaterialRoutes);
app.use("/api/reports",reportRoutes);
app.use("/api/settings",settingsRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});