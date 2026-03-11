const db = require('../database/db');

// Get all rooms
exports.getRooms = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM rooms ORDER BY room_number');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a room
exports.createRoom = async (req, res) => {
  const { room_number, capacity } = req.body;
  
  // Set default values for assignment engine compatibility
  const rows_count = 1;
  const seats_per_row = capacity;
  const building = '';

  try {
    const result = await db.query(
      'INSERT INTO rooms (room_number, capacity, rows_count, seats_per_row, building) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [room_number, capacity, rows_count, seats_per_row, building]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a room
exports.updateRoom = async (req, res) => {
  const { id } = req.params;
  const { room_number, capacity } = req.body;
  
  // Set default values for assignment engine compatibility
  const rows_count = 1;
  const seats_per_row = capacity;
  const building = '';

  try {
    const result = await db.query(
      'UPDATE rooms SET room_number = $1, capacity = $2, rows_count = $3, seats_per_row = $4, building = $5 WHERE id = $6 RETURNING *',
      [room_number, capacity, rows_count, seats_per_row, building, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Room not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a room
exports.deleteRoom = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
