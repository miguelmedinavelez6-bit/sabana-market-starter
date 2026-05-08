const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { institutionalEmail, password } = req.body;

  if (!institutionalEmail || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
  }

  const user = await User.findOne({ institutionalEmail: institutionalEmail.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const token = jwt.sign(
    { id: user._id, institutionalEmail: user.institutionalEmail, role: user.role, fullName: user.fullName },
    process.env.JWT_SECRET || 'sabana_market_secret',
    { expiresIn: '1d' }
  );

  return res.json({
    message: 'Inicio de sesión exitoso',
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      institutionalEmail: user.institutionalEmail,
      role: user.role,
    },
  });
});

module.exports = router;
