const Timetable = require("../models/timetableModel");

exports.getTimetable = async (req, res) => {
    try {
        const { view, date } = req.query; // view parameters: 'today', 'weekly', 'teacher', 'batch', 'room'
        const targetDate = date || "2026-06-07";
        
        // Convert target date string to locate day of the week
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const parsedDay = dayNames[new Date(targetDate).getDay()];
        const shortDay = parsedDay.slice(0, 3); // e.g., 'Sat'

        const allSlots = await Timetable.getMasterSchedules();

        // 1. TODAY'S FILTERING LOGIC
        if (view === "today") {
            const filtered = allSlots.filter(s => 
                s.days === "Mon-Sat" || s.days.includes(shortDay)
            );
            return res.status(200).json({ success: true, date: targetDate, day: parsedDay, data: filtered });
        }

        // 2. MASTER UNGROUPED RAW ARRAY (For UI custom loops)
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

exports.patchSlotStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled', 'Teacher Absent', 'Holiday'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid timetable status variant flag." });
        }

        const updated = await Timetable.updateSlotStatus(id, status);
        if (!updated) {
            return res.status(404).json({ success: false, message: "Timetable slot not found." });
        }

        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};