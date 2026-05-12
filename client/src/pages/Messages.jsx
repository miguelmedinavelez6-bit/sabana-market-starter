import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getMessageThread, getMessageThreads, sendMessage } from '../services/api';
import { getStoredUser } from '../utils/auth';

function normalizeThread(thread = {}) {
  return {
    productId: thread.productId,
    productTitle: thread.productTitle || '',
    sellerName: thread.sellerName || 'Vendedor',
    messages: thread.messages || [],
    lastMessage: thread.lastMessage || thread.messages?.[thread.messages.length - 1] || null,
    updatedAt: thread.updatedAt ? new Date(thread.updatedAt).getTime() : 0,
  };
}

export default function Messages() {
  const { state } = useLocation();
  const incomingProduct = state?.product || null;
  const currentUser = getStoredUser();
  const currentUserId = String(currentUser.id || '');

  const [threads, setThreads] = useState([]);
  const [selectedId, setSelectedId] = useState(incomingProduct?.id || null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const selectedThread = useMemo(() => {
    if (selectedId) {
      const existing = threads.find((thread) => thread.productId === selectedId);
      if (existing) return existing;
    }

    if (incomingProduct && String(incomingProduct.id || incomingProduct._id) === String(selectedId)) {
      return normalizeThread({
        productId: String(incomingProduct.id || incomingProduct._id),
        productTitle: incomingProduct.title,
        sellerName: incomingProduct.seller?.fullName || incomingProduct.sellerName || 'Vendedor',
        messages: [],
      });
    }

    return null;
  }, [threads, selectedId, incomingProduct]);

  const loadThreads = async () => {
    try {
      const data = await getMessageThreads();
      const normalized = (data.threads || []).map(normalizeThread);
      setThreads(normalized);
      setError('');
    } catch (err) {
      setError(err.message || 'No fue posible cargar los mensajes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
    const intervalId = window.setInterval(loadThreads, 4000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (incomingProduct?.id || incomingProduct?._id) {
      setSelectedId(String(incomingProduct.id || incomingProduct._id));
    }
  }, [incomingProduct]);

  useEffect(() => {
    if (!selectedId && threads.length > 0) {
      setSelectedId(threads[0].productId);
    }
  }, [threads, selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId, threads]);

  const sendCurrentMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedThread) return;

    const productId = String(selectedThread.productId);
    const payload = {
      text: input.trim(),
      productTitle: selectedThread.productTitle || incomingProduct?.title || '',
      sellerName: selectedThread.sellerName || incomingProduct?.seller?.fullName || incomingProduct?.sellerName || 'Vendedor',
    };

    setInput('');

    try {
      const data = await sendMessage(productId, payload);
      const updated = normalizeThread(data.thread);
      setThreads((prev) => {
        const exists = prev.some((thread) => String(thread.productId) === productId);
        if (!exists) return [updated, ...prev];
        return prev.map((thread) => String(thread.productId) === productId ? updated : thread);
      });
      setSelectedId(productId);
    } catch (err) {
      setError(err.message || 'No fue posible enviar el mensaje');
    }
  };

  const sortedThreads = [...threads].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  return (
    <div className="page messages-page">
      <Link to="/home" className="back-link">← Volver al marketplace</Link>

      <div className="messages-root">
        <aside className="messages-sidebar card">
          <h2 className="messages-sidebar-title">Mensajes</h2>

          {loading ? (
            <p className="muted messages-sidebar-empty">Cargando conversaciones...</p>
          ) : sortedThreads.length === 0 ? (
            <p className="muted messages-sidebar-empty">
              Aún no tienes conversaciones.<br />Contacta a un vendedor desde un producto.
            </p>
          ) : (
            sortedThreads.map((thread) => {
              const last = thread.lastMessage || thread.messages[thread.messages.length - 1];
              return (
                <button
                  key={thread.productId}
                  className={`messages-conv-item ${String(thread.productId) === String(selectedId) ? 'messages-conv-item--active' : ''}`}
                  onClick={() => setSelectedId(String(thread.productId))}
                  type="button"
                >
                  <div className="messages-conv-avatar">
                    {(thread.sellerName || 'V')[0].toUpperCase()}
                  </div>
                  <div className="messages-conv-info">
                    <p className="messages-conv-name">{thread.sellerName || 'Vendedor'}</p>
                    <p className="messages-conv-preview">
                      {last
                        ? (last.senderId === currentUserId ? `Tú: ${last.text}` : last.text)
                        : thread.productTitle || 'Nueva conversación'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </aside>

        <div className="messages-chat card">
          {!selectedThread ? (
            <div className="messages-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p className="muted">Selecciona una conversación</p>
            </div>
          ) : (
            <>
              <div className="messages-chat-header">
                <div className="messages-conv-avatar">
                  {(selectedThread.sellerName || 'V')[0].toUpperCase()}
                </div>
                <div>
                  <p className="messages-conv-name">{selectedThread.sellerName || 'Vendedor'}</p>
                  {selectedThread.productTitle && (
                    <p className="muted messages-product-ref">
                      Re: {selectedThread.productTitle}
                    </p>
                  )}
                </div>
              </div>

              {error && <p className="login-error messages-error">{error}</p>}

              <div className="messages-body">
                {selectedThread.messages.length === 0 && (
                  <p className="muted messages-empty">Inicia la conversación.</p>
                )}
                {selectedThread.messages.map((msg, i) => (
                  <div
                    key={`${msg.ts || i}-${i}`}
                    className={`message-bubble ${msg.senderId === currentUserId ? 'message-bubble--sent' : 'message-bubble--received'}`}
                  >
                    <p>{msg.text}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="messages-form" onSubmit={sendCurrentMessage}>
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
