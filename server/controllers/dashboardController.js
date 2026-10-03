const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');
const { getPatientByUserId, getDoctorByUserId } = require('../utils/profile');

exports.admin = asyncHandler(async (req, res) => {
  const [[patients]] = await pool.query('SELECT COUNT(*) AS total FROM patient');
  const [[doctors]] = await pool.query(
    `SELECT COUNT(*) AS total FROM doctor d
     JOIN users u ON u.user_id = d.user_id
     WHERE u.is_active = 1`
  );
  const [[today]] = await pool.query(
    "SELECT COUNT(*) AS total FROM appointment WHERE appointment_date = CURDATE()"
  );
  const [[admissions]] = await pool.query(
    "SELECT COUNT(*) AS total FROM admission WHERE status = 'Admitted'"
  );
  const [[pendingBills]] = await pool.query(
    "SELECT COUNT(*) AS total FROM bill WHERE status = 'Pending'"
  );
  const [chart] = await pool.query(
    `SELECT appointment_date AS date, COUNT(*) AS total
     FROM appointment
     WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY appointment_date
     ORDER BY appointment_date`
  );

  res.json({
    totalPatients: patients.total,
    totalDoctors: doctors.total,
    todayAppointments: today.total,
    currentAdmissions: admissions.total,
    pendingBills: pendingBills.total,
    appointmentsLast7Days: chart,
  });
});

exports.receptionist = asyncHandler(async (req, res) => {
  const [[today]] = await pool.query(
    "SELECT COUNT(*) AS total FROM appointment WHERE appointment_date = CURDATE() AND status = 'Scheduled'"
  );
  const [[admissions]] = await pool.query(
    "SELECT COUNT(*) AS total FROM admission WHERE status = 'Admitted'"
  );
  const [[pendingBills]] = await pool.query(
    "SELECT COUNT(*) AS total FROM bill WHERE status = 'Pending'"
  );
  const [[patients]] = await pool.query('SELECT COUNT(*) AS total FROM patient');
  res.json({
    todayAppointments: today.total,
    currentAdmissions: admissions.total,
    pendingBills: pendingBills.total,
    totalPatients: patients.total,
  });
});

exports.doctor = asyncHandler(async (req, res) => {
  const doctor = await getDoctorByUserId(req.user.user_id);
  const [[today]] = await pool.query(
    "SELECT COUNT(*) AS total FROM appointment WHERE doctor_id = ? AND appointment_date = CURDATE() AND status = 'Scheduled'",
    [doctor.doctor_id]
  );
  const [[pendingTests]] = await pool.query(
    "SELECT COUNT(*) AS total FROM medical_test WHERE doctor_id = ? AND status = 'Ordered'",
    [doctor.doctor_id]
  );
  const [[completed]] = await pool.query(
    "SELECT COUNT(*) AS total FROM appointment WHERE doctor_id = ? AND status = 'Completed'",
    [doctor.doctor_id]
  );
  const [[recentPatients]] = await pool.query(
    `SELECT COUNT(DISTINCT patient_id) AS total FROM appointment WHERE doctor_id = ?`,
    [doctor.doctor_id]
  );
  res.json({
    todayAppointments: today.total,
    pendingTests: pendingTests.total,
    completedConsultations: completed.total,
    recentPatients: recentPatients.total,
  });
});

exports.patient = asyncHandler(async (req, res) => {
  const patient = await getPatientByUserId(req.user.user_id);
  const [upcoming] = await pool.query(
    `SELECT a.*, d.name AS doctor_name, dep.department_name
     FROM appointment a
     JOIN doctor d ON d.doctor_id = a.doctor_id
     JOIN department dep ON dep.department_id = d.department_id
     WHERE a.patient_id = ? AND a.status = 'Scheduled' AND a.appointment_date >= CURDATE()
     ORDER BY a.appointment_date, a.appointment_time
     LIMIT 1`,
    [patient.patient_id]
  );
  const [lastVisit] = await pool.query(
    `SELECT a.*, d.name AS doctor_name
     FROM appointment a
     JOIN doctor d ON d.doctor_id = a.doctor_id
     WHERE a.patient_id = ? AND a.status = 'Completed'
     ORDER BY a.appointment_date DESC, a.appointment_time DESC
     LIMIT 1`,
    [patient.patient_id]
  );
  const [[pendingBills]] = await pool.query(
    "SELECT COUNT(*) AS total FROM bill WHERE patient_id = ? AND status = 'Pending'",
    [patient.patient_id]
  );
  const [prescriptions] = await pool.query(
    `SELECT pr.*, d.name AS doctor_name
     FROM prescription pr
     JOIN doctor d ON d.doctor_id = pr.doctor_id
     WHERE pr.patient_id = ?
     ORDER BY pr.prescription_date DESC
     LIMIT 5`,
    [patient.patient_id]
  );

  res.json({
    upcomingAppointment: upcoming[0] || null,
    lastVisit: lastVisit[0] || null,
    pendingBills: pendingBills.total,
    recentPrescriptions: prescriptions,
  });
});
