import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrderConfirmation } from '../services/api';

const STATUS_LABELS = {
  pending:    { label: 'Pendiente',   color: '#ca8a04', bg: '#fefce8' },
  confirmed:  { label: 'Confirmado',  color: '#16a34a', bg: '#f0fdf4' },
  processing: { label: 'En proceso',  color: '#2563eb', bg: '#eff6ff' },
};

export default function Success() {
  const saved = JSON.parse(localStorage.getItem('lastOrder') || '{}');
  const [order, setOrder] = useState(saved);
  const [message, setMessage] = useState('Tu orden ha sido procesada correctamente');
  const [loading, setLoading] = useState(!!saved.id);

  useEffect(() => {
    if (!saved.id) return;
    getOrderConfirmation(saved.id)
      .then((data) => {
        setOrder(data.order);
        setMessage(data.message);
      })
      .catch(() => {
        // Si el endpoint falla (e.g. servidor reiniciado), se usa el dato de localStorage
      })
      .finally(() => setLoading(false));
  }, [saved.id]);

  const status = STATUS_LABELS[order.status] || STATUS_LABELS.pending;

  if (!loading && !order?.id) {
    return (
      <div className="page center-page">
        <div className="success-card card">
          <h1 className="success-title">No encontramos una compra reciente</h1>
          <p className="success-message">
            Puedes revisar tus pedidos o volver al inicio para seguir explorando productos.
          </p>

          <div className="success-actions">
            <Link className="primary-button inline-button" to="/orders">
              Ver Mis Pedidos
            </Link>
            <Link className="secondary-button inline-button" to="/home">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page center-page">
        <div className="success-card card">
          <p className="muted">Verificando tu orden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page center-page">
      <div className="success-card card">
        <div className="success-icon-wrap">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="success-title">¡Compra exitosa!</h1>
        <p className="success-message">{message}</p>

        <div className="success-detail-row">
          <span className="success-detail-label">Número de orden</span>
          <span className="success-detail-value">#{order.id}</span>
        </div>

        <div className="success-detail-row">
          <span className="success-detail-label">Estado</span>
          <span
            className="success-status-badge"
            style={{ color: status.color, background: status.bg }}
          >
            {status.label}
          </span>
        </div>

        {order.total != null && (
          <div className="success-detail-row">
            <span className="success-detail-label">Total pagado</span>
            <span className="success-detail-value">
              ${Number(order.total).toLocaleString('es-CO')}
            </span>
          </div>
        )}

        <div className="success-actions">
          <Link className="primary-button inline-button" to="/orders">
            Ver Mis Pedidos
          </Link>
          <Link className="secondary-button inline-button" to="/home">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
