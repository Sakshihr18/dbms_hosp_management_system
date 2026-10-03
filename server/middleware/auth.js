const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Please log in to continue.' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      'SELECT user_id, name, email, role, is_active FROM users WHERE user_id = ?',
      [payload.user_id]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ message: 'Unauthorized access.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized access.' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized access.' });
    }
    next();
  };
}

function signToken(user) {
  return jwt.sign(
    { user_id: user.user_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = { authenticate, authorize, signToken };
