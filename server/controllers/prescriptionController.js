const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');
const { getPatientByUserId, getDoctorByUserId, doctorCanAccessPatient } = require('../utils/profile');

const prescriptionSelect = `
  SELECT pr.*, p.name AS patient_name, d.name AS doctor_name
  FROM prescription pr
  JOIN patient p ON p.patient_id = pr.patient_id
  JOIN doctor d ON d.doctor_id = pr.doctor_id
`;

exports.list = asyncHandler(async (req, res) => {
  let sql = prescriptionSelect + ' WHERE 1=1';
  const params = [];

  if (req.user.role === 'patient') {
    const patient = await getPatientByUserId(req.user.user_id);
    sql += ' AND pr.patient_id = ?';
    params.push(patient.patient_id);
  } else if (req.user.role === 'doctor') {
    const doctor = await getDoctorByUserId(req.user.user_id);
    sql += ' AND pr.doctor_id = ?';
    params.push(doctor.doctor_id);
  }

  if (req.query.patient_id) {
    sql += ' AND pr.patient_id = ?';
    params.push(req.query.patient_id);
  }

  sql += ' ORDER BY pr.prescription_date DESC, pr.prescription_id DESC';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

exports.create = asyncHandler(async (req, res) => {
  const doctor = await getDoctorByUserId(req.user.user_id);
  const { appointment_id, medicine_name, dosage, frequency, duration, instructions } = req.body;

  if (!appointment_id || !medicine_name || !dosage || !frequency || !duration || !instructions) {
    return res.status(400).json({ message: 'Please fill all prescription fields.' });
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
    `INSERT INTO prescription
     (patient_id, doctor_id, appointment_id, medicine_name, dosage, frequency, duration, instructions, prescription_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
    [appointment.patient_id, doctor.doctor_id, appointment_id, medicine_name, dosage, frequency, duration, instructions]
  );
  const [rows] = await pool.query(prescriptionSelect + ' WHERE pr.prescription_id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});
