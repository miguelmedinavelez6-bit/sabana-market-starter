import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';

export default function Login() {
  const [institutionalEmail, setInstitutionalEmail] = useState('sofia.rodriguez@unisabana.edu.co');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginUser({ institutionalEmail, password });
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
    <div className="page center-page">
      <div className="card auth-card">
        <h1>Sabana Market</h1>
        <p className="muted">El marketplace de la comunidad universitaria</p>
        <button className="secondary-button" type="button">Continuar con Microsoft</button>
        <div className="divider">O ingresa con tu correo</div>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Correo Institucional
            <input
              type="email"
              value={institutionalEmail}
              onChange={(e) => setInstitutionalEmail(e.target.value)}
              placeholder="usuario@unisabana.edu.co"
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
        <p className="muted small">Demo: usa sofia.rodriguez@unisabana.edu.co / 123456</p>
      </div>
    </div>
  );
}
