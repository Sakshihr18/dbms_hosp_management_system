const pool = require('../config/db');

async function getPatientByUserId(userId) {
  const [rows] = await pool.query('SELECT * FROM patient WHERE user_id = ?', [userId]);
  return rows[0] || null;
}

async function getDoctorByUserId(userId) {
  const [rows] = await pool.query('SELECT * FROM doctor WHERE user_id = ?', [userId]);
  return rows[0] || null;
}

async function doctorCanAccessPatient(doctorId, patientId) {
  const [rows] = await pool.query(
    `SELECT 1 FROM appointment
     WHERE doctor_id = ? AND patient_id = ?
     UNION
     SELECT 1 FROM admission
     WHERE doctor_id = ? AND patient_id = ?
     LIMIT 1`,
    [doctorId, patientId, doctorId, patientId]
  );
  return rows.length > 0;
}

module.exports = { getPatientByUserId, getDoctorByUserId, doctorCanAccessPatient };
