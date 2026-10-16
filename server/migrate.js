require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
  console.log('--- Starting CareHub Migration ---');

  // 1. Add consultation_fee to doctor if missing
  const [cols] = await pool.query(`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'doctor' 
      AND COLUMN_NAME = 'consultation_fee'
  `);

  if (cols.length === 0) {
    console.log('Adding consultation_fee column to doctor table...');
    await pool.query(`
      ALTER TABLE doctor 
      ADD COLUMN consultation_fee DECIMAL(10, 2) NOT NULL DEFAULT 500.00 AFTER experience
    `);
    console.log('consultation_fee added.');
  } else {
    console.log('consultation_fee column already exists.');
  }

  // Update existing doctors with realistic consultation fees
  await pool.query(`UPDATE doctor SET consultation_fee = 800.00 WHERE email = 'doctor@hospital.com'`);
  await pool.query(`UPDATE doctor SET consultation_fee = 750.00 WHERE email = 'priya.nair@hospital.com'`);
  await pool.query(`UPDATE doctor SET consultation_fee = 700.00 WHERE email = 'rohan.sharma@hospital.com'`);
  await pool.query(`UPDATE doctor SET consultation_fee = 500.00 WHERE email = 'ananya.iyer@hospital.com'`);
  await pool.query(`UPDATE doctor SET consultation_fee = 600.00 WHERE email = 'vikram.reddy@hospital.com'`);
  console.log('Updated doctor consultation fees.');

  // 2. Create payment table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment (
      payment_id INT PRIMARY KEY AUTO_INCREMENT,
      bill_id INT NOT NULL,
      appointment_id INT NULL,
      patient_id INT NOT NULL,
      payment_method VARCHAR(50) NOT NULL DEFAULT 'UPI_QR',
      transaction_ref VARCHAR(100) NULL,
      amount DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      payment_status ENUM('Awaiting Payment', 'Pending Verification', 'Paid', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Awaiting Payment',
      submitted_at DATETIME NULL,
      verified_at DATETIME NULL,
      verified_by INT NULL,
      rejection_reason VARCHAR(255) NULL,
      notes TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_payment_bill
        FOREIGN KEY (bill_id) REFERENCES bill(bill_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
      CONSTRAINT fk_payment_appointment
        FOREIGN KEY (appointment_id) REFERENCES appointment(appointment_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
      CONSTRAINT fk_payment_patient
        FOREIGN KEY (patient_id) REFERENCES patient(patient_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
      CONSTRAINT fk_payment_verifier
        FOREIGN KEY (verified_by) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
      CONSTRAINT chk_payment_amount CHECK (amount > 0)
    )
  `);
  console.log('Table `payment` verified/created.');

  // Helper to add index safely
  async function safeAddIndex(table, indexName, createSql) {
    try {
      const [idx] = await pool.query(
        `SELECT INDEX_NAME FROM information_schema.STATISTICS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
        [table, indexName]
      );
      if (idx.length === 0) {
        await pool.query(createSql);
        console.log(`Index ${indexName} created on ${table}.`);
      }
    } catch (e) {
      console.log(`Index ${indexName} notice:`, e.message);
    }
  }

  await safeAddIndex('payment', 'idx_payment_status', 'CREATE INDEX idx_payment_status ON payment (payment_status)');
  await safeAddIndex('payment', 'idx_payment_patient', 'CREATE INDEX idx_payment_patient ON payment (patient_id)');
  await safeAddIndex('payment', 'idx_payment_bill', 'CREATE INDEX idx_payment_bill ON payment (bill_id)');
  await safeAddIndex('payment', 'idx_payment_appointment', 'CREATE INDEX idx_payment_appointment ON payment (appointment_id)');
  await safeAddIndex('payment', 'idx_payment_trans_ref', 'CREATE INDEX idx_payment_trans_ref ON payment (transaction_ref)');

  // 3. Backfill payment records for existing bills
  const [backfill] = await pool.query(`
    INSERT INTO payment (bill_id, appointment_id, patient_id, payment_method, amount, payment_status, submitted_at, verified_at, verified_by, notes)
    SELECT 
      b.bill_id,
      b.appointment_id,
      b.patient_id,
      'UPI_QR',
      b.amount,
      CASE WHEN b.status = 'Paid' THEN 'Paid' ELSE 'Awaiting Payment' END,
      CASE WHEN b.status = 'Paid' THEN NOW() ELSE NULL END,
      CASE WHEN b.status = 'Paid' THEN NOW() ELSE NULL END,
      CASE WHEN b.status = 'Paid' THEN 1 ELSE NULL END,
      'Auto-backfilled from existing bill'
    FROM bill b
    LEFT JOIN payment p ON p.bill_id = b.bill_id
    WHERE p.payment_id IS NULL
  `);
  console.log(`Backfilled ${backfill.affectedRows || 0} payment records.`);

  console.log('--- Migration Completed Successfully ---');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
