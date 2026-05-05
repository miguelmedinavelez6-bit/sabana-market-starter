const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/login', (req, res) => {
  const { institutionalEmail, password } = req.body;

  if (
    institutionalEmail === 'sofia.rodriguez@unisabana.edu.co' &&
    password === '123456'
  ) {
    const token = jwt.sign(
      {
        id: '1',
        institutionalEmail,
        role: 'buyer',
        fullName: 'Sofía Rodríguez',
      },
      process.env.JWT_SECRET || 'sabana_market_secret',
      { expiresIn: '1d' }
    );

    return res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: '1',
        fullName: 'Sofía Rodríguez',
        institutionalEmail,
        role: 'buyer',
      },
    });
  }

  return res.status(401).json({ message: 'Credenciales inválidas' });
});

module.exports = router;
