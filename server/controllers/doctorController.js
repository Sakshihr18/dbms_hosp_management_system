const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

const doctorSelect = `
  SELECT d.doctor_id, d.user_id, d.department_id, d.name, d.specialization,
         d.phone, d.email, d.experience, dep.department_name, u.is_active
  FROM doctor d
  JOIN department dep ON dep.department_id = d.department_id
  JOIN users u ON u.user_id = d.user_id
`;

exports.list = asyncHandler(async (req, res) => {
  const { department_id } = req.query;
  let sql = doctorSelect + ' WHERE 1=1';
  const params = [];
  if (department_id) {
    sql += ' AND d.department_id = ?';
    params.push(department_id);
  }
  if (req.user.role !== 'admin') {
    sql += ' AND u.is_active = 1';
  }
  sql += ' ORDER BY d.name';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

exports.getOne = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(doctorSelect + ' WHERE d.doctor_id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Doctor not found.' });
  res.json(rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { name, email, password, department_id, specialization, phone, experience } = req.body;
  if (!name || !email || !password || !department_id || !specialization || !phone || experience === undefined) {
    return res.status(400).json({ message: 'Please fill all doctor fields.' });
  }

  const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
  if (existing.length) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [userResult] = await conn.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashed, 'doctor']
    );
    const [docResult] = await conn.query(
      `INSERT INTO doctor (user_id, department_id, name, specialization, phone, email, experience)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userResult.insertId, department_id, name, specialization, phone, email, Number(experience)]
    );
    await conn.commit();
    const [rows] = await pool.query(doctorSelect + ' WHERE d.doctor_id = ?', [docResult.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

exports.update = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM doctor WHERE doctor_id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ message: 'Doctor not found.' });

  const current = existing[0];
  const name = req.body.name || current.name;
  const department_id = req.body.department_id || current.department_id;
  const specialization = req.body.specialization || current.specialization;
  const phone = req.body.phone || current.phone;
  const experience = req.body.experience !== undefined ? Number(req.body.experience) : current.experience;

  await pool.query(
    `UPDATE doctor
     SET name = ?, department_id = ?, specialization = ?, phone = ?, experience = ?
     WHERE doctor_id = ?`,
    [name, department_id, specialization, phone, experience, req.params.id]
  );
  await pool.query('UPDATE users SET name = ? WHERE user_id = ?', [name, current.user_id]);

  const [rows] = await pool.query(doctorSelect + ' WHERE d.doctor_id = ?', [req.params.id]);
  res.json(rows[0]);
});

exports.deactivate = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM doctor WHERE doctor_id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ message: 'Doctor not found.' });
  await pool.query('UPDATE users SET is_active = 0 WHERE user_id = ?', [existing[0].user_id]);
  res.json({ message: 'Doctor account deactivated.' });
});
