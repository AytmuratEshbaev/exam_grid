const db = require('../database/db');

// Get all classes
exports.getClasses = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM classes ORDER BY grade_level, name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a class
exports.createClass = async (req, res) => {
  const { name, grade_level } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO classes (name, grade_level, student_count) VALUES ($1, $2, 0) RETURNING *',
      [name, grade_level]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a class
exports.updateClass = async (req, res) => {
  const { id } = req.params;
  const { name, grade_level } = req.body;
  try {
    const result = await db.query(
      'UPDATE classes SET name = $1, grade_level = $2 WHERE id = $3 RETURNING *',
      [name, grade_level, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Class not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a class
exports.deleteClass = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM classes WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Class not found' });
    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
