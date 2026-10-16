-- CareHub Database Migration: Mobile App Support & UPI Payment Verification
-- Idempotent schema upgrades for MySQL 8

USE hospital_management;

-- Create payment table for UPI QR payment submissions and staff verification
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
);

-- Backfill payment records for existing bills that do not yet have a payment row
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
WHERE p.payment_id IS NULL;
