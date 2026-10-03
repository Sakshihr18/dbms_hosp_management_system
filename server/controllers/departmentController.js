const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT department_id, department_name, description FROM department ORDER BY department_name'
  );
  res.json(rows);
});

exports.create = asyncHandler(async (req, res) => {
  const { department_name, description } = req.body;
  if (!department_name || !description) {
    return res.status(400).json({ message: 'Department name and description are required.' });
  }
  const [result] = await pool.query(
    'INSERT INTO department (department_name, description) VALUES (?, ?)',
    [department_name, description]
  );
  const [rows] = await pool.query('SELECT * FROM department WHERE department_id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

exports.update = asyncHandler(async (req, res) => {
  const { department_name, description } = req.body;
  const [existing] = await pool.query('SELECT * FROM department WHERE department_id = ?', [req.params.id]);
  if (!existing.length) {
    return res.status(404).json({ message: 'Department not found.' });
  }
  await pool.query(
    'UPDATE department SET department_name = ?, description = ? WHERE department_id = ?',
    [department_name || existing[0].department_name, description || existing[0].description, req.params.id]
  );
  const [rows] = await pool.query('SELECT * FROM department WHERE department_id = ?', [req.params.id]);
  res.json(rows[0]);
});
