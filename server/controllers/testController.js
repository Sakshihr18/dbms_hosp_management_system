const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');
const { getPatientByUserId, getDoctorByUserId } = require('../utils/profile');

const testSelect = `
  SELECT t.*, p.name AS patient_name, d.name AS doctor_name
  FROM medical_test t
  JOIN patient p ON p.patient_id = t.patient_id
  JOIN doctor d ON d.doctor_id = t.doctor_id
`;

exports.list = asyncHandler(async (req, res) => {
  let sql = testSelect + ' WHERE 1=1';
  const params = [];

  if (req.user.role === 'patient') {
    const patient = await getPatientByUserId(req.user.user_id);
    sql += ' AND t.patient_id = ?';
    params.push(patient.patient_id);
  } else if (req.user.role === 'doctor') {
    const doctor = await getDoctorByUserId(req.user.user_id);
    sql += ' AND t.doctor_id = ?';
    params.push(doctor.doctor_id);
  }

  if (req.query.status) {
    sql += ' AND t.status = ?';
    params.push(req.query.status);
  }
  if (req.query.patient_id) {
    sql += ' AND t.patient_id = ?';
    params.push(req.query.patient_id);
  }

  sql += ' ORDER BY t.test_date DESC, t.test_id DESC';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

exports.create = asyncHandler(async (req, res) => {
  const doctor = await getDoctorByUserId(req.user.user_id);
  const { appointment_id, test_name, test_type } = req.body;
  if (!appointment_id || !test_name || !test_type) {
    return res.status(400).json({ message: 'Please fill all test fields.' });
  }

  const [appointments] = await pool.query(
    'SELECT * FROM appointment WHERE appointment_id = ? AND doctor_id = ?',
    [appointment_id, doctor.doctor_id]
  );
  if (!appointments.length) {
    return res.status(404).json({ message: 'Appointment not found for this doctor.' });
  }

  const appointment = appointments[0];
  const [result] = await pool.query(
    `INSERT INTO medical_test
     (patient_id, doctor_id, appointment_id, test_name, test_type, test_date, status)
     VALUES (?, ?, ?, ?, ?, CURDATE(), 'Ordered')`,
    [appointment.patient_id, doctor.doctor_id, appointment_id, test_name, test_type]
  );
  const [rows] = await pool.query(testSelect + ' WHERE t.test_id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

exports.update = asyncHandler(async (req, res) => {
  const doctor = await getDoctorByUserId(req.user.user_id);
  const [existing] = await pool.query(
    'SELECT * FROM medical_test WHERE test_id = ? AND doctor_id = ?',
    [req.params.id, doctor.doctor_id]
  );
  if (!existing.length) return res.status(404).json({ message: 'Medical test not found.' });

  const result = req.body.result !== undefined ? req.body.result : existing[0].result;
  const status = req.body.status || existing[0].status;
  await pool.query(
    'UPDATE medical_test SET result = ?, status = ? WHERE test_id = ?',
    [result, status, req.params.id]
  );
  const [rows] = await pool.query(testSelect + ' WHERE t.test_id = ?', [req.params.id]);
  res.json(rows[0]);
});
