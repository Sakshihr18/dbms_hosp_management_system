const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT user_id, name, email, role, is_active, created_at
     FROM users
     ORDER BY created_at DESC`
  );
  res.json(rows);
});

exports.createReceptionist = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }

  const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
  if (existing.length) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, hashed, 'receptionist']
  );
  const [rows] = await pool.query(
    'SELECT user_id, name, email, role, is_active, created_at FROM users WHERE user_id = ?',
    [result.insertId]
  );
  res.status(201).json(rows[0]);
});
