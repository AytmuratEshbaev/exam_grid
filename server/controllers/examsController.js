const db = require('../database/db');
const { generateAssignments } = require('../services/assignmentEngine');

// Get all exams
exports.getExams = async (req, res) => {
  try {
    let whereClause = "";
    if (req.user && req.user.role === 'invigilator') {
      whereClause = `
        WHERE (e.exam_date + e.exam_time) >= ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tashkent') - INTERVAL '7 days')
          AND (e.exam_date + e.exam_time) <= ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tashkent') + INTERVAL '7 days')
      `;
    }

    const result = await db.query(`
      SELECT e.*, 
        string_agg(DISTINCT (c.grade_level || '-' || c.name), ', ') as class_names,
        array_agg(DISTINCT c.id) filter (where c.id is not null) as class_ids,
        string_agg(DISTINCT r.room_number, ', ') as room_names,
        array_agg(DISTINCT r.id) filter (where r.id is not null) as room_ids
      FROM exams e 
      LEFT JOIN exam_classes ec ON e.id = ec.exam_id
      LEFT JOIN classes c ON ec.class_id = c.id 
      LEFT JOIN exam_rooms er ON e.id = er.exam_id
      LEFT JOIN rooms r ON er.room_id = r.id
      ${whereClause}
      GROUP BY e.id
      ORDER BY e.exam_date DESC, e.exam_time DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create an exam
exports.createExam = async (req, res) => {
  const { name, exam_date, exam_time, class_ids, room_ids, quarter, status } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'INSERT INTO exams (name, exam_date, exam_time, quarter, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, exam_date, exam_time, quarter, status || 'scheduled']
    );
    const exam = result.rows[0];

    if (class_ids && Array.isArray(class_ids)) {
      for (let cid of class_ids) {
        await client.query('INSERT INTO exam_classes (exam_id, class_id) VALUES ($1, $2)', [exam.id, cid]);
      }
    }

    if (room_ids && Array.isArray(room_ids)) {
      for (let rid of room_ids) {
         await client.query('INSERT INTO exam_rooms (exam_id, room_id) VALUES ($1, $2)', [exam.id, rid]);
      }
    }

    // Auto-assign students to rooms
    const studentsRes = await client.query(`
      SELECT s.id, s.class_id FROM students s
      JOIN exam_classes ec ON s.class_id = ec.class_id
      WHERE ec.exam_id = $1 AND s.is_active = true
    `, [exam.id]);
    const roomsRes = await client.query(`
      SELECT r.id, r.capacity FROM rooms r
      JOIN exam_rooms er ON r.id = er.room_id
      WHERE er.exam_id = $1
    `, [exam.id]);

    if (studentsRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "No active students found in the selected classes. Cannot create exam." });
    }
    if (roomsRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "No rooms selected. Cannot create exam." });
    }

    // This will throw if capacity insufficient
    const assignments = generateAssignments(studentsRes.rows, roomsRes.rows);

    if (assignments.length > 0) {
      let insertQuery = 'INSERT INTO assignments (exam_id, student_id, room_id, seat_row, seat_number) VALUES ';
      let values = [];
      let idx = 1;
      for (let a of assignments) {
        insertQuery += `($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}),`;
        values.push(exam.id, a.student_id, a.room_id, a.seat_row, a.seat_number);
      }
      insertQuery = insertQuery.slice(0, -1);
      await client.query(insertQuery, values);
      await client.query("UPDATE exams SET status = 'active' WHERE id = $1", [exam.id]);
    }

    await client.query('COMMIT');
    res.status(201).json({ ...exam, assignment: { total_assigned: assignments.length } });
  } catch (err) {
    await client.query('ROLLBACK');
    // Show the capacity error message directly
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

// Update an exam
exports.updateExam = async (req, res) => {
  const { id } = req.params;
  const { name, exam_date, exam_time, class_ids, room_ids, quarter, status } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'UPDATE exams SET name=$1, exam_date=$2, exam_time=$3, quarter=$4, status=$5 WHERE id=$6 RETURNING *',
      [name, exam_date, exam_time, quarter, status, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Update classes
    if (class_ids && Array.isArray(class_ids)) {
      await client.query('DELETE FROM exam_classes WHERE exam_id = $1', [id]);
      for (let cid of class_ids) {
        await client.query('INSERT INTO exam_classes (exam_id, class_id) VALUES ($1, $2)', [id, cid]);
      }
    }

    // Update rooms
    if (room_ids && Array.isArray(room_ids)) {
      await client.query('DELETE FROM exam_rooms WHERE exam_id = $1', [id]);
      for (let rid of room_ids) {
        await client.query('INSERT INTO exam_rooms (exam_id, room_id) VALUES ($1, $2)', [id, rid]);
      }
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// Delete an exam
exports.deleteExam = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM exams WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Exam not found' });
    res.json({ message: 'Exam deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
