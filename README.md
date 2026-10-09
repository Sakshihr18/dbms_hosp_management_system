# CareHub — Hospital Management System

A full-stack, role-based Hospital Management System designed to digitize and streamline hospital operations across clinical, administrative, inpatient, and financial workflows.

---

## 📌 Overview

**CareHub** is a web-based Hospital Management System that provides a centralized platform for managing patients, doctors, appointments, admissions, medical records, prescriptions, diagnostic tests, billing, and hospital administration.

The system follows a **role-based architecture**, providing dedicated portals and permissions for:

- Admin
- Receptionist
- Doctor
- Patient

CareHub is built using a modern full-stack architecture with **React.js, Node.js, Express.js, and MySQL**. Authentication and authorization are handled using **JWT-based authentication**, secure password hashing with **bcryptjs**, and middleware-based role-based access control.

---

## 🔑 Demo Login Credentials

All demonstration accounts use the default password: **`Hospital@123`**

| Role | Email | Password | Default Portal |
|---|---|---|---|
| **Admin** | `admin@hospital.com` | `Hospital@123` | `/admin/dashboard` |
| **Doctor** | `doctor@hospital.com` | `Hospital@123` | `/doctor/dashboard` |
| **Receptionist** | `reception@hospital.com` | `Hospital@123` | `/receptionist/dashboard` |
| **Patient** | `patient@hospital.com` | `Hospital@123` | `/patient/dashboard` |

<details>
<summary><b>View Additional Seeded Accounts</b></summary>

- **Other Doctors:**
  - `priya.nair@hospital.com` (Neurology)
  - `rohan.sharma@hospital.com` (Orthopedics)
  - `ananya.iyer@hospital.com` (Internal Medicine)
  - `vikram.reddy@hospital.com` (Pediatrics)
- **Other Receptionists:**
  - `reception2@hospital.com`
- **Other Patients:**
  - `sanjay.patel@hospital.com`
  - `neha.gupta@hospital.com`
  - `amit.kulkarni@hospital.com`
  - `pooja.singh@hospital.com`

</details>

> 💡 **Tip:** New patients can also self-register via the `/register` page.

---

## 🎯 Objectives

The main objectives of CareHub are to:

- Digitize hospital management processes.
- Centralize patient and medical information.
- Simplify appointment and admission management.
- Provide secure role-based access to hospital resources.
- Maintain electronic health records.
- Streamline prescription and diagnostic workflows.
- Automate billing and payment management.
- Provide dashboards and analytics for different hospital roles.
- Maintain data consistency using a relational database.

---

## ✨ Key Features

### 🔐 Authentication & Authorization

- JWT-based authentication
- Secure password hashing using bcryptjs
- Role-based access control
- Protected routes and APIs
- Separate portals for different user roles

### 👨‍💼 Admin Portal

Administrators can:

- Manage users
- Manage departments
- Manage doctors
- Manage patients
- Manage appointments
- Manage admissions
- Manage billing
- Monitor hospital activities
- View dashboards and analytics

### 🧑‍💻 Receptionist Portal

Receptionists can:

- Register patients
- Manage patient information
- Schedule appointments
- Manage admissions
- Manage billing
- View appointment schedules

### 👨‍⚕️ Doctor Portal

Doctors can:

- View assigned appointments
- Manage consultations
- Access patient medical history
- Create medical records
- Issue e-prescriptions
- Order diagnostic tests
- View test results
- Manage patient treatment information

### 🧑‍🤝‍🧑 Patient Portal

Patients can:

- View their profile
- Book appointments
- View appointments
- View prescriptions
- View medical records
- View diagnostic test results
- View billing information
- Track their hospital-related information

---

## 🏥 Core Modules

| Module | Description |
|---|---|
| Authentication | Login, registration and authorization |
| User Management | Manage hospital system users |
| Department Management | Manage hospital departments |
| Doctor Management | Manage doctors and their details |
| Patient Management | Register and manage patients |
| Appointment Management | Schedule and manage appointments |
| Admission Management | Manage inpatient admissions |
| EHR / Medical History | Maintain electronic medical records |
| E-Prescription | Create and manage prescriptions |
| Diagnostic Tests | Order and manage medical tests |
| Billing | Generate and manage patient bills |
| Payments | Track payment information |
| Dashboard | Display role-specific statistics and analytics |

---

## 🛠️ Tech Stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts

### Backend

- Node.js
- Express.js
- REST API
- JWT
- bcryptjs

### Database

- MySQL 8
- Relational database design
- Primary Keys
- Foreign Keys
- Constraints
- Indexes
- Referential Integrity

---

## 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      CareHub UI      │
                    │   React + Vite       │
                    │   Tailwind CSS       │
                    └──────────┬───────────┘
                               │
                               │ HTTP / REST API
                               ▼
                    ┌──────────────────────┐
                    │    Express Server    │
                    │      Node.js         │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
          ┌──────────┐   ┌───────────┐  ┌────────────┐
          │   JWT    │   │Middleware │  │ Controllers│
          │   Auth   │   │   RBAC    │  │  & Routes  │
          └──────────┘   └───────────┘  └────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │       MySQL 8        │
                    │   Relational DB      │
                    └──────────────────────┘