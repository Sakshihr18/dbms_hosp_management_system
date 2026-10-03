const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');
const { getPatientByUserId } = require('../utils/profile');

const billSelect = `
  SELECT b.*, p.name AS patient_name
  FROM bill b
  JOIN patient p ON p.patient_id = b.patient_id
`;

exports.list = asyncHandler(async (req, res) => {
  const { status } = req.query;
  let sql = billSelect + ' WHERE 1=1';
  const params = [];

  if (req.user.role === 'patient') {
    const patient = await getPatientByUserId(req.user.user_id);
    sql += ' AND b.patient_id = ?';
    params.push(patient.patient_id);
  }

  if (status) {
    sql += ' AND b.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY b.bill_date DESC, b.bill_id DESC';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

exports.create = asyncHandler(async (req, res) => {
  const { patient_id, appointment_id, admission_id, amount, description } = req.body;
  if (!patient_id || !amount || !description) {
    return res.status(400).json({ message: 'Patient, amount and description are required.' });
  }
  if (!appointment_id && !admission_id) {
    return res.status(400).json({ message: 'Select an appointment or an admission for this bill.' });
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ message: 'Bill amount must be greater than 0.' });
  }

  const [result] = await pool.query(
    `INSERT INTO bill (patient_id, appointment_id, admission_id, amount, bill_date, description, status)
     VALUES (?, ?, ?, ?, CURDATE(), ?, 'Pending')`,
    [patient_id, appointment_id || null, admission_id || null, amount, description]
  );
  const [rows] = await pool.query(billSelect + ' WHERE b.bill_id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

exports.update = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM bill WHERE bill_id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ message: 'Bill not found.' });

  const status = req.body.status || existing[0].status;
  const amount = req.body.amount !== undefined ? req.body.amount : existing[0].amount;
  const description = req.body.description || existing[0].description;

  await pool.query(
    'UPDATE bill SET status = ?, amount = ?, description = ? WHERE bill_id = ?',
    [status, amount, description, req.params.id]
  );
  const [rows] = await pool.query(billSelect + ' WHERE b.bill_id = ?', [req.params.id]);
  res.json(rows[0]);
});
