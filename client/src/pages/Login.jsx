import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  exchangeMicrosoftCode,
  getMicrosoftAuthUrl,
  loginUser,
  registerUser,
} from '../services/api';
import { getStoredToken, saveAuthSession } from '../utils/auth';

const INSTITUTIONAL_DOMAIN = '@unisabana.edu.co';
const MICROSOFT_STATE_KEY = 'sabana_market_ms_state';

function LogoIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#c9a227" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function MicrosoftLogo() {
  return (
    <span className="ms-logo" aria-hidden="true">
      <span style={{ background: '#f25022' }} />
      <span style={{ background: '#7fba00' }} />
      <span style={{ background: '#00a4ef' }} />
      <span style={{ background: '#ffb900' }} />
    </span>
  );
}

export default function Login() {
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [career, setCareer] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getStoredToken();
    if (token) navigate('/home', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (token) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const providerError = params.get('error');

    if (providerError) {
      setError('Microsoft canceló o rechazó la autenticación.');
      navigate('/', { replace: true });
      return;
    }

    if (!code) return;

    const expectedState = sessionStorage.getItem(MICROSOFT_STATE_KEY);
    if (expectedState && state && expectedState !== state) {
      setError('No fue posible validar la respuesta de Microsoft.');
      navigate('/', { replace: true });
      return;
    }

    setMicrosoftLoading(true);
    setError('');

    exchangeMicrosoftCode({
      code,
      redirectUri: `${window.location.origin}/`,
    })
      .then((data) => {
        saveAuthSession(data, true);
        sessionStorage.removeItem(MICROSOFT_STATE_KEY);
        navigate('/home', { replace: true });
      })
      .catch((err) => {
        setError(err.message || 'No fue posible iniciar sesión con Microsoft');
        navigate('/', { replace: true });
      })
      .finally(() => setMicrosoftLoading(false));
  }, [navigate]);

  const validate = () => {
    if (mode === 'register' && !fullName.trim()) return 'Por favor ingresa tu nombre completo.';
    if (!email.trim() || !password.trim()) return 'Por favor completa todos los campos.';
    if (!email.endsWith(INSTITUTIONAL_DOMAIN)) return `El correo debe terminar en ${INSTITUTIONAL_DOMAIN}.`;
    if (mode === 'register' && password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (mode === 'register' && password !== confirmPassword) return 'Las contraseñas no coinciden.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setLoading(true);
    try {
      const data = mode === 'login'
        ? await loginUser({ institutionalEmail: email, password })
        : await registerUser({
            fullName,
            career,
            institutionalEmail: email,
            password,
          });
      saveAuthSession(data, remember);
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setMicrosoftLoading(true);
    setError('');

    try {
      const state = Math.random().toString(36).slice(2);
      sessionStorage.setItem(MICROSOFT_STATE_KEY, state);
      const data = await getMicrosoftAuthUrl({
        state,
        redirectUri: `${window.location.origin}/`,
      });
      window.location.assign(data.url);
    } catch (err) {
      setError(err.message || 'No fue posible conectar con Microsoft');
      setMicrosoftLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="login-logo-wrap">
          <LogoIcon />
        </div>
        <h1 className="login-brand-name">Sabana Market</h1>
        <p className="login-brand-sub">El marketplace de la comunidad universitaria</p>
      </div>

      <div className="login-card">
        <div className="login-mode-switch">
          <button
            type="button"
            className={`login-mode-btn ${mode === 'login' ? 'login-mode-btn--active' : ''}`}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={`login-mode-btn ${mode === 'register' ? 'login-mode-btn--active' : ''}`}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            Crear cuenta
          </button>
        </div>

        <h2 className="login-card-title">
          {mode === 'login' ? 'Iniciar Sesión' : 'Crear cuenta'}
        </h2>

        {mode === 'login' && (
          <button type="button" className="ms-button" onClick={handleMicrosoftLogin} disabled={microsoftLoading || loading}>
            <MicrosoftLogo />
            {microsoftLoading ? 'Conectando con Microsoft...' : 'Continuar con Microsoft'}
          </button>
        )}

        <div className="login-divider">
          <span>{mode === 'login' ? 'O ingresa con tu correo' : 'Completa tu registro institucional'}</span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <>
              <div className="field-group">
                <label className="field-label" htmlFor="fullName">Nombre completo</label>
                <div className="field-wrapper">
                  <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="fullName"
                    type="text"
                    className="field-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Sofía Rodríguez"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="career">Carrera (opcional)</label>
                <div className="field-wrapper">
                  <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
                    <path d="m4 6 8-4 8 4-8 4-8-4Z" />
                    <path d="m4 10 8 4 8-4" />
                    <path d="m4 14 8 4 8-4" />
                  </svg>
                  <input
                    id="career"
                    type="text"
                    className="field-input"
                    value={career}
                    onChange={(e) => setCareer(e.target.value)}
                    placeholder="Administración de Empresas"
                    autoComplete="organization-title"
                  />
                </div>
              </div>
            </>
          )}

          <div className="field-group">
            <label className="field-label" htmlFor="email">Correo Institucional</label>
            <div className="field-wrapper">
              <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                id="email"
                type="email"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@unisabana.edu.co"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="password">Contraseña</label>
            <div className="field-wrapper">
              <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="password"
                type="password"
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="field-group">
              <label className="field-label" htmlFor="confirmPassword">Confirmar contraseña</label>
              <div className="field-wrapper">
                <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="confirmPassword"
                  type="password"
                  className="field-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {error && <p className="login-error">{error}</p>}

          <div className="login-options-row">
            <label className="remember-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              {mode === 'login' ? 'Recordarme' : 'Mantener sesión iniciada'}
            </label>
            {mode === 'login' && <button type="button" className="text-link">¿Olvidaste tu contraseña?</button>}
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading
              ? (mode === 'login' ? 'Ingresando...' : 'Creando cuenta...')
              : (mode === 'login' ? 'Iniciar Sesión →' : 'Crear cuenta →')}
          </button>
        </form>
      </div>

      <p className="login-footer">
        {mode === 'login' ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}{' '}
        <button
          type="button"
          className="text-link-bold"
          onClick={() => {
            setMode((current) => current === 'login' ? 'register' : 'login');
            setError('');
          }}
        >
          {mode === 'login' ? 'Regístrate aquí' : 'Inicia sesión aquí'}
        </button>
      </p>
    </div>
  );
}
