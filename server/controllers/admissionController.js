const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');
const { getPatientByUserId, getDoctorByUserId } = require('../utils/profile');

const admissionSelect = `
  SELECT ad.*, p.name AS patient_name, d.name AS doctor_name, dep.department_name
  FROM admission ad
  JOIN patient p ON p.patient_id = ad.patient_id
  JOIN doctor d ON d.doctor_id = ad.doctor_id
  JOIN department dep ON dep.department_id = d.department_id
`;

exports.list = asyncHandler(async (req, res) => {
  const { status } = req.query;
  let sql = admissionSelect + ' WHERE 1=1';
  const params = [];

  if (req.user.role === 'patient') {
    const patient = await getPatientByUserId(req.user.user_id);
    sql += ' AND ad.patient_id = ?';
    params.push(patient.patient_id);
  } else if (req.user.role === 'doctor') {
    const doctor = await getDoctorByUserId(req.user.user_id);
    sql += ' AND ad.doctor_id = ?';
    params.push(doctor.doctor_id);
  }

  if (status) {
    sql += ' AND ad.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY ad.admission_date DESC, ad.admission_id DESC';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

exports.create = asyncHandler(async (req, res) => {
  const { patient_id, doctor_id, room_number, admission_date, reason } = req.body;
  if (!patient_id || !doctor_id || !room_number || !admission_date || !reason) {
    return res.status(400).json({ message: 'Please fill all admission fields.' });
  }

  const [open] = await pool.query(
    "SELECT admission_id FROM admission WHERE patient_id = ? AND status = 'Admitted'",
    [patient_id]
  );
  if (open.length) {
    return res.status(409).json({ message: 'This patient is already admitted.' });
  }

  const [result] = await pool.query(
    `INSERT INTO admission (patient_id, doctor_id, room_number, admission_date, reason, status)
     VALUES (?, ?, ?, ?, ?, 'Admitted')`,
    [patient_id, doctor_id, room_number, admission_date, reason]
  );
  const [rows] = await pool.query(admissionSelect + ' WHERE ad.admission_id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

exports.update = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM admission WHERE admission_id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ message: 'Admission not found.' });

  const current = existing[0];
  const status = req.body.status || current.status;
  const discharge_date = status === 'Discharged'
    ? (req.body.discharge_date || new Date().toISOString().slice(0, 10))
    : null;
  const room_number = req.body.room_number || current.room_number;
  const reason = req.body.reason || current.reason;

  await pool.query(
    `UPDATE admission
     SET room_number = ?, reason = ?, status = ?, discharge_date = ?
     WHERE admission_id = ?`,
    [room_number, reason, status, discharge_date, req.params.id]
  );
  const [rows] = await pool.query(admissionSelect + ' WHERE ad.admission_id = ?', [req.params.id]);
  res.json(rows[0]);
});
