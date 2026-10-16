const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');
const { getPatientByUserId } = require('../utils/profile');

const paymentSelect = `
  SELECT 
    pay.payment_id,
    pay.bill_id,
    pay.appointment_id,
    pay.patient_id,
    pay.payment_method,
    pay.transaction_ref,
    pay.amount,
    pay.currency,
    pay.payment_status,
    pay.submitted_at,
    pay.verified_at,
    pay.verified_by,
    pay.rejection_reason,
    pay.notes,
    pay.created_at,
    pay.updated_at,
    p.name AS patient_name,
    p.phone AS patient_phone,
    p.email AS patient_email,
    b.description AS bill_description,
    b.status AS bill_status,
    b.bill_date,
    a.appointment_date,
    a.appointment_time,
    a.reason AS appointment_reason,
    d.name AS doctor_name,
    d.specialization AS doctor_specialization,
    dep.department_name,
    u_ver.name AS verified_by_name
  FROM payment pay
  JOIN patient p ON p.patient_id = pay.patient_id
  JOIN bill b ON b.bill_id = pay.bill_id
  LEFT JOIN appointment a ON a.appointment_id = pay.appointment_id
  LEFT JOIN doctor d ON d.doctor_id = a.doctor_id
  LEFT JOIN department dep ON dep.department_id = d.department_id
  LEFT JOIN users u_ver ON u_ver.user_id = pay.verified_by
`;

// Patient submits UPI payment details (UTR/Reference) for an appointment or bill
exports.submitPayment = asyncHandler(async (req, res) => {
  const { bill_id, transaction_ref, notes } = req.body;
  if (!bill_id) {
    return res.status(400).json({ message: 'Bill ID is required.' });
  }

  // Patient ownership validation
  let patientId = null;
  if (req.user.role === 'patient') {
    const patient = await getPatientByUserId(req.user.user_id);
    patientId = patient.patient_id;
  }

  const [bills] = await pool.query('SELECT * FROM bill WHERE bill_id = ?', [bill_id]);
  if (!bills.length) {
    return res.status(404).json({ message: 'Bill not found.' });
  }
  const bill = bills[0];

  if (patientId && bill.patient_id !== patientId) {
    return res.status(403).json({ message: 'You do not have permission to pay for this bill.' });
  }

  if (bill.status === 'Paid') {
    return res.status(400).json({ message: 'This bill has already been verified and paid.' });
  }

  // Find or create payment record
  let [payments] = await pool.query('SELECT * FROM payment WHERE bill_id = ?', [bill_id]);
  let paymentRecord = payments[0];

  if (!paymentRecord) {
    const [ins] = await pool.query(
      `INSERT INTO payment (bill_id, appointment_id, patient_id, payment_method, amount, payment_status)
       VALUES (?, ?, ?, 'UPI_QR', ?, 'Awaiting Payment')`,
      [bill.bill_id, bill.appointment_id || null, bill.patient_id, bill.amount]
    );
    const [created] = await pool.query('SELECT * FROM payment WHERE payment_id = ?', [ins.insertId]);
    paymentRecord = created[0];
  }

  if (paymentRecord.payment_status === 'Paid') {
    return res.status(400).json({ message: 'Payment for this bill is already confirmed and marked as Paid.' });
  }

  // Update payment record to 'Pending Verification'
  const trimmedRef = transaction_ref ? String(transaction_ref).trim() : null;
  await pool.query(
    `UPDATE payment 
     SET payment_status = 'Pending Verification',
         transaction_ref = ?,
         submitted_at = NOW(),
         notes = ?,
         rejection_reason = NULL
     WHERE payment_id = ?`,
    [trimmedRef, notes || null, paymentRecord.payment_id]
  );

  const [updated] = await pool.query(paymentSelect + ' WHERE pay.payment_id = ?', [paymentRecord.payment_id]);
  res.json({
    message: 'Payment details submitted successfully. Hospital staff will verify with the bank record.',
    payment: updated[0],
  });
});

// Patient gets their own payments
exports.getMyPayments = asyncHandler(async (req, res) => {
  const patient = await getPatientByUserId(req.user.user_id);
  const [rows] = await pool.query(
    paymentSelect + ' WHERE pay.patient_id = ? ORDER BY pay.created_at DESC',
    [patient.patient_id]
  );
  res.json(rows);
});

// Get payment details by bill ID
exports.getPaymentByBill = asyncHandler(async (req, res) => {
  const { billId } = req.params;
  const [rows] = await pool.query(paymentSelect + ' WHERE pay.bill_id = ?', [billId]);
  if (!rows.length) {
    // If no payment row exists yet, check if bill exists and create default Awaiting Payment row
    const [bills] = await pool.query('SELECT * FROM bill WHERE bill_id = ?', [billId]);
    if (!bills.length) return res.status(404).json({ message: 'Bill not found.' });
    const b = bills[0];

    if (req.user.role === 'patient') {
      const patient = await getPatientByUserId(req.user.user_id);
      if (b.patient_id !== patient.patient_id) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    const [ins] = await pool.query(
      `INSERT INTO payment (bill_id, appointment_id, patient_id, payment_method, amount, payment_status)
       VALUES (?, ?, ?, 'UPI_QR', ?, ?)`,
      [b.bill_id, b.appointment_id || null, b.patient_id, b.amount, b.status === 'Paid' ? 'Paid' : 'Awaiting Payment']
    );
    const [newRow] = await pool.query(paymentSelect + ' WHERE pay.payment_id = ?', [ins.insertId]);
    return res.json(newRow[0]);
  }

  const payment = rows[0];
  if (req.user.role === 'patient') {
    const patient = await getPatientByUserId(req.user.user_id);
    if (payment.patient_id !== patient.patient_id) {
      return res.status(403).json({ message: 'Access denied.' });
    }
  }

  res.json(payment);
});

// Admin & Receptionist: List pending payment submissions
exports.getPendingSubmissions = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    paymentSelect + " WHERE pay.payment_status = 'Pending Verification' ORDER BY pay.submitted_at ASC, pay.created_at ASC"
  );
  res.json(rows);
});

// Admin & Receptionist: List all payments with filter
exports.getAllPayments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  let sql = paymentSelect + ' WHERE 1=1';
  const params = [];
  if (status) {
    sql += ' AND pay.payment_status = ?';
    params.push(status);
  }
  sql += ' ORDER BY pay.updated_at DESC, pay.created_at DESC';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

// Admin & Receptionist: Verify and confirm payment
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [existing] = await pool.query('SELECT * FROM payment WHERE payment_id = ?', [id]);
  if (!existing.length) {
    return res.status(404).json({ message: 'Payment record not found.' });
  }

  const current = existing[0];
  if (current.payment_status === 'Paid') {
    return res.status(400).json({ message: 'Payment is already confirmed and marked as Paid.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE payment
       SET payment_status = 'Paid',
           verified_at = NOW(),
           verified_by = ?,
           rejection_reason = NULL
       WHERE payment_id = ?`,
      [req.user.user_id, id]
    );

    await conn.query("UPDATE bill SET status = 'Paid' WHERE bill_id = ?", [current.bill_id]);

    await conn.commit();

    const [rows] = await pool.query(paymentSelect + ' WHERE pay.payment_id = ?', [id]);
    res.json({
      message: 'Payment successfully verified. Bill is marked as Paid.',
      payment: rows[0],
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// Admin & Receptionist: Reject payment submission with reason
exports.rejectPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !String(reason).trim()) {
    return res.status(400).json({ message: 'Rejection reason is required.' });
  }

  const [existing] = await pool.query('SELECT * FROM payment WHERE payment_id = ?', [id]);
  if (!existing.length) {
    return res.status(404).json({ message: 'Payment record not found.' });
  }

  const current = existing[0];
  if (current.payment_status === 'Paid') {
    return res.status(400).json({ message: 'Cannot reject an already confirmed and paid payment.' });
  }

  await pool.query(
    `UPDATE payment
     SET payment_status = 'Rejected',
         rejection_reason = ?,
         verified_at = NOW(),
         verified_by = ?
     WHERE payment_id = ?`,
    [String(reason).trim(), req.user.user_id, id]
  );

  const [rows] = await pool.query(paymentSelect + ' WHERE pay.payment_id = ?', [id]);
  res.json({
    message: 'Payment submission rejected. Patient can review and re-submit if needed.',
    payment: rows[0],
  });
});

// Verified Payment Receipt endpoint
exports.getReceipt = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const [rows] = await pool.query(paymentSelect + ' WHERE pay.payment_id = ?', [paymentId]);

  if (!rows.length) {
    return res.status(404).json({ message: 'Payment record not found.' });
  }

  const payment = rows[0];

  // Patient access isolation
  if (req.user.role === 'patient') {
    const patient = await getPatientByUserId(req.user.user_id);
    if (payment.patient_id !== patient.patient_id) {
      return res.status(403).json({ message: 'Access denied.' });
    }
  }

  if (payment.payment_status !== 'Paid') {
    return res.status(400).json({
      message: `Official receipt is only available after payment has been verified by hospital staff. Current status is '${payment.payment_status}'.`,
      payment_status: payment.payment_status,
    });
  }

  const receipt = {
    hospital_name: 'CareHub Hospital & Research Centre',
    hospital_address: '100 Healthcare Boulevard, Metro City',
    hospital_contact: '+91 98765 43210 | carehub.hospital@gmail.com',
    receipt_number: `CH-REC-${String(payment.payment_id).padStart(6, '0')}`,
    payment_id: payment.payment_id,
    bill_id: payment.bill_id,
    appointment_id: payment.appointment_id,
    patient: {
      patient_id: payment.patient_id,
      name: payment.patient_name,
      phone: payment.patient_phone,
      email: payment.patient_email,
    },
    doctor: payment.doctor_name
      ? {
          name: payment.doctor_name,
          specialization: payment.doctor_specialization,
          department: payment.department_name,
        }
      : null,
    appointment: payment.appointment_date
      ? {
          date: payment.appointment_date,
          time: payment.appointment_time,
          reason: payment.appointment_reason,
        }
      : null,
    financials: {
      amount: Number(payment.amount),
      currency: payment.currency,
      description: payment.bill_description,
      payment_method: payment.payment_method,
      bank_channel: 'Central Bank of India - 5027 Primary (UPI QR)',
      transaction_ref: payment.transaction_ref || 'VERIFIED-BY-ADMIN',
      payment_status: payment.payment_status,
    },
    audit: {
      submitted_at: payment.submitted_at,
      verified_at: payment.verified_at,
      verified_by: payment.verified_by_name || 'Hospital Administration',
    },
    issued_at: new Date().toISOString(),
  };

  res.json(receipt);
});
