import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../services/api';

export default function Checkout() {
  const navigate = useNavigate();
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [loading, setLoading] = useState(false);

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const data = await createOrder({
        userId: user.id || '1',
        items: cart,
        total,
      });
      localStorage.removeItem('cart');
      localStorage.setItem('lastOrder', JSON.stringify(data.order));
      navigate('/success');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="product-layout">
        <section className="card">
          <h1>Checkout (Simulado)</h1>
          <p className="warning">Esto es una simulación para la demostración. No ingreses datos reales de tu tarjeta.</p>
          <div className="form">
            <label>Nombre en la tarjeta<input defaultValue="Sofía R." /></label>
            <label>Número de tarjeta<input defaultValue="0000 0000 0000 0000" /></label>
            <div className="two-columns">
              <label>Fecha Exp.<input defaultValue="12/28" /></label>
              <label>CVC<input defaultValue="123" /></label>
            </div>
          </div>
        </section>
        <aside className="card summary-card">
          <h3>Resumen de Orden</h3>
          <p>Subtotal ({cart.length} items): <strong>${subtotal.toLocaleString('es-CO')}</strong></p>
          <p>Tarifa de servicio (5%): <strong>${serviceFee.toLocaleString('es-CO')}</strong></p>
          <p>Total a pagar: <strong>${total.toLocaleString('es-CO')}</strong></p>
          <button className="primary-button" onClick={handleCheckout} disabled={loading || cart.length === 0}>
            {loading ? 'Procesando...' : 'Confirmar y pagar'}
          </button>
        </aside>
      </div>
    </div>
  );
}
