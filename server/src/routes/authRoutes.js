const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      institutionalEmail: user.institutionalEmail,
      role: user.role,
      fullName: user.fullName,
    },
    process.env.JWT_SECRET || 'sabana_market_secret',
    { expiresIn: '1d' }
  );
}

function serializeUser(user) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    institutionalEmail: user.institutionalEmail,
    role: user.role,
  };
}

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

  const token = signToken(user);

  return res.json({
    message: 'Inicio de sesión exitoso',
    token,
    user: serializeUser(user),
  });
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  return res.json({ user: serializeUser(user) });
});

router.post('/become-seller', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  if (user.role === 'seller') {
    return res.json({
      message: 'Tu cuenta ya tiene perfil de vendedor activo',
      token: signToken(user),
      user: serializeUser(user),
    });
  }

  if (user.role === 'admin') {
    return res.json({
      message: 'Tu cuenta de administrador ya cuenta con permisos avanzados',
      token: signToken(user),
      user: serializeUser(user),
    });
  }

  user.role = 'seller';
  await user.save();

  return res.json({
    message: 'Tu cuenta ahora también puede operar como vendedor',
    token: signToken(user),
    user: serializeUser(user),
  });
});

module.exports = router;
