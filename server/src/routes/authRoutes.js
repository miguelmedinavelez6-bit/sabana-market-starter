const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const INSTITUTIONAL_DOMAIN = '@unisabana.edu.co';

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      institutionalEmail: user.institutionalEmail,
      role: user.role,
      fullName: user.fullName,
      career: user.career,
      reputation: user.reputation,
      isVerified: user.isVerified,
      photoUrl: user.photoUrl || '',
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
    career: user.career,
    photoUrl: user.photoUrl || '',
    reputation: user.reputation,
    verified: user.isVerified !== false,
    isSuspended: user.isSuspended === true,
    role: user.role,
  };
}

function isInstitutionalEmail(email = '') {
  return String(email).toLowerCase().endsWith(INSTITUTIONAL_DOMAIN);
}

function getMicrosoftConfig(redirectUriOverride = '') {
  const clientId = process.env.MICROSOFT_CLIENT_ID || '';
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || '';
  const redirectUri = redirectUriOverride || process.env.MICROSOFT_REDIRECT_URI || '';
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';

  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    tenantId,
  };
}

function ensureActiveUser(user) {
  if (!user) return 'Usuario no encontrado';
  if (user.isSuspended) {
    return user.suspensionReason
      ? `Tu cuenta está suspendida: ${user.suspensionReason}`
      : 'Tu cuenta está suspendida';
  }
  return '';
}

async function exchangeMicrosoftCode({ code, redirectUri }) {
  const config = getMicrosoftConfig(redirectUri);

  if (!config) {
    throw new Error('Microsoft Login no está configurado en el servidor');
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
    scope: 'openid profile email User.Read',
  });

  const tokenResponse = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || 'No fue posible validar tu cuenta Microsoft');
  }

  const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });
  const profileData = await profileResponse.json();

  if (!profileResponse.ok) {
    throw new Error(profileData.error?.message || 'No fue posible consultar tu perfil de Microsoft');
  }

  return {
    microsoftId: String(profileData.id || ''),
    fullName: String(profileData.displayName || 'Usuario').trim(),
    institutionalEmail: String(profileData.mail || profileData.userPrincipalName || '').trim().toLowerCase(),
  };
}

router.post('/register', async (req, res) => {
  const fullName = String(req.body?.fullName || '').trim();
  const institutionalEmail = String(req.body?.institutionalEmail || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const career = String(req.body?.career || '').trim();

  if (!fullName || !institutionalEmail || !password) {
    return res.status(400).json({ message: 'Nombre, correo institucional y contraseña son requeridos' });
  }

  if (!isInstitutionalEmail(institutionalEmail)) {
    return res.status(400).json({ message: `El correo debe terminar en ${INSTITUTIONAL_DOMAIN}` });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const existingUser = await User.findOne({ institutionalEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Ya existe una cuenta con este correo institucional' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      institutionalEmail,
      password: hashedPassword,
      career: career || 'Comunidad Unisabana',
      authProvider: 'password',
      role: 'buyer',
      isVerified: true,
    });

    const token = signToken(user);

    return res.status(201).json({
      message: 'Registro exitoso',
      token,
      user: serializeUser(user),
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'Ya existe una cuenta con este correo institucional' });
    }

    console.error(err);
    return res.status(500).json({ message: 'No fue posible completar el registro' });
  }
});

router.post('/login', async (req, res) => {
  const { institutionalEmail, password } = req.body;

  if (!institutionalEmail || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
  }

  const user = await User.findOne({ institutionalEmail: institutionalEmail.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const userStatusError = ensureActiveUser(user);
  if (userStatusError) {
    return res.status(403).json({ message: userStatusError });
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

router.get('/microsoft/url', (req, res) => {
  const state = String(req.query.state || '').trim();
  const redirectUri = String(req.query.redirectUri || '').trim();
  const config = getMicrosoftConfig(redirectUri);

  if (!config) {
    return res.status(503).json({ message: 'Microsoft Login no está configurado en el servidor' });
  }

  const authUrl = new URL(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize`);
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('response_mode', 'query');
  authUrl.searchParams.set('scope', 'openid profile email User.Read');
  if (state) authUrl.searchParams.set('state', state);

  return res.json({ url: authUrl.toString() });
});

router.post('/microsoft/exchange', async (req, res) => {
  const code = String(req.body?.code || '').trim();
  const redirectUri = String(req.body?.redirectUri || '').trim();

  if (!code) {
    return res.status(400).json({ message: 'El código de Microsoft es obligatorio' });
  }

  try {
    const microsoftProfile = await exchangeMicrosoftCode({ code, redirectUri });

    if (!microsoftProfile.institutionalEmail || !isInstitutionalEmail(microsoftProfile.institutionalEmail)) {
      return res.status(403).json({ message: `Tu cuenta Microsoft debe pertenecer a ${INSTITUTIONAL_DOMAIN}` });
    }

    let user = await User.findOne({ institutionalEmail: microsoftProfile.institutionalEmail });

    if (!user) {
      const generatedPassword = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);
      user = await User.create({
        fullName: microsoftProfile.fullName || 'Usuario Unisabana',
        institutionalEmail: microsoftProfile.institutionalEmail,
        password: generatedPassword,
        career: 'Comunidad Unisabana',
        role: 'buyer',
        isVerified: true,
        microsoftId: microsoftProfile.microsoftId,
        authProvider: 'microsoft',
      });
    } else {
      const userStatusError = ensureActiveUser(user);
      if (userStatusError) {
        return res.status(403).json({ message: userStatusError });
      }

      user.microsoftId = microsoftProfile.microsoftId || user.microsoftId;
      user.authProvider = user.authProvider || 'password';
      if (!user.fullName && microsoftProfile.fullName) {
        user.fullName = microsoftProfile.fullName;
      }
      await user.save();
    }

    const token = signToken(user);

    return res.json({
      message: 'Inicio de sesión con Microsoft exitoso',
      token,
      user: serializeUser(user),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'No fue posible iniciar sesión con Microsoft' });
  }
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
