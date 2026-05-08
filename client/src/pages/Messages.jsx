import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Messages() {
  const { state } = useLocation();
  const product = state?.product || null;
  const seller = product?.seller || {};

  const [message, setMessage] = useState(
    product ? `¡Hola! ¿Sigue disponible el ${product.title}?` : ''
  );
  const [sent, setSent] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSent(true);
  };

  return (
    <div className="page">
      <Link to="/home" className="back-link">← Volver al marketplace</Link>

      <div className="messages-layout">
        <div className="card messages-card">
          <div className="messages-header">
            <div className="user-avatar-nav">{seller.fullName?.[0] || '?'}</div>
            <div>
              <h3 className="messages-seller-name">{seller.fullName || 'Vendedor'}</h3>
              {product && (
                <p className="muted messages-product-ref">
                  Re: {product.title} — ${product.price?.toLocaleString('es-CO')}
                </p>
              )}
            </div>
          </div>

          <div className="messages-body">
            {sent ? (
              <div className="message-bubble message-bubble--sent">
                <p>{message}</p>
              </div>
            ) : (
              <p className="muted messages-empty">Inicia la conversación con el vendedor.</p>
            )}
          </div>

          {!sent ? (
            <form className="messages-form" onSubmit={handleSend}>
              <input
                className="messages-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
              />
              <button type="submit" className="primary-button messages-send-btn">Enviar</button>
            </form>
          ) : (
            <p className="messages-sent-confirm">✓ Mensaje enviado. El vendedor te responderá pronto.</p>
          )}
        </div>
      </div>
    </div>
  );
}
