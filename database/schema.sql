-- Hospital Management System
-- Relational schema with PKs, FKs, UNIQUE, NOT NULL, and CHECKs

CREATE DATABASE IF NOT EXISTS hospital_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hospital_management;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS bill;
DROP TABLE IF EXISTS medical_test;
DROP TABLE IF EXISTS prescription;
DROP TABLE IF EXISTS admission;
DROP TABLE IF EXISTS appointment;
DROP TABLE IF EXISTS doctor;
DROP TABLE IF EXISTS patient;
DROP TABLE IF EXISTS department;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'receptionist', 'doctor', 'patient') NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_users_active CHECK (is_active IN (0, 1))
);

CREATE TABLE department (
  department_id INT PRIMARY KEY AUTO_INCREMENT,
  department_name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL
);

CREATE TABLE patient (
  patient_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  dob DATE NOT NULL,
  gender VARCHAR(20) NOT NULL,
  blood_group VARCHAR(10) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  emergency_contact VARCHAR(100) NOT NULL,
  CONSTRAINT fk_patient_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_patient_gender
    CHECK (gender IN ('Male', 'Female', 'Other'))
);

CREATE TABLE doctor (
  doctor_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  department_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  specialization VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL,
  experience INT NOT NULL,
  CONSTRAINT fk_doctor_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_doctor_department
    FOREIGN KEY (department_id) REFERENCES department(department_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_doctor_experience CHECK (experience >= 0)
);

CREATE TABLE appointment (
  appointment_id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason VARCHAR(255) NOT NULL,
  diagnosis VARCHAR(255) NULL,
  status ENUM('Scheduled', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Scheduled',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointment_patient
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_appointment_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE admission (
  admission_id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  room_number VARCHAR(20) NOT NULL,
  admission_date DATE NOT NULL,
  discharge_date DATE NULL,
  reason VARCHAR(255) NOT NULL,
  status ENUM('Admitted', 'Discharged') NOT NULL DEFAULT 'Admitted',
  CONSTRAINT fk_admission_patient
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_admission_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE prescription (
  prescription_id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_id INT NOT NULL,
  medicine_name VARCHAR(100) NOT NULL,
  dosage VARCHAR(50) NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  duration VARCHAR(50) NOT NULL,
  instructions VARCHAR(255) NOT NULL,
  prescription_date DATE NOT NULL,
  CONSTRAINT fk_prescription_patient
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_prescription_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_prescription_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointment(appointment_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE medical_test (
  test_id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_id INT NOT NULL,
  test_name VARCHAR(100) NOT NULL,
  test_type VARCHAR(100) NOT NULL,
  result VARCHAR(255) NULL,
  test_date DATE NOT NULL,
  status ENUM('Ordered', 'Completed') NOT NULL DEFAULT 'Ordered',
  CONSTRAINT fk_test_patient
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_test_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_test_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointment(appointment_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE bill (
  bill_id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  appointment_id INT NULL,
  admission_id INT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  bill_date DATE NOT NULL,
  description VARCHAR(255) NOT NULL,
  status ENUM('Pending', 'Paid') NOT NULL DEFAULT 'Pending',
  CONSTRAINT fk_bill_patient
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_bill_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointment(appointment_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_bill_admission
    FOREIGN KEY (admission_id) REFERENCES admission(admission_id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_bill_amount CHECK (amount > 0),
  CONSTRAINT chk_bill_source CHECK (
    appointment_id IS NOT NULL OR admission_id IS NOT NULL
  )
);

CREATE INDEX idx_appointment_date ON appointment (appointment_date);
CREATE INDEX idx_appointment_status ON appointment (status);
CREATE INDEX idx_appointment_doctor_slot ON appointment (doctor_id, appointment_date, appointment_time);
CREATE INDEX idx_admission_status ON admission (status);
CREATE INDEX idx_bill_status ON bill (status);
CREATE INDEX idx_patient_phone ON patient (phone);
CREATE INDEX idx_doctor_department ON doctor (department_id);
