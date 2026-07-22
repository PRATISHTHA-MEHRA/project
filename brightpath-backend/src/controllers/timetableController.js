const Timetable = require("../models/timetableModel");

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEK_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // Mon-Sat working week
const WEEK_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


function matchesDay(scheduleDays, abbr) {
    if (!scheduleDays) return false;
    const normalized = scheduleDays.trim();

    if (normalized === 'Mon-Sat') return abbr !== 'Sun';
    if (normalized === 'Mon-Fri') return !['Sat', 'Sun'].includes(abbr);
    if (normalized === 'Daily' || normalized === 'All Days') return true;

    return normalized.split(',').map(d => d.trim()).includes(abbr);
}

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

exports.getTimetable = async (req, res) => {
    try {
        const { view, date } = req.query; // view: 'today' | 'weekly' | anything else (raw list)
        const targetDate = date || todayISO();

        const dayIndex = new Date(`${targetDate}T00:00:00`).getDay();
        const dayAbbr = DAY_ABBR[dayIndex];
        const dayFull = DAY_FULL[dayIndex];

        const allSlots = await Timetable.getMasterSchedules();


        if (view === "today") {
            const filtered = allSlots.filter(s => matchesDay(s.days, dayAbbr));
            return res.status(200).json({ success: true, date: targetDate, day: dayFull, data: filtered });
        }


        if (view === "weekly") {
            const grouped = WEEK_FULL.map((dayName, i) => ({
                day: dayName,
                classes: allSlots.filter(s => matchesDay(s.days, WEEK_ABBR[i]))
            }));
            return res.status(200).json({ success: true, date: targetDate, data: grouped });
        }

       
        res.status(200).json({
            success: true,
            view: view || "all",
            date: targetDate,
            data: allSlots
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

