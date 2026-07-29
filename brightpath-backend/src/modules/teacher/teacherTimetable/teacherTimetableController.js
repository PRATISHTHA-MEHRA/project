// src/modules/teacher/teacherTimetable/teacherTimetableController.js
const Timetable = require("../../../models/timetableModel");

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEK_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function matchesDay(scheduleDays, abbr) {
    if (!scheduleDays) return false;
    const normalized = scheduleDays.trim();

    if (normalized === 'Mon-Sat') return abbr !== 'Sun';
    if (normalized === 'Mon-Fri') return !['Sat', 'Sun'].includes(abbr);
    if (normalized === 'Daily' || normalized === 'All Days') return true;

    return normalized.split(',').map(d => d.trim()).includes(abbr);
}

const getTeacherId = (req) => {
    if (!req.user) return null;
    return req.user.id || req.user.teacher_id || req.user.userId || null;
};

exports.getTeacherTimetable = async (req, res) => {
    try {
        const teacherId = getTeacherId(req);
        if (!teacherId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Teacher session missing" });
        }

        const { view = 'today', date } = req.query;
        const targetDate = date || new Date().toISOString().slice(0, 10);

        const dayIndex = new Date(`${targetDate}T00:00:00`).getDay();
        const dayAbbr = DAY_ABBR[dayIndex];
        const dayFull = DAY_FULL[dayIndex];

        // Fetch schedules assigned strictly to this teacher
        const teacherSlots = await Timetable.getSchedulesByTeacherId(teacherId);

        // 1. Today's View
        if (view === 'today') {
            const todayClasses = teacherSlots.filter(s => matchesDay(s.days, dayAbbr));
            return res.status(200).json({
                success: true,
                date: targetDate,
                day: dayFull,
                data: todayClasses
            });
        }

        // 2. Week's View
        if (view === 'week') {
            const weekClasses = [];
            WEEK_FULL.forEach((dayName, i) => {
                const daySlots = teacherSlots.filter(s => matchesDay(s.days, WEEK_ABBR[i]));
                daySlots.forEach(slot => {
                    weekClasses.push({ ...slot, day: dayName });
                });
            });

            return res.status(200).json({
                success: true,
                date: targetDate,
                data: weekClasses
            });
        }

        // 3. Month / Recurring View
        return res.status(200).json({
            success: true,
            date: targetDate,
            data: teacherSlots
        });

    } catch (err) {
        console.error("Error fetching teacher timetable:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};