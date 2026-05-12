import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { deleteCartItem, getCart, updateCartItem } from '../services/api';
import { buildLocalCartSnapshot, deleteLocalCartItem, syncCartFromResponse, updateLocalCartQuantity } from '../utils/cart';

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], subtotal: 0, serviceFee: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const showNotice = (message) => {
    setNotice(message);
    window.clearTimeout(showNotice._timer);
    showNotice._timer = window.setTimeout(() => setNotice(''), 2400);
  };

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
          showNotice('Te mostramos la copia local del carrito para que no pierdas tus productos.');
        } else {
          setError(err.message || 'No fue posible cargar el carrito');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const updateQuantity = async (productId, delta) => {
    const currentItem = cart.items.find((item) => item.productId === productId);
    if (!currentItem) return;

    const nextQuantity = Math.max(1, currentItem.quantity + delta);

    try {
      const data = await updateCartItem(productId, nextQuantity);
      setCart(data.cart);
      syncCartFromResponse(data.cart);
    } catch (err) {
      const localCart = updateLocalCartQuantity(productId, nextQuantity);
      setCart(localCart);
      showNotice('Actualizamos la cantidad en tu carrito.');
    }
  };

  const removeItem = async (productId) => {
    const confirmed = window.confirm('¿Seguro que deseas eliminar este producto del carrito?');
    if (!confirmed) return;

    try {
      const data = await deleteCartItem(productId);
      setCart(data.cart);
      syncCartFromResponse(data.cart);
      showNotice('Producto eliminado del carrito.');
    } catch (err) {
      const localCart = deleteLocalCartItem(productId);
      setCart(localCart);
      showNotice('Producto eliminado del carrito.');
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <h1>Tu Carrito</h1>
        <Link to="/home">Volver al inicio</Link>
      </header>

      {loading ? (
        <div className="card products-feedback">
          <p className="muted">Cargando carrito...</p>
        </div>
      ) : error ? (
        <div className="card products-feedback">
          <p className="login-error">{error}</p>
        </div>
      ) : cart.items.length === 0 ? (
        <div className="card">
          <p>Tu carrito está vacío.</p>
          <Link className="primary-button inline-button" to="/home">Explorar productos</Link>
        </div>
      ) : (
        <div className="product-layout">
          <section>
            {cart.items.map((item) => (
              <article className="card cart-item" key={item.productId}>
                <div>
                  <h3>{item.title}</h3>
                  <p className="muted">Vendido por: {item.sellerName}</p>
                  <p className="price">${item.price.toLocaleString('es-CO')}</p>
                </div>
                <div className="quantity-box">
                  <button type="button" onClick={() => updateQuantity(item.productId, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.productId, 1)}>+</button>
                  <button type="button" className="link-button" onClick={() => removeItem(item.productId)}>Eliminar</button>
                </div>
              </article>
            ))}
          </section>
          <aside className="card summary-card">
            <h3>Resumen de Orden</h3>
            <p>Subtotal ({cart.items.length} items): <strong>${cart.subtotal.toLocaleString('es-CO')}</strong></p>
            <p>Tarifa de servicio (5%): <strong>${cart.serviceFee.toLocaleString('es-CO')}</strong></p>
            <p>Total a pagar: <strong>${cart.total.toLocaleString('es-CO')}</strong></p>
            <button className="primary-button" onClick={() => navigate('/checkout')}>Proceder al pago</button>
          </aside>
        </div>
      )}

      {notice && (
        <div className="floating-toast floating-toast--cart" role="status" aria-live="polite">
          {notice}
        </div>
      )}
    </div>
  );
}
