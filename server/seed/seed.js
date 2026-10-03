require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function run() {
  const password = process.env.DB_PASSWORD;
  if (password === undefined) {
    throw new Error('DB_PASSWORD is missing. Copy server/.env.example to server/.env and set your MySQL root password.');
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password,
    multipleStatements: true,
  });

  const schema = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
  await connection.query(schema);

  const hash = await bcrypt.hash('Hospital@123', 10);

  await connection.query(
    `INSERT INTO users (name, email, password, role) VALUES
     ('Rahul Verma', 'admin@hospital.com', ?, 'admin'),
     ('Meera Joshi', 'reception@hospital.com', ?, 'receptionist'),
     ('Kavita Desai', 'reception2@hospital.com', ?, 'receptionist'),
     ('Dr. Arjun Mehta', 'doctor@hospital.com', ?, 'doctor'),
     ('Dr. Priya Nair', 'priya.nair@hospital.com', ?, 'doctor'),
     ('Dr. Rohan Sharma', 'rohan.sharma@hospital.com', ?, 'doctor'),
     ('Dr. Ananya Iyer', 'ananya.iyer@hospital.com', ?, 'doctor'),
     ('Dr. Vikram Reddy', 'vikram.reddy@hospital.com', ?, 'doctor'),
     ('Aisha Khan', 'patient@hospital.com', ?, 'patient'),
     ('Sanjay Patel', 'sanjay.patel@hospital.com', ?, 'patient'),
     ('Neha Gupta', 'neha.gupta@hospital.com', ?, 'patient'),
     ('Amit Kulkarni', 'amit.kulkarni@hospital.com', ?, 'patient'),
     ('Pooja Singh', 'pooja.singh@hospital.com', ?, 'patient'),
     ('Rahul Menon', 'rahul.menon@hospital.com', ?, 'patient'),
     ('Sneha Rao', 'sneha.rao@hospital.com', ?, 'patient'),
     ('Vivek Choudhary', 'vivek.choudhary@hospital.com', ?, 'patient'),
     ('Anjali Das', 'anjali.das@hospital.com', ?, 'patient'),
     ('Manish Agarwal', 'manish.agarwal@hospital.com', ?, 'patient'),
     ('Divya Krishnan', 'divya.krishnan@hospital.com', ?, 'patient'),
     ('Farhan Ali', 'farhan.ali@hospital.com', ?, 'patient')`,
    Array(20).fill(hash)
  );

  await connection.query(`
    INSERT INTO department (department_name, description) VALUES
    ('Cardiology', 'Heart and cardiovascular care'),
    ('Neurology', 'Brain and nervous system care'),
    ('Orthopedics', 'Bone, joint and muscle care'),
    ('General Medicine', 'General medical consultation'),
    ('Pediatrics', 'Child and adolescent care')
  `);

  await connection.query(`
    INSERT INTO doctor (user_id, department_id, name, specialization, phone, email, experience) VALUES
    (4, 1, 'Dr. Arjun Mehta', 'Interventional Cardiology', '9876500001', 'doctor@hospital.com', 12),
    (5, 2, 'Dr. Priya Nair', 'Neurology', '9876500002', 'priya.nair@hospital.com', 9),
    (6, 3, 'Dr. Rohan Sharma', 'Orthopedic Surgery', '9876500003', 'rohan.sharma@hospital.com', 11),
    (7, 4, 'Dr. Ananya Iyer', 'Internal Medicine', '9876500004', 'ananya.iyer@hospital.com', 8),
    (8, 5, 'Dr. Vikram Reddy', 'Pediatrics', '9876500005', 'vikram.reddy@hospital.com', 10)
  `);

  await connection.query(`
    INSERT INTO patient (user_id, name, dob, gender, blood_group, phone, email, address, emergency_contact) VALUES
    (9, 'Aisha Khan', '1996-04-12', 'Female', 'B+', '9000000001', 'patient@hospital.com', '12 MG Road, Pune', 'Imran Khan - 9000000101'),
    (10, 'Sanjay Patel', '1988-11-03', 'Male', 'O+', '9000000002', 'sanjay.patel@hospital.com', '45 CG Road, Ahmedabad', 'Rina Patel - 9000000102'),
    (11, 'Neha Gupta', '1994-07-21', 'Female', 'A+', '9000000003', 'neha.gupta@hospital.com', '88 Park Street, Kolkata', 'Amit Gupta - 9000000103'),
    (12, 'Amit Kulkarni', '1985-02-18', 'Male', 'AB+', '9000000004', 'amit.kulkarni@hospital.com', '21 FC Road, Pune', 'Smita Kulkarni - 9000000104'),
    (13, 'Pooja Singh', '1999-09-09', 'Female', 'O-', '9000000005', 'pooja.singh@hospital.com', '7 Gomti Nagar, Lucknow', 'Raj Singh - 9000000105'),
    (14, 'Rahul Menon', '1991-01-30', 'Male', 'B-', '9000000006', 'rahul.menon@hospital.com', '33 Marine Drive, Kochi', 'Leela Menon - 9000000106'),
    (15, 'Sneha Rao', '2000-05-14', 'Female', 'A-', '9000000007', 'sneha.rao@hospital.com', '19 Banjara Hills, Hyderabad', 'Kiran Rao - 9000000107'),
    (16, 'Vivek Choudhary', '1979-08-08', 'Male', 'O+', '9000000008', 'vivek.choudhary@hospital.com', '56 C Scheme, Jaipur', 'Nisha Choudhary - 9000000108'),
    (17, 'Anjali Das', '1993-12-25', 'Female', 'B+', '9000000009', 'anjali.das@hospital.com', '4 Salt Lake, Kolkata', 'Rohan Das - 9000000109'),
    (18, 'Manish Agarwal', '1982-06-02', 'Male', 'A+', '9000000010', 'manish.agarwal@hospital.com', '90 Civil Lines, Kanpur', 'Priya Agarwal - 9000000110'),
    (19, 'Divya Krishnan', '1997-03-17', 'Female', 'O+', '9000000011', 'divya.krishnan@hospital.com', '15 Anna Nagar, Chennai', 'Suresh Krishnan - 9000000111'),
    (20, 'Farhan Ali', '1990-10-11', 'Male', 'AB-', '9000000012', 'farhan.ali@hospital.com', '28 Hazratganj, Lucknow', 'Sara Ali - 9000000112')
  `);

  await connection.query(`
    INSERT INTO appointment (patient_id, doctor_id, appointment_date, appointment_time, reason, diagnosis, status) VALUES
    (1, 1, CURDATE(), '09:00:00', 'Chest discomfort', NULL, 'Scheduled'),
    (2, 4, CURDATE(), '10:00:00', 'Fever and body ache', NULL, 'Scheduled'),
    (3, 2, CURDATE(), '11:00:00', 'Migraine follow-up', NULL, 'Scheduled'),
    (1, 1, DATE_SUB(CURDATE(), INTERVAL 7 DAY), '09:30:00', 'Routine cardiac checkup', 'Mild hypertension', 'Completed'),
    (4, 3, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '14:00:00', 'Knee pain', 'Osteoarthritis - conservative care', 'Completed'),
    (5, 5, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '10:30:00', 'Child vaccination review', 'Vaccination schedule updated', 'Completed'),
    (6, 2, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '15:00:00', 'Numbness in left arm', 'Nerve compression suspected', 'Completed'),
    (7, 4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', 'General checkup', NULL, 'Scheduled'),
    (8, 1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:30:00', 'Blood pressure review', NULL, 'Scheduled'),
    (9, 3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '16:00:00', 'Shoulder stiffness', NULL, 'Cancelled'),
    (10, 4, DATE_SUB(CURDATE(), INTERVAL 10 DAY), '12:00:00', 'Stomach pain', 'Gastritis', 'Completed'),
    (11, 5, CURDATE(), '14:30:00', 'Seasonal cough', NULL, 'Scheduled')
  `);

  await connection.query(`
    INSERT INTO admission (patient_id, doctor_id, room_number, admission_date, discharge_date, reason, status) VALUES
    (2, 4, 'A-101', DATE_SUB(CURDATE(), INTERVAL 1 DAY), NULL, 'High fever observation', 'Admitted'),
    (4, 3, 'B-204', DATE_SUB(CURDATE(), INTERVAL 8 DAY), DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Knee procedure recovery', 'Discharged'),
    (8, 1, 'C-310', DATE_SUB(CURDATE(), INTERVAL 2 DAY), NULL, 'Cardiac monitoring', 'Admitted')
  `);

  await connection.query(`
    INSERT INTO prescription (patient_id, doctor_id, appointment_id, medicine_name, dosage, frequency, duration, instructions, prescription_date) VALUES
    (1, 1, 4, 'Amlodipine', '5 mg', 'Once daily', '30 days', 'Take after breakfast. Monitor BP.', DATE_SUB(CURDATE(), INTERVAL 7 DAY)),
    (4, 3, 5, 'Aceclofenac', '100 mg', 'Twice daily', '5 days', 'Take after meals.', DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
    (6, 2, 7, 'Gabapentin', '300 mg', 'Once at night', '14 days', 'Avoid driving if drowsy.', DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
    (10, 4, 11, 'Pantoprazole', '40 mg', 'Once daily', '14 days', 'Take 30 minutes before breakfast.', DATE_SUB(CURDATE(), INTERVAL 10 DAY))
  `);

  await connection.query(`
    INSERT INTO medical_test (patient_id, doctor_id, appointment_id, test_name, test_type, result, test_date, status) VALUES
    (1, 1, 4, 'ECG', 'Cardiac', 'Normal sinus rhythm', DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'Completed'),
    (1, 1, 4, 'Lipid Profile', 'Blood', 'LDL slightly elevated', DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'Completed'),
    (6, 2, 7, 'MRI Cervical Spine', 'Imaging', NULL, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Ordered'),
    (10, 4, 11, 'Complete Blood Count', 'Blood', 'Within normal limits', DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'Completed')
  `);

  await connection.query(`
    INSERT INTO bill (patient_id, appointment_id, admission_id, amount, bill_date, description, status) VALUES
    (1, 4, NULL, 1200.00, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'Cardiology consultation and ECG', 'Paid'),
    (2, NULL, 1, 8500.00, CURDATE(), 'Admission charges - Room A-101', 'Pending'),
    (4, 5, NULL, 1800.00, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Orthopedic consultation', 'Paid'),
    (8, NULL, 3, 15000.00, CURDATE(), 'Cardiac monitoring admission', 'Pending'),
    (10, 11, NULL, 900.00, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'General medicine consultation', 'Pending')
  `);

  await connection.end();
  console.log('Database hospital_management created and seeded.');
  console.log('Demo password for all accounts: Hospital@123');
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
