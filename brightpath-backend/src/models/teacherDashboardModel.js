const db = require("../config/db");

const getDashboardData = async (teacherId, fallbackName) => {
  try {
    let actualTeacherName = fallbackName || "Teacher";

    // 1. Fetch Actual Teacher Profile Name from DB using 'teacher_name'
    if (teacherId) {
      const teacherProfileQuery = `
        SELECT teacher_name 
        FROM teachers 
        WHERE id = $1;
      `;
      const teacherRes = await db.query(teacherProfileQuery, [teacherId]);
      
      if (teacherRes.rows.length > 0 && teacherRes.rows[0].teacher_name) {
        actualTeacherName = teacherRes.rows[0].teacher_name;
      }
    }

    // 2. Fetch Today's Classes / Timetable for this Teacher
    const todayClassesQuery = `
      SELECT 
        b.id,
        b.batch_code,
        b.batch_name AS batch,
        c.course_name AS course,
        b.subject,
        COALESCE(b.classroom, 'Room 101') AS room,
        COALESCE(b.start_time, '09:00 AM') AS st,
        COALESCE(b.end_time, '10:00 AM') AS et,
        CONCAT(b.start_time, ' - ', b.end_time) AS timing,
        COALESCE(b.status, 'Active') AS status,
        COALESCE(b.current_students, COUNT(DISTINCT s.id))::INT AS students
      FROM batches b
      LEFT JOIN courses c ON b.course_id = c.id
      LEFT JOIN students s ON s.batch_id = b.id
      WHERE (b.teacher_id = $1 OR $1 IS NULL)
        AND (b.status = 'Active' OR b.status IS NULL)
      GROUP BY b.id, c.course_name
      ORDER BY b.start_time ASC;
    `;

    // 3. Fetch Batch Attendance Percentages
    const batchAttendanceQuery = `
      SELECT 
        b.batch_name AS label,
        COALESCE(
          ROUND(
            (SUM(CASE WHEN al.status IN ('Present', 'Late') THEN 1 ELSE 0 END)::NUMERIC 
             / NULLIF(COUNT(al.id), 0)::NUMERIC) * 100
          ), 85
        )::INT AS val
      FROM batches b
      LEFT JOIN attendance_logs al ON al.batch_name = b.batch_name
      WHERE (b.teacher_id = $1 OR $1 IS NULL)
      GROUP BY b.id, b.batch_name
      ORDER BY b.batch_name ASC
      LIMIT 5;
    `;

    // 4. Fetch Active Batches and Total Students Count
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT b.id)::INT AS active_batches,
        COALESCE(SUM(b.current_students), COUNT(DISTINCT s.id))::INT AS total_students
      FROM batches b
      LEFT JOIN students s ON s.batch_id = b.id
      WHERE (b.teacher_id = $1 OR $1 IS NULL) 
        AND (b.status = 'Active' OR b.status IS NULL);
    `;

    // Concurrently execute database queries
    const [todayRes, batchAttRes, statsRes] = await Promise.all([
      db.query(todayClassesQuery, [teacherId]),
      db.query(batchAttendanceQuery, [teacherId]),
      db.query(statsQuery, [teacherId])
    ]);

    const timetableToday = todayRes.rows || [];
    const batchAttendance = batchAttRes.rows || [];
    const stats = statsRes.rows[0] || { active_batches: 0, total_students: 0 };

    // Format output to meet frontend expectations
    return {
      teacherName: actualTeacherName,
      todayClasses: timetableToday.length,
      upcoming: Math.max(0, timetableToday.length - 1),
      activeBatches: stats.active_batches || 0,
      totalStudents: stats.total_students || 0,
      completedThisMonth: 18,
      attendancePending: 1,
      homeworkPending: 3,
      testsToEvaluate: 2,
      paymentDue: 0,
      lastPayment: "Paid (1st Jul)",
      timetableToday: timetableToday,
      monthlyMetrics: {
        classesCompleted: 18,
        classesPct: 75,
        avgAttendance: 88,
        homeworkChecked: 24,
        homeworkPct: 80,
        salaryStatus: "Processed"
      },
      batchAttendance: batchAttendance.length > 0 ? batchAttendance : [
        { label: "Batch A1", val: 90 },
        { label: "Batch B1", val: 82 }
      ],
      notifications: [
        {
          type: "batch",
          color: "violet",
          title: "New Batch Assigned",
          text: "You have been assigned to new schedule batches.",
          time: "2 hours ago"
        },
        {
          type: "pay",
          color: "green",
          title: "Salary Credited",
          text: "Monthly remuneration has been processed.",
          time: "1 day ago"
        }
      ]
    };
  } catch (err) {
    console.error("Error in getDashboardData model:", err);
    throw err;
  }
};

module.exports = {
  getDashboardData
};