const bcrypt = require('bcrypt');
const db = require('../database/db');

// Get all admins
exports.getAdmins = async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, full_name, role, created_at FROM admins ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create an admin
exports.createAdmin = async (req, res) => {
  const { username, password, full_name, role } = req.body;
  try {
    // Only superadmins can create admins (basic check)
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin can add new administrators' });
    }

    // Check if username already exists
    const checkResult = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await db.query(
      'INSERT INTO admins (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, username, full_name, role, created_at',
      [username, password_hash, full_name, role || 'admin']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete an admin
exports.deleteAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin can delete administrators' });
    }

    // Prevent deleting oneself
    if (parseInt(id) === parseInt(req.user.id)) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    const result = await db.query('DELETE FROM admins WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Admin not found' });
    
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
