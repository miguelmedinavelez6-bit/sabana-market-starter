import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications, markAllNotificationsRead } from '../services/api';

const TYPE_CONFIG = {
  new_message: {
    label: 'Mensaje',
    color: '#1d4ed8',
    bg: '#dbeafe',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  new_purchase: {
    label: 'Compra',
    color: '#15803d',
    bg: '#dcfce7',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  order_status: {
    label: 'Orden',
    color: '#7c3aed',
    bg: '#ede9fe',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  new_review: {
    label: 'Reseña',
    color: '#c2410c',
    bg: '#ffedd5',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
};

function formatNotificationDate(dateValue) {
  const date = new Date(dateValue);

  return date.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const loadNotifications = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setError('');
    } catch (err) {
      if (!silent) setNotifications([]);
      setError(err.message || 'No fue posible cargar tus notificaciones');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const intervalId = window.setInterval(() => {
      loadNotifications({ silent: true });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleMarkAllRead = async () => {
    if (!unreadCount || markingAll) return;

    setMarkingAll(true);
    setError('');

    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((notification) => ({
        ...notification,
        read: true,
      })));
    } catch (err) {
      setError(err.message || 'No fue posible marcar las notificaciones como leídas');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="page notifications-page">
      <Link to="/home" className="back-link">← Volver al marketplace</Link>

      <div className="notifications-header">
        <div>
          <h1 className="notifications-title">Notificaciones</h1>
          <p className="muted notifications-subtitle">
            {notifications.length === 0
              ? 'Aquí verás mensajes, compras, cambios de estado y reseñas.'
              : `${unreadCount} sin leer · ${notifications.length} total`}
          </p>
        </div>

        <button
          type="button"
          className="secondary-button small-button"
          onClick={handleMarkAllRead}
          disabled={!unreadCount || markingAll}
        >
          {markingAll ? 'Marcando...' : 'Marcar todas como leídas'}
        </button>
      </div>

      {error && (
        <div className="card products-feedback">
          <p className="login-error">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="muted">Cargando notificaciones...</p>
      ) : notifications.length === 0 ? (
        <div className="card notifications-empty">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <p>No tienes notificaciones por ahora.</p>
        </div>
      ) : (
        <div className="stack">
          {notifications.map((notification) => {
            const cfg = TYPE_CONFIG[notification.type] || {
              label: 'Actividad',
              color: '#475569',
              bg: '#e2e8f0',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l2.5 2.5" />
                </svg>
              ),
            };

            return (
              <article
                key={notification.id}
                className={`card notification-card ${notification.read ? '' : 'notification-card--unread'}`}
              >
                <div
                  className="notification-icon"
                  style={{ color: cfg.color, background: cfg.bg }}
                >
                  {cfg.icon}
                </div>

                <div className="notification-content">
                  <div className="notification-topline">
                    <span
                      className="notification-type-pill"
                      style={{ color: cfg.color, background: cfg.bg }}
                    >
                      {cfg.label}
                    </span>

                    <span className="notification-date">
                      {formatNotificationDate(notification.createdAt)}
                    </span>

                    {!notification.read && <span className="notification-unread-dot" aria-hidden="true" />}
                  </div>

                  <p className="notification-message">{notification.message}</p>

                  {(notification.metadata?.productTitle || notification.metadata?.orderId) && (
                    <p className="muted notification-context">
                      {notification.metadata?.productTitle
                        ? `Producto: ${notification.metadata.productTitle}`
                        : `Orden #${notification.metadata?.orderId}`}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
