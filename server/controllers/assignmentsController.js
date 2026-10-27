const db = require('../database/db');
const { generateAssignments } = require('../services/assignmentEngine');

// Generate or Regenerate assignments
exports.generateAssignments = async (req, res) => {
  const { examId } = req.params;
  
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get Exam info
    const examCheck = await client.query('SELECT * FROM exams WHERE id = $1', [examId]);
    if (examCheck.rows.length === 0) throw new Error('Exam not found');
    const exam = examCheck.rows[0];

    // 2. Get Students for exam classes
    const studentsRes = await client.query(`
      SELECT s.id, s.class_id 
      FROM students s
      JOIN exam_classes ec ON s.class_id = ec.class_id
      WHERE ec.exam_id = $1 AND s.is_active = true
    `, [examId]);
    const students = studentsRes.rows;
    if (students.length === 0) throw new Error("No active students found for this exam's classes");

    // 3. Get assigned Rooms
    const roomsRes = await client.query(`
      SELECT r.id, r.capacity 
      FROM rooms r
      JOIN exam_rooms er ON r.id = er.room_id
      WHERE er.exam_id = $1
    `, [examId]);
    const rooms = roomsRes.rows;
    if (rooms.length === 0) throw new Error("No rooms selected for this exam");

    // 4. Generate Assignments (this will throw if capacity is insufficient)
    const assignments = generateAssignments(students, rooms);

    // 5. Delete old assignments
    await client.query('DELETE FROM assignments WHERE exam_id = $1', [examId]);

    // 6. Insert new assignments
    if (assignments.length > 0) {
      let insertQuery = 'INSERT INTO assignments (exam_id, student_id, room_id, seat_row, seat_number) VALUES ';
      let values = [];
      let paramsIndex = 1;
      
      for (let a of assignments) {
        insertQuery += `($${paramsIndex++}, $${paramsIndex++}, $${paramsIndex++}, $${paramsIndex++}, $${paramsIndex++}),`;
        values.push(examId, a.student_id, a.room_id, a.seat_row, a.seat_number);
      }
      
      insertQuery = insertQuery.slice(0, -1);
      await client.query(insertQuery, values);
    }
    
    // 7. Update exam status
    await client.query('UPDATE exams SET status = $1 WHERE id = $2', ['active', examId]);

    await client.query('COMMIT');
    res.json({ message: "Assignment generated successfully!", total_assigned: assignments.length });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

// Get assignments for an exam (grouped by room)
exports.getAssignments = async (req, res) => {
  const { examId } = req.params;
  try {
    const result = await db.query(`
      SELECT a.id, a.seat_number, 
             s.full_name, s.student_code, s.student_password, s.student_id,
             c.name as class_name, c.grade_level,
             r.room_number, r.capacity, r.id as room_id
      FROM assignments a
      JOIN students s ON a.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      JOIN rooms r ON a.room_id = r.id
      WHERE a.exam_id = $1
      ORDER BY r.room_number, a.seat_number
    `, [examId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete all assignments for an exam (reset)
exports.resetAssignments = async (req, res) => {
  const { examId } = req.params;
  try {
    await db.query('DELETE FROM assignments WHERE exam_id = $1', [examId]);
    await db.query("UPDATE exams SET status = 'scheduled' WHERE id = $1", [examId]);
    res.json({ message: "Assignments reset successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
