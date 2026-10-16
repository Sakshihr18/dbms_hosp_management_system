const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');
const { getPatientByUserId, getDoctorByUserId } = require('../utils/profile');

const TIME_SLOTS = [
  '09:00:00', '09:30:00', '10:00:00', '10:30:00', '11:00:00', '11:30:00',
  '12:00:00', '14:00:00', '14:30:00', '15:00:00', '15:30:00', '16:00:00', '16:30:00',
];

const appointmentSelect = `
  SELECT a.*, p.name AS patient_name, p.phone AS patient_phone,
         d.name AS doctor_name, d.specialization AS doctor_specialization, d.consultation_fee,
         dep.department_name, dep.department_id,
         b.bill_id, b.amount AS bill_amount, b.status AS bill_status,
         pay.payment_id, pay.payment_status, pay.transaction_ref
  FROM appointment a
  JOIN patient p ON p.patient_id = a.patient_id
  JOIN doctor d ON d.doctor_id = a.doctor_id
  JOIN department dep ON dep.department_id = d.department_id
  LEFT JOIN bill b ON b.appointment_id = a.appointment_id
  LEFT JOIN payment pay ON pay.bill_id = b.bill_id
`;

async function slotTaken(doctorId, date, time, ignoreId) {
  let sql = `SELECT appointment_id FROM appointment
             WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
             AND status = 'Scheduled'`;
  const params = [doctorId, date, time];
  if (ignoreId) {
    sql += ' AND appointment_id <> ?';
    params.push(ignoreId);
  }
  const [rows] = await pool.query(sql, params);
  return rows.length > 0;
}

exports.slots = asyncHandler(async (req, res) => {
  const { doctor_id, date } = req.query;
  if (!doctor_id || !date) {
    return res.status(400).json({ message: 'Doctor and date are required.' });
  }
  const [booked] = await pool.query(
    `SELECT appointment_time FROM appointment
     WHERE doctor_id = ? AND appointment_date = ? AND status = 'Scheduled'`,
    [doctor_id, date]
  );
  const taken = new Set(booked.map((row) => String(row.appointment_time).slice(0, 8)));
  res.json(TIME_SLOTS.filter((slot) => !taken.has(slot)));
});

exports.list = asyncHandler(async (req, res) => {
  const { date, status, doctor_id } = req.query;
  let sql = appointmentSelect + ' WHERE 1=1';
  const params = [];

  if (req.user.role === 'patient') {
    const patient = await getPatientByUserId(req.user.user_id);
    sql += ' AND a.patient_id = ?';
    params.push(patient.patient_id);
  } else if (req.user.role === 'doctor') {
    const doctor = await getDoctorByUserId(req.user.user_id);
    sql += ' AND a.doctor_id = ?';
    params.push(doctor.doctor_id);
  }

  if (date) {
    sql += ' AND a.appointment_date = ?';
    params.push(date);
  }
  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }
  if (doctor_id && (req.user.role === 'admin' || req.user.role === 'receptionist')) {
    sql += ' AND a.doctor_id = ?';
    params.push(doctor_id);
  }

  sql += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

exports.create = asyncHandler(async (req, res) => {
  let { patient_id, doctor_id, appointment_date, appointment_time, reason } = req.body;

  if (req.user.role === 'patient') {
    const patient = await getPatientByUserId(req.user.user_id);
    patient_id = patient.patient_id;
  }

  if (!patient_id || !doctor_id || !appointment_date || !appointment_time || !reason) {
    return res.status(400).json({ message: 'Please fill all appointment fields.' });
  }

  const normalizedTime = appointment_time.length === 5 ? `${appointment_time}:00` : appointment_time;
  if (!TIME_SLOTS.includes(normalizedTime)) {
    return res.status(400).json({ message: 'Please select a valid appointment time.' });
  }

  const [doctorRows] = await pool.query(
    'SELECT doctor_id, name, specialization, consultation_fee FROM doctor WHERE doctor_id = ?',
    [doctor_id]
  );
  if (!doctorRows.length) {
    return res.status(404).json({ message: 'Selected doctor was not found.' });
  }
  const doctor = doctorRows[0];
  const fee = Number(doctor.consultation_fee) > 0 ? Number(doctor.consultation_fee) : 500.00;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check slot within transaction
    const [booked] = await conn.query(
      `SELECT appointment_id FROM appointment
       WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
       AND status = 'Scheduled' FOR UPDATE`,
      [doctor_id, appointment_date, normalizedTime]
    );

    if (booked.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: 'Appointment slot is already booked.' });
    }

    const [appResult] = await conn.query(
      `INSERT INTO appointment (patient_id, doctor_id, appointment_date, appointment_time, reason, status)
       VALUES (?, ?, ?, ?, ?, 'Scheduled')`,
      [patient_id, doctor_id, appointment_date, normalizedTime, reason]
    );
    const newAppointmentId = appResult.insertId;

    // Create corresponding bill with authoritative server-calculated doctor fee
    const billDesc = `Consultation fee - ${doctor.name} (${doctor.specialization || 'General'})`;
    const [billResult] = await conn.query(
      `INSERT INTO bill (patient_id, appointment_id, admission_id, amount, bill_date, description, status)
       VALUES (?, ?, NULL, ?, CURDATE(), ?, 'Pending')`,
      [patient_id, newAppointmentId, fee, billDesc]
    );
    const newBillId = billResult.insertId;

    // Create payment entry awaiting UPI QR payment
    const [payResult] = await conn.query(
      `INSERT INTO payment (bill_id, appointment_id, patient_id, payment_method, amount, payment_status)
       VALUES (?, ?, ?, 'UPI_QR', ?, 'Awaiting Payment')`,
      [newBillId, newAppointmentId, patient_id, fee]
    );
    const newPaymentId = payResult.insertId;

    await conn.commit();

    const [rows] = await pool.query(appointmentSelect + ' WHERE a.appointment_id = ?', [newAppointmentId]);
    const responsePayload = {
      ...(rows[0] || {}),
      bill_id: newBillId,
      bill_amount: fee,
      bill_status: 'Pending',
      payment_id: newPaymentId,
      payment_status: 'Awaiting Payment',
    };
    res.status(201).json(responsePayload);
  } catch (err) {
    await conn.rollback();
    err.message = err.message || 'Unable to create appointment.';
    throw err;
  } finally {
    conn.release();
  }
});

exports.update = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM appointment WHERE appointment_id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ message: 'Appointment not found.' });
  const current = existing[0];

  if (req.user.role === 'patient') {
    const patient = await getPatientByUserId(req.user.user_id);
    if (patient.patient_id !== current.patient_id) {
      return res.status(403).json({ message: 'Unauthorized access.' });
    }
    if (req.body.status !== 'Cancelled' || current.status !== 'Scheduled') {
      return res.status(400).json({ message: 'You can only cancel a scheduled appointment.' });
    }
    await pool.query("UPDATE appointment SET status = 'Cancelled' WHERE appointment_id = ?", [req.params.id]);
  } else if (req.user.role === 'doctor') {
    const doctor = await getDoctorByUserId(req.user.user_id);
    if (doctor.doctor_id !== current.doctor_id) {
      return res.status(403).json({ message: 'Unauthorized access.' });
    }
    const status = req.body.status || current.status;
    const diagnosis = req.body.diagnosis !== undefined ? req.body.diagnosis : current.diagnosis;
    await pool.query(
      'UPDATE appointment SET status = ?, diagnosis = ? WHERE appointment_id = ?',
      [status, diagnosis, req.params.id]
    );
  } else {
    const status = req.body.status || current.status;
    const appointment_date = req.body.appointment_date || current.appointment_date;
    const appointment_time = req.body.appointment_time
      ? (req.body.appointment_time.length === 5 ? `${req.body.appointment_time}:00` : req.body.appointment_time)
      : current.appointment_time;
    const doctor_id = req.body.doctor_id || current.doctor_id;
    const reason = req.body.reason || current.reason;

    if (status === 'Scheduled' && await slotTaken(doctor_id, appointment_date, appointment_time, current.appointment_id)) {
      return res.status(409).json({ message: 'Appointment slot is already booked.' });
    }

    await pool.query(
      `UPDATE appointment
       SET doctor_id = ?, appointment_date = ?, appointment_time = ?, reason = ?, status = ?
       WHERE appointment_id = ?`,
      [doctor_id, appointment_date, appointment_time, reason, status, req.params.id]
    );
  }

  const [rows] = await pool.query(appointmentSelect + ' WHERE a.appointment_id = ?', [req.params.id]);
  res.json(rows[0]);
});

exports.remove = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM appointment WHERE appointment_id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ message: 'Appointment not found.' });

  if (req.user.role === 'patient') {
    const patient = await getPatientByUserId(req.user.user_id);
    if (patient.patient_id !== existing[0].patient_id) {
      return res.status(403).json({ message: 'Unauthorized access.' });
    }
  }

  if (existing[0].status !== 'Scheduled') {
    return res.status(400).json({ message: 'Only scheduled appointments can be cancelled.' });
  }

  await pool.query("UPDATE appointment SET status = 'Cancelled' WHERE appointment_id = ?", [req.params.id]);
  res.json({ message: 'Appointment cancelled.' });
});
