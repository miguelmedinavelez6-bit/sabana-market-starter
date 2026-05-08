import { Link } from 'react-router-dom';

export default function SellerProfile() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="page">
      <Link to="/home" className="back-link">← Volver al marketplace</Link>

      <div className="card seller-profile-card">
        <div className="seller-profile-header">
          <div className="seller-profile-avatar">{user.fullName?.[0] || 'V'}</div>
          <div>
            <h2>{user.fullName || 'Vendedor'}</h2>
            <p className="muted">{user.institutionalEmail || ''}</p>
            <p className="muted">Miembro desde 2022 · Vendedor verificado</p>
          </div>
        </div>

        <div className="seller-profile-stats">
          <div className="seller-stat">
            <span className="seller-stat-value">4.8</span>
            <span className="seller-stat-label">Reputación</span>
          </div>
          <div className="seller-stat">
            <span className="seller-stat-value">12</span>
            <span className="seller-stat-label">Ventas</span>
          </div>
          <div className="seller-stat">
            <span className="seller-stat-value">98%</span>
            <span className="seller-stat-label">Respuesta</span>
          </div>
        </div>

        <div className="button-row">
          <Link to="/messages" className="primary-button" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Enviar mensaje
          </Link>
        </div>
      </div>
    </div>
  );
}
