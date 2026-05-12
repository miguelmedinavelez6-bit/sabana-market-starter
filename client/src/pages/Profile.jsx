import { Link } from 'react-router-dom';
import { getRoleLabel, getStoredUser } from '../utils/auth';

export default function Profile() {
  const user = getStoredUser();
  const fullName = user.fullName || 'Usuario';
  const roleLabel = getRoleLabel(user.role);

  return (
    <div className="page">
      <Link to="/home" className="back-link">← Volver al marketplace</Link>

      <div className="card account-card">
        <div className="account-header">
          <div className="account-avatar">{fullName[0]?.toUpperCase() || 'U'}</div>
          <div>
            <h1 className="account-title">{fullName}</h1>
            <p className="muted account-subtitle">{user.institutionalEmail || 'Sin correo registrado'}</p>
          </div>
        </div>

        <div className="account-role-badge">{roleLabel}</div>

        <p className="account-description">
          {user.role === 'seller'
            ? 'Tu cuenta puede comprar y vender dentro del marketplace.'
            : user.role === 'admin'
              ? 'Tu cuenta tiene permisos administrativos y también puede navegar el marketplace.'
              : 'Tu cuenta está lista para comprar productos dentro del marketplace.'}
        </p>

        <div className="stack">
          <Link className="primary-button inline-button" to="/orders">Ver Mis Pedidos</Link>
          <Link className="secondary-button inline-button" to="/messages">Ir a Mensajes</Link>
          <Link className="secondary-button inline-button" to="/home">Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}
