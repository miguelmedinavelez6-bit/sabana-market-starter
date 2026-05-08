import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';

const INSTITUTIONAL_DOMAIN = '@unisabana.edu.co';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    if (!email.trim() || !password.trim()) return 'Por favor completa todos los campos.';
    if (!email.endsWith(INSTITUTIONAL_DOMAIN)) return `El correo debe terminar en ${INSTITUTIONAL_DOMAIN}.`;
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setLoading(true);
    try {
      const data = await loginUser({ institutionalEmail: email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
        <h2 className="login-card-title">Iniciar Sesión</h2>

        <button type="button" className="ms-button">
          <MicrosoftLogo />
          Continuar con Microsoft
        </button>

        <div className="login-divider">
          <span>O ingresa con tu correo</span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
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

          {error && <p className="login-error">{error}</p>}

          <div className="login-options-row">
            <label className="remember-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Recordarme
            </label>
            <button type="button" className="text-link">¿Olvidaste tu contraseña?</button>
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión →'}
          </button>
        </form>
      </div>

      <p className="login-footer">
        ¿No tienes una cuenta? <button type="button" className="text-link-bold">Regístrate aquí</button>
      </p>
    </div>
  );
}
