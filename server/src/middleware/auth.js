const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  try {
    const tokenPayload = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'sabana_market_secret');
    const user = await User.findById(tokenPayload.id).lean();

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        message: user.suspensionReason
          ? `Tu cuenta está suspendida: ${user.suspensionReason}`
          : 'Tu cuenta está suspendida',
      });
    }

    req.user = {
      id: String(user._id),
      institutionalEmail: user.institutionalEmail,
      role: user.role,
      fullName: user.fullName,
      career: user.career,
      reputation: user.reputation,
      isVerified: user.isVerified,
      photoUrl: user.photoUrl || '',
    };
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
}

function hasRoleAccess(userRole, allowedRoles = []) {
  if (!allowedRoles.length) return true;
  if (allowedRoles.includes(userRole)) return true;
  if (userRole === 'seller' && allowedRoles.includes('buyer')) return true;
  return false;
}

function requireRoles(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    if (!hasRoleAccess(req.user.role, allowedRoles)) {
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  hasRoleAccess,
  requireRoles,
};
