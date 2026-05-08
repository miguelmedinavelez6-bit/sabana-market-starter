const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'sabana_market_secret');
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
}

module.exports = authMiddleware;
