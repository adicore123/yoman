const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'wisecare_jwt_super_secret_key_2026_secure';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided, authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'User account is disabled' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token is invalid or expired' });
  }
};

const superadminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Superadmin access required' });
  }
  next();
};

module.exports = {
  authMiddleware,
  superadminMiddleware,
  JWT_SECRET
};
