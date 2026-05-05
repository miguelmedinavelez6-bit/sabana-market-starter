import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrdersHistory } from '../services/api';

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function loadOrders() {
      const data = await getOrdersHistory();
      setOrders(data.orders || []);
    }
    loadOrders();
  }, []);

  return (
    <div className="page">
      <header className="topbar">
        <h1>Mis Pedidos</h1>
        <Link to="/home">Volver al inicio</Link>
      </header>
      <div className="stack">
        {orders.map((order) => (
          <article className="card" key={order.id}>
            <h3>{order.id}</h3>
            <p>Estado: <strong>{order.status}</strong></p>
            <p>Total: <strong>${order.total.toLocaleString('es-CO')}</strong></p>
            <p className="muted">Fecha: {new Date(order.createdAt).toLocaleString('es-CO')}</p>
          </article>
        ))}
        {orders.length === 0 && <div className="card"><p>No tienes pedidos todavía.</p></div>}
      </div>
    </div>
  );
}
