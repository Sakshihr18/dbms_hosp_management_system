const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');
const { getPatientByUserId, getDoctorByUserId, doctorCanAccessPatient } = require('../utils/profile');

const patientSelect = `
  SELECT p.*, u.is_active
  FROM patient p
  JOIN users u ON u.user_id = p.user_id
`;

exports.list = asyncHandler(async (req, res) => {
  const q = (req.query.search || '').trim();

  if (req.user.role === 'doctor') {
    const doctor = await getDoctorByUserId(req.user.user_id);
    const [rows] = await pool.query(
      `${patientSelect}
       WHERE p.patient_id IN (
         SELECT patient_id FROM appointment WHERE doctor_id = ?
         UNION
         SELECT patient_id FROM admission WHERE doctor_id = ?
       )
       ORDER BY p.name`,
      [doctor.doctor_id, doctor.doctor_id]
    );
    return res.json(rows);
  }

  let sql = patientSelect + ' WHERE 1=1';
  const params = [];
  if (q) {
    sql += ' AND (p.name LIKE ? OR p.phone LIKE ? OR p.patient_id = ? OR p.email LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, q, `%${q}%`);
  }
  sql += ' ORDER BY p.name';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

exports.getOne = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(patientSelect + ' WHERE p.patient_id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Patient not found.' });

  const patient = rows[0];
  if (req.user.role === 'patient') {
    const own = await getPatientByUserId(req.user.user_id);
    if (!own || own.patient_id !== patient.patient_id) {
      return res.status(403).json({ message: 'Unauthorized access.' });
    }
  }
  if (req.user.role === 'doctor') {
    const doctor = await getDoctorByUserId(req.user.user_id);
    const allowed = await doctorCanAccessPatient(doctor.doctor_id, patient.patient_id);
    if (!allowed) return res.status(403).json({ message: 'Unauthorized access.' });
  }

  res.json(patient);
});

exports.create = asyncHandler(async (req, res) => {
  const { name, email, password, dob, gender, blood_group, phone, address, emergency_contact } = req.body;
  if (!name || !email || !password || !dob || !gender || !blood_group || !phone || !address || !emergency_contact) {
    return res.status(400).json({ message: 'Please fill all patient fields.' });
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
    const [rows] = await pool.query(patientSelect + ' WHERE p.patient_id = ?', [patientResult.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

exports.update = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM patient WHERE patient_id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ message: 'Patient not found.' });

  if (req.user.role === 'patient') {
    const own = await getPatientByUserId(req.user.user_id);
    if (!own || own.patient_id !== existing[0].patient_id) {
      return res.status(403).json({ message: 'Unauthorized access.' });
    }
  }

  const current = existing[0];
  const phone = req.body.phone || current.phone;
  const address = req.body.address || current.address;
  const emergency_contact = req.body.emergency_contact || current.emergency_contact;
  const name = req.user.role === 'receptionist' ? (req.body.name || current.name) : current.name;
  const dob = req.user.role === 'receptionist' ? (req.body.dob || current.dob) : current.dob;
  const gender = req.user.role === 'receptionist' ? (req.body.gender || current.gender) : current.gender;
  const blood_group = req.user.role === 'receptionist' ? (req.body.blood_group || current.blood_group) : current.blood_group;

  await pool.query(
    `UPDATE patient
     SET name = ?, dob = ?, gender = ?, blood_group = ?, phone = ?, address = ?, emergency_contact = ?
     WHERE patient_id = ?`,
    [name, dob, gender, blood_group, phone, address, emergency_contact, req.params.id]
  );
  await pool.query('UPDATE users SET name = ? WHERE user_id = ?', [name, current.user_id]);

  const [rows] = await pool.query(patientSelect + ' WHERE p.patient_id = ?', [req.params.id]);
  res.json(rows[0]);
});

exports.history = asyncHandler(async (req, res) => {
  const patientId = Number(req.params.id);
  const [patients] = await pool.query('SELECT * FROM patient WHERE patient_id = ?', [patientId]);
  if (!patients.length) return res.status(404).json({ message: 'Patient not found.' });

  if (req.user.role === 'patient') {
    const own = await getPatientByUserId(req.user.user_id);
    if (!own || own.patient_id !== patientId) {
      return res.status(403).json({ message: 'Unauthorized access.' });
    }
  }
  if (req.user.role === 'doctor') {
    const doctor = await getDoctorByUserId(req.user.user_id);
    const allowed = await doctorCanAccessPatient(doctor.doctor_id, patientId);
    if (!allowed) return res.status(403).json({ message: 'Unauthorized access.' });
  }

  const [appointments] = await pool.query(
    `SELECT a.*, d.name AS doctor_name, dep.department_name
     FROM appointment a
     JOIN doctor d ON d.doctor_id = a.doctor_id
     JOIN department dep ON dep.department_id = d.department_id
     WHERE a.patient_id = ?
     ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
    [patientId]
  );
  const [prescriptions] = await pool.query(
    `SELECT pr.*, d.name AS doctor_name
     FROM prescription pr
     JOIN doctor d ON d.doctor_id = pr.doctor_id
     WHERE pr.patient_id = ?
     ORDER BY pr.prescription_date DESC, pr.prescription_id DESC`,
    [patientId]
  );
  const [tests] = await pool.query(
    `SELECT t.*, d.name AS doctor_name
     FROM medical_test t
     JOIN doctor d ON d.doctor_id = t.doctor_id
     WHERE t.patient_id = ?
     ORDER BY t.test_date DESC, t.test_id DESC`,
    [patientId]
  );

  res.json({
    patient: patients[0],
    appointments,
    prescriptions,
    tests,
  });
});
