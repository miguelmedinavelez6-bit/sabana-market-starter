import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrdersHistory } from '../services/api';

const STATUS_CONFIG = {
  pending:    { label: 'Pendiente',   color: '#b45309', bg: '#fef3c7' },
  confirmed:  { label: 'Confirmado',  color: '#1d4ed8', bg: '#dbeafe' },
  processing: { label: 'En proceso',  color: '#7c3aed', bg: '#ede9fe' },
  delivered:  { label: 'Entregado',   color: '#15803d', bg: '#dcfce7' },
};

const TRACKING_STEPS = ['pending', 'confirmed', 'processing', 'delivered'];
const TRACKING_LABELS = {
  pending:    'Pedido recibido',
  confirmed:  'Pago confirmado',
  processing: 'En camino',
  delivered:  'Entregado',
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className="order-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function TrackingTimeline({ status }) {
  const currentIdx = TRACKING_STEPS.indexOf(status);
  return (
    <div className="tracking-timeline">
      {TRACKING_STEPS.map((step, idx) => {
        const done = idx <= currentIdx;
        return (
          <div key={step} className="tracking-step">
            <div className={`tracking-dot ${done ? 'tracking-dot--done' : ''}`}>
              {done && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            {idx < TRACKING_STEPS.length - 1 && (
              <div className={`tracking-line ${idx < currentIdx ? 'tracking-line--done' : ''}`} />
            )}
            <span className={`tracking-label ${done ? 'tracking-label--done' : ''}`}>
              {TRACKING_LABELS[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewForm({ orderId, onClose }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="review-submitted">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>¡Gracias por tu reseña!</span>
      </div>
    );
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <div className="review-stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="review-star-btn"
            style={{ color: n <= (hovered || rating) ? '#f59e0b' : '#d1d5db' }}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(n)}
            aria-label={`${n} estrellas`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="review-textarea"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Cuéntanos tu experiencia (opcional)..."
        rows={3}
      />
      <div className="review-actions">
        <button type="submit" className="primary-button small-button" disabled={!rating}>
          Enviar reseña
        </button>
        <button type="button" className="secondary-button small-button" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function OrderCard({ order }) {
  const [showTracking, setShowTracking] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const seller = order.items?.[0]?.sellerName || 'Vendedor';
  const itemCount = order.items?.length || 0;
  const firstItems = order.items?.slice(0, 2) || [];

  return (
    <article className="card order-card">
      <div className="order-card-header">
        <div>
          <p className="order-id">Orden #{order.id}</p>
          <p className="muted order-date">
            {new Date(order.createdAt).toLocaleDateString('es-CO', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="order-card-body">
        <div className="order-seller-row">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6a778b" strokeWidth="2" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          <span className="muted">Vendedor: <strong>{seller}</strong></span>
        </div>

        <div className="order-items-list">
          {firstItems.map((item) => (
            <div key={item.id} className="order-item-row">
              <span className="order-item-name">{item.title}</span>
              <span className="order-item-qty">x{item.quantity}</span>
            </div>
          ))}
          {itemCount > 2 && (
            <p className="muted order-items-more">+{itemCount - 2} producto{itemCount - 2 > 1 ? 's' : ''} más</p>
          )}
        </div>

        <div className="order-total-row">
          <span className="muted">Total</span>
          <span className="order-total">${Number(order.total).toLocaleString('es-CO')}</span>
        </div>
      </div>

      <div className="order-card-footer">
        <button
          className="secondary-button small-button"
          onClick={() => { setShowTracking((v) => !v); setShowReview(false); }}
        >
          {showTracking ? 'Ocultar seguimiento' : 'Rastrear pedido'}
        </button>

        {order.status === 'delivered' && !showReview && (
          <button
            className="primary-button small-button"
            onClick={() => { setShowReview(true); setShowTracking(false); }}
          >
            Dejar reseña
          </button>
        )}
      </div>

      {showTracking && (
        <div className="order-tracking-panel">
          <TrackingTimeline status={order.status} />
        </div>
      )}

      {showReview && (
        <div className="order-review-panel">
          <ReviewForm orderId={order.id} onClose={() => setShowReview(false)} />
        </div>
      )}
    </article>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrdersHistory()
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <Link to="/home" className="back-link">← Volver al marketplace</Link>

      <div className="orders-header">
        <h1 className="orders-title">Mis Pedidos</h1>
        {orders.length > 0 && (
          <span className="orders-count">{orders.length} orden{orders.length !== 1 ? 'es' : ''}</span>
        )}
      </div>

      {loading ? (
        <p className="muted">Cargando pedidos...</p>
      ) : orders.length === 0 ? (
        <div className="card orders-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <p>No tienes pedidos todavía.</p>
          <Link className="primary-button inline-button" to="/home">Explorar productos</Link>
        </div>
      ) : (
        <div className="stack">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
