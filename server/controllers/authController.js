const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');
const { signToken } = require('../middleware/auth');
const { getPatientByUserId, getDoctorByUserId } = require('../utils/profile');

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, dob, gender, blood_group, phone, address, emergency_contact } = req.body;

  if (!name || !email || !password || !dob || !gender || !blood_group || !phone || !address || !emergency_contact) {
    return res.status(400).json({ message: 'Please fill all required registration fields.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
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
      [name, email, hashed, 'patient']
    );
    const [patientResult] = await conn.query(
      `INSERT INTO patient (user_id, name, dob, gender, blood_group, phone, email, address, emergency_contact)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userResult.insertId, name, dob, gender, blood_group, phone, email, address, emergency_contact]
    );
    await conn.commit();

    const user = { user_id: userResult.insertId, name, email, role: 'patient' };
    res.status(201).json({
      message: 'Registration successful.',
      token: signToken(user),
      user,
      profile: { patient_id: patientResult.insertId },
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (!rows.length) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const user = rows[0];
  if (!user.is_active) {
    return res.status(401).json({ message: 'This account has been deactivated.' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  let profile = null;
  if (user.role === 'patient') profile = await getPatientByUserId(user.user_id);
  if (user.role === 'doctor') profile = await getDoctorByUserId(user.user_id);

  res.json({
    token: signToken(user),
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    profile,
  });
});

exports.me = asyncHandler(async (req, res) => {
  let profile = null;
  if (req.user.role === 'patient') profile = await getPatientByUserId(req.user.user_id);
  if (req.user.role === 'doctor') profile = await getDoctorByUserId(req.user.user_id);
  res.json({ user: req.user, profile });
});
