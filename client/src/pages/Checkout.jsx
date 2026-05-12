import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createOrder, getCart } from '../services/api';
import { buildLocalCartSnapshot, clearStoredCart, syncCartFromResponse } from '../utils/cart';

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], subtotal: 0, serviceFee: 0, total: 0 });
  const [cartLoading, setCartLoading] = useState(true);

  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    getCart()
      .then((data) => {
        setCart(data.cart);
        syncCartFromResponse(data.cart);
      })
      .catch((err) => {
        const localCart = buildLocalCartSnapshot();
        if (localCart.items.length > 0) {
          setCart(localCart);
          setNotice('La API del carrito no respondió; usaremos la copia local para este checkout simulado.');
        } else {
          setError(err.message || 'No fue posible cargar el carrito');
        }
      })
      .finally(() => setCartLoading(false));
  }, []);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.items.length === 0) return;
    setError('');
    setLoading(true);
    try {
      const data = await createOrder({ cart, cardHolderName, cardNumber, expirationDate, cvc });
      clearStoredCart();
      localStorage.setItem('lastOrder', JSON.stringify(data.order));
      navigate('/success');
    } catch (err) {
      setError(err.message || 'No fue posible procesar la compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <Link to="/cart" className="back-link">← Volver al carrito</Link>

      <div className="product-layout">
        <section className="card">
          <h1 className="checkout-title">Pago simulado</h1>

          <div className="checkout-warning">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a4b00" strokeWidth="2" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Esto es una simulación. No ingreses datos reales de tu tarjeta.</span>
          </div>

          <form onSubmit={handleCheckout} noValidate>
            <div className="form">
              <div className="field-group">
                <label className="field-label" htmlFor="cardHolder">Nombre en la tarjeta</label>
                <input
                  id="cardHolder"
                  className="field-input checkout-plain-input"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  placeholder="Nombre Apellido"
                  required
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="cardNumber">Número de tarjeta</label>
                <input
                  id="cardNumber"
                  className="field-input checkout-plain-input"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  required
                />
              </div>

              <div className="two-columns">
                <div className="field-group">
                  <label className="field-label" htmlFor="expDate">Fecha de expiración</label>
                  <input
                    id="expDate"
                    className="field-input checkout-plain-input"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    placeholder="MM/AA"
                    maxLength={5}
                    required
                  />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="cvc">CVC</label>
                  <input
                    id="cvc"
                    className="field-input checkout-plain-input"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              {error && <p className="login-error">{error}</p>}
            </div>
          </form>
        </section>

        <aside className="card summary-card">
          <h3 className="checkout-summary-title">Resumen de orden</h3>

          {cartLoading ? (
            <p className="muted">Cargando carrito...</p>
          ) : (
            <>
              {notice && <p className="warning">{notice}</p>}
              <div className="checkout-items">
                {cart.items.map((item) => (
                  <div key={item.productId} className="checkout-item-row">
                    <span className="checkout-item-name">{item.title}</span>
                    <span className="checkout-item-price">
                      ${(item.price * item.quantity).toLocaleString('es-CO')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="checkout-totals">
            <div className="checkout-total-row">
              <span>Subtotal</span>
              <span>${cart.subtotal.toLocaleString('es-CO')}</span>
            </div>
            <div className="checkout-total-row muted">
              <span>Tarifa de servicio (5%)</span>
              <span>${cart.serviceFee.toLocaleString('es-CO')}</span>
            </div>
            <div className="checkout-total-row checkout-total-final">
              <span>Total a pagar</span>
              <span>${cart.total.toLocaleString('es-CO')}</span>
            </div>
          </div>

          <button
            className="primary-button checkout-pay-btn"
            onClick={handleCheckout}
            disabled={loading || cartLoading || cart.items.length === 0}
          >
            {loading ? 'Procesando...' : 'Confirmar y pagar'}
          </button>

          {!cartLoading && cart.items.length === 0 && (
            <p className="muted checkout-empty-note">Tu carrito está vacío.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
