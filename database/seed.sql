-- Demo data for hospital_management
-- Prefer: cd server && npm run seed
-- That script hashes passwords with bcrypt and uses relative dates.
-- This file is kept for DBMS documentation. Run schema.sql first, then this file
-- only after replacing PASSWORD_HASH with a bcrypt hash of Hospital@123.

USE hospital_management;

-- Staff and demo users (password = Hospital@123)
-- INSERT statements are applied by server/seed/seed.js so hashes stay valid.

-- Departments, doctors, patients, appointments, admissions,
-- prescriptions, tests and bills are inserted by:
--   npm run seed
-- from the server folder.

SELECT 'Run npm run seed from the server folder to load demo data.' AS instruction;
