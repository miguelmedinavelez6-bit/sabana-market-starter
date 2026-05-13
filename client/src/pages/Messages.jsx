import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createConversation, getConversations, sendConversationMessage } from '../services/api';
import { getStoredUser } from '../utils/auth';

function normalizeMessage(message = {}) {
  return {
    id: message.id || message._id || `${message.senderId || 'msg'}-${message.createdAt || message.ts || Date.now()}`,
    senderId: String(message.senderId || ''),
    senderName: message.senderName || 'Usuario',
    senderRole: message.senderRole || 'buyer',
    content: message.content || message.text || '',
    createdAt: message.createdAt || message.ts || new Date().toISOString(),
  };
}

function normalizeConversation(conversation = {}) {
  const messages = (conversation.messages || []).map(normalizeMessage);
  const lastMessage = conversation.lastMessage
    ? normalizeMessage(conversation.lastMessage)
    : messages[messages.length - 1] || null;

  return {
    id: String(conversation.id || conversation._id || ''),
    productId: String(conversation.productId || ''),
    productTitle: conversation.productTitle || '',
    productImage: conversation.productImage || '',
    sellerId: String(conversation.sellerId || ''),
    sellerName: conversation.sellerName || 'Vendedor',
    buyerId: String(conversation.buyerId || ''),
    buyerName: conversation.buyerName || 'Comprador',
    messages,
    lastMessage,
    updatedAt: conversation.updatedAt ? new Date(conversation.updatedAt).getTime() : 0,
    isDraft: false,
  };
}

function getCounterpartName(conversation, currentUser) {
  const currentUserId = String(currentUser.id || '');
  const currentUserName = currentUser.fullName || '';
  const isSellerView = (
    String(conversation.sellerId || '') === currentUserId
    || String(conversation.sellerName || '') === currentUserName
  );

  return isSellerView
    ? (conversation.buyerName || 'Comprador')
    : (conversation.sellerName || 'Vendedor');
}

export default function Messages() {
  const { state } = useLocation();
  const incomingProduct = state?.product || null;
  const currentUser = getStoredUser();
  const currentUserId = String(currentUser.id || '');
  const currentUserName = currentUser.fullName || 'Usuario';

  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const draftConversation = useMemo(() => {
    const productId = String(incomingProduct?.id || incomingProduct?._id || '');
    if (!productId) return null;

    const sellerName = incomingProduct?.sellerName || incomingProduct?.seller?.fullName || 'Vendedor';
    const sellerId = String(
      incomingProduct?.sellerId
      || incomingProduct?.seller?.id
      || encodeURIComponent(sellerName)
    );

    return {
      id: `draft:${productId}:${sellerId}`,
      productId,
      productTitle: incomingProduct?.title || 'Producto',
      productImage: incomingProduct?.productImage || incomingProduct?.images?.[0] || '',
      sellerId,
      sellerName,
      buyerId: currentUserId,
      buyerName: currentUserName,
      messages: [],
      lastMessage: null,
      updatedAt: 0,
      isDraft: true,
    };
  }, [incomingProduct, currentUserId, currentUserName]);

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      const normalized = (data.conversations || []).map(normalizeConversation);
      setConversations(normalized);
      setError('');

      setSelectedId((currentSelected) => {
        if (currentSelected && normalized.some((conversation) => conversation.id === currentSelected)) {
          return currentSelected;
        }

        if (draftConversation) {
          const existing = normalized.find((conversation) => (
            conversation.productId === draftConversation.productId
            && conversation.sellerId === draftConversation.sellerId
            && conversation.buyerId === currentUserId
          ));

          if (existing) return existing.id;
          if (currentSelected?.startsWith('draft:')) return currentSelected;
          return draftConversation.id;
        }

        return normalized[0]?.id || null;
      });
    } catch (err) {
      setError(err.message || 'No fue posible cargar los mensajes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    const intervalId = window.setInterval(loadConversations, 4000);
    return () => window.clearInterval(intervalId);
  }, [draftConversation, currentUserId]);

  useEffect(() => {
    if (!selectedId) {
      if (draftConversation) {
        setSelectedId(draftConversation.id);
      } else if (conversations.length > 0) {
        setSelectedId(conversations[0].id);
      }
    }
  }, [conversations, selectedId, draftConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId, conversations]);

  const selectedConversation = useMemo(() => {
    if (selectedId?.startsWith('draft:')) {
      return draftConversation;
    }

    return conversations.find((conversation) => conversation.id === selectedId) || null;
  }, [selectedId, conversations, draftConversation]);

  const sortedConversations = useMemo(
    () => [...conversations].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
    [conversations]
  );

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedConversations;

    return sortedConversations.filter((conversation) => {
      const preview = conversation.lastMessage?.content || '';
      return [
        conversation.sellerName,
        conversation.buyerName,
        conversation.productTitle,
        preview,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [search, sortedConversations]);

  const sendCurrentMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedConversation || sending) return;

    const content = input.trim();
    setInput('');
    setSending(true);
    setError('');

    try {
      const data = selectedConversation.isDraft
        ? await createConversation({
            productId: selectedConversation.productId,
            sellerId: selectedConversation.sellerId,
            content,
          })
        : await sendConversationMessage(selectedConversation.id, { content });

      const updated = normalizeConversation(data.conversation);
      setConversations((prev) => {
        const others = prev.filter((conversation) => conversation.id !== updated.id);
        return [updated, ...others];
      });
      setSelectedId(updated.id);
    } catch (err) {
      setError(err.message || 'No fue posible enviar el mensaje');
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const formatConversationTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="page messages-page">
      <Link to="/home" className="back-link">← Volver al marketplace</Link>

      <div className="messages-root">
        <aside className="messages-sidebar card">
          <h2 className="messages-sidebar-title">Mensajes</h2>
          <div className="messages-search-wrap">
            <input
              className="messages-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversaciones"
            />
          </div>

          {loading ? (
            <p className="muted messages-sidebar-empty">Cargando conversaciones...</p>
          ) : filteredConversations.length === 0 && !draftConversation ? (
            <p className="muted messages-sidebar-empty">
              {search.trim()
                ? 'No encontramos conversaciones con ese término.'
                : 'Aún no tienes conversaciones.\nContacta a un vendedor desde un producto.'}
            </p>
          ) : (
            <>
              {draftConversation && selectedId?.startsWith('draft:') && (
                <button
                  className="messages-conv-item messages-conv-item--active"
                  type="button"
                  onClick={() => setSelectedId(draftConversation.id)}
                >
                  <div className="messages-conv-avatar">
                    {(draftConversation.sellerName || 'V')[0].toUpperCase()}
                  </div>
                  <div className="messages-conv-info">
                    <div className="messages-conv-row">
                      <p className="messages-conv-name">{draftConversation.sellerName}</p>
                      <span className="messages-conv-time">Nuevo</span>
                    </div>
                    <p className="messages-conv-product">{draftConversation.productTitle}</p>
                    <p className="messages-conv-preview">Empieza esta conversación</p>
                  </div>
                </button>
              )}

              {filteredConversations.map((conversation) => {
                const last = conversation.lastMessage || conversation.messages[conversation.messages.length - 1];
                const counterpartName = getCounterpartName(conversation, currentUser);

                return (
                  <button
                    key={conversation.id}
                    className={`messages-conv-item ${conversation.id === selectedId ? 'messages-conv-item--active' : ''}`}
                    onClick={() => setSelectedId(conversation.id)}
                    type="button"
                  >
                    <div className="messages-conv-avatar">
                      {counterpartName[0].toUpperCase()}
                    </div>
                    <div className="messages-conv-info">
                      <div className="messages-conv-row">
                        <p className="messages-conv-name">{counterpartName}</p>
                        <span className="messages-conv-time">
                          {formatConversationTime(last?.createdAt || conversation.updatedAt)}
                        </span>
                      </div>
                      <p className="messages-conv-product">{conversation.productTitle || 'Producto sin título'}</p>
                      <p className="messages-conv-preview">
                        {last
                          ? (last.senderId === currentUserId ? `Tú: ${last.content}` : last.content)
                          : 'Nueva conversación'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </aside>

        <div className="messages-chat card">
          {!selectedConversation ? (
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
                  {(getCounterpartName(selectedConversation, currentUser) || 'V')[0].toUpperCase()}
                </div>
                <div>
                  <p className="messages-conv-name">{getCounterpartName(selectedConversation, currentUser)}</p>
                  {selectedConversation.productTitle && (
                    <p className="muted messages-product-ref">
                      Producto: {selectedConversation.productTitle}
                    </p>
                  )}
                </div>
              </div>

              {error && <p className="login-error messages-error">{error}</p>}

              <div className="messages-body">
                {selectedConversation.messages.length === 0 && (
                  <p className="muted messages-empty">Inicia la conversación.</p>
                )}
                {selectedConversation.messages.map((msg, i) => (
                  <div
                    key={`${msg.id || i}-${i}`}
                    className={`message-bubble ${msg.senderId === currentUserId ? 'message-bubble--sent' : 'message-bubble--received'}`}
                  >
                    <p>{msg.content}</p>
                    <span className="message-time">
                      {formatConversationTime(msg.createdAt)}
                    </span>
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
                <button type="submit" className="primary-button messages-send-btn" disabled={!input.trim() || sending}>
                  {sending ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
