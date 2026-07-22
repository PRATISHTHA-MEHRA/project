

const getTodayClasses = async () => {
  // ⚠️ No timetable/schedule table exists yet in this schema.
  // Returning [] so the frontend falls back to DB.today sample data.
  return [];
};

module.exports = { getTodayClasses };