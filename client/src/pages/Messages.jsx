import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const STORAGE_KEY = 'sabana_conversations';

const AUTO_REPLIES = [
  '¡Hola! Sí, sigue disponible.',
  'Claro, puedo mostrártelo cuando quieras.',
  '¿Cuándo te queda bien para verlo?',
  'El precio es negociable si lo compras hoy.',
  'Puedo entregarlo en el campus mañana.',
];

function loadConversations() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveConversations(convs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
}

function makeConvId(sellerName, productId) {
  return `${sellerName}__${productId || 'general'}`;
}

export default function Messages() {
  const { state } = useLocation();
  const incomingProduct = state?.product || null;

  const [conversations, setConversations] = useState(loadConversations);
  const [selectedId, setSelectedId] = useState(null);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-open or create conversation when arriving from ProductDetail
  useEffect(() => {
    if (!incomingProduct) return;
    const seller = incomingProduct.seller || {};
    const sellerName = seller.fullName || incomingProduct.sellerName || 'Vendedor';
    const convId = makeConvId(sellerName, incomingProduct.id || incomingProduct._id);

    setConversations((prev) => {
      const exists = prev.find((c) => c.id === convId);
      if (exists) {
        setSelectedId(convId);
        return prev;
      }
      const newConv = {
        id: convId,
        sellerName,
        productTitle: incomingProduct.title,
        productPrice: incomingProduct.price,
        messages: [],
        updatedAt: Date.now(),
      };
      const updated = [newConv, ...prev];
      saveConversations(updated);
      setSelectedId(convId);
      return updated;
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId, conversations]);

  const selected = conversations.find((c) => c.id === selectedId) || null;

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !selected) return;

    const text = input.trim();
    setInput('');

    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== selectedId) return c;
        return {
          ...c,
          messages: [...c.messages, { text, from: 'me', ts: Date.now() }],
          updatedAt: Date.now(),
        };
      });
      saveConversations(updated);
      return updated;
    });

    // Simulated reply
    setTimeout(() => {
      const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.id !== selectedId) return c;
          return {
            ...c,
            messages: [...c.messages, { text: reply, from: 'seller', ts: Date.now() }],
            updatedAt: Date.now(),
          };
        });
        saveConversations(updated);
        return updated;
      });
    }, 1200);
  };

  const sortedConvs = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="page messages-page">
      <Link to="/home" className="back-link">← Volver al marketplace</Link>

      <div className="messages-root">
        {/* Sidebar */}
        <aside className="messages-sidebar card">
          <h2 className="messages-sidebar-title">Mensajes</h2>

          {sortedConvs.length === 0 ? (
            <p className="muted messages-sidebar-empty">
              Aún no tienes conversaciones.<br />Contacta a un vendedor desde un producto.
            </p>
          ) : (
            sortedConvs.map((conv) => {
              const last = conv.messages[conv.messages.length - 1];
              return (
                <button
                  key={conv.id}
                  className={`messages-conv-item ${conv.id === selectedId ? 'messages-conv-item--active' : ''}`}
                  onClick={() => setSelectedId(conv.id)}
                >
                  <div className="messages-conv-avatar">
                    {conv.sellerName[0].toUpperCase()}
                  </div>
                  <div className="messages-conv-info">
                    <p className="messages-conv-name">{conv.sellerName}</p>
                    <p className="messages-conv-preview">
                      {last ? (last.from === 'me' ? `Tú: ${last.text}` : last.text) : conv.productTitle}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </aside>

        {/* Chat panel */}
        <div className="messages-chat card">
          {!selected ? (
            <div className="messages-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p className="muted">Selecciona una conversación</p>
            </div>
          ) : (
            <>
              <div className="messages-chat-header">
                <div className="messages-conv-avatar">{selected.sellerName[0].toUpperCase()}</div>
                <div>
                  <p className="messages-conv-name">{selected.sellerName}</p>
                  {selected.productTitle && (
                    <p className="muted messages-product-ref">
                      Re: {selected.productTitle}
                      {selected.productPrice && ` — $${Number(selected.productPrice).toLocaleString('es-CO')}`}
                    </p>
                  )}
                </div>
              </div>

              <div className="messages-body">
                {selected.messages.length === 0 && (
                  <p className="muted messages-empty">Inicia la conversación.</p>
                )}
                {selected.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`message-bubble ${msg.from === 'me' ? 'message-bubble--sent' : 'message-bubble--received'}`}
                  >
                    <p>{msg.text}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="messages-form" onSubmit={sendMessage}>
                <input
                  className="messages-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  autoFocus
                />
                <button type="submit" className="primary-button messages-send-btn" disabled={!input.trim()}>
                  Enviar
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
