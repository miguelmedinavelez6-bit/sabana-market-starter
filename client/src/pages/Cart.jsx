import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  const updateQuantity = (id, delta) => {
    const next = cart
      .map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item);
    setCart(next);
    localStorage.setItem('cart', JSON.stringify(next));
  };

  const removeItem = (id) => {
    const next = cart.filter((item) => item.id !== id);
    setCart(next);
    localStorage.setItem('cart', JSON.stringify(next));
  };

  return (
    <div className="page">
      <header className="topbar">
        <h1>Tu Carrito</h1>
        <Link to="/home">Volver al inicio</Link>
      </header>

      {cart.length === 0 ? (
        <div className="card">
          <p>Tu carrito está vacío.</p>
          <Link className="primary-button inline-button" to="/home">Explorar productos</Link>
        </div>
      ) : (
        <div className="product-layout">
          <section>
            {cart.map((item) => (
              <article className="card cart-item" key={item.id}>
                <div>
                  <h3>{item.title}</h3>
                  <p className="muted">Vendido por: {item.sellerName}</p>
                  <p className="price">${item.price.toLocaleString('es-CO')}</p>
                </div>
                <div className="quantity-box">
                  <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                  <button className="link-button" onClick={() => removeItem(item.id)}>Eliminar</button>
                </div>
              </article>
            ))}
          </section>
          <aside className="card summary-card">
            <h3>Resumen de Orden</h3>
            <p>Subtotal ({cart.length} items): <strong>${subtotal.toLocaleString('es-CO')}</strong></p>
            <p>Tarifa de servicio (5%): <strong>${serviceFee.toLocaleString('es-CO')}</strong></p>
            <p>Total a pagar: <strong>${total.toLocaleString('es-CO')}</strong></p>
            <button className="primary-button" onClick={() => navigate('/checkout')}>Proceder al pago</button>
          </aside>
        </div>
      )}
    </div>
  );
}
