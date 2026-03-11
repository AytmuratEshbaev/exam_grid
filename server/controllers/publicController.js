const db = require('../database/db');

// Bugungi imtihonlarni olish API si
exports.getTodayExams = async (req, res) => {
  try {
    // CURRENT_DATE in PostgreSQL ensures we only fetch today's exams
    const query = `
      SELECT e.id, e.name, e.exam_date, e.exam_time, e.status, c.name as class_name 
      FROM exams e 
      JOIN classes c ON e.class_id = c.id
      WHERE e.exam_date = CURRENT_DATE AND e.status != 'scheduled'
      ORDER BY e.exam_time ASC
    `;
    const result = await db.query(query);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// O'quvchi xona va o'rnini qidiruv API si (Ism yoki ID / code asosida)
exports.searchStudent = async (req, res) => {
  const { query } = req.query; // this represents search text

  if (!query || query.length < 3) {
    return res.status(400).json({ message: 'Search query must be at least 3 characters long' });
  }

  try {
    const dbQuery = `
      SELECT 
        s.full_name, s.student_code, 
        c.name as class_name,
        e.name as exam_name, e.exam_time, 
        r.room_number, r.building,
        a.seat_row, a.seat_number
      FROM assignments a
      JOIN students s ON a.student_id = s.id
      JOIN exams e ON a.exam_id = e.id
      JOIN classes c ON s.class_id = c.id
      JOIN rooms r ON a.room_id = r.id
      WHERE e.exam_date = CURRENT_DATE 
        AND e.status != 'scheduled'
        AND (s.full_name ILIKE $1 OR s.student_code ILIKE $2)
    `;
    const searchString = `%${query}%`;
    const result = await db.query(dbQuery, [searchString, searchString]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Imtihonga tegishli barcha xonalar va band / bo'sh o'rinlarni olish
exports.getExamRooms = async (req, res) => {
  const { examId } = req.params;
  try {
    const query = `
      SELECT r.room_number, r.capacity, r.building, 
             COUNT(a.id) as assigned_seats, 
             (r.capacity - COUNT(a.id)) as free_seats
      FROM assignments a
      JOIN rooms r ON a.room_id = r.id
      WHERE a.exam_id = $1
      GROUP BY r.room_number, r.capacity, r.building
    `;
    const result = await db.query(query, [examId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
