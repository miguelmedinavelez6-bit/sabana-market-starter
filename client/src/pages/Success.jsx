import { Link } from 'react-router-dom';

export default function Success() {
  const order = JSON.parse(localStorage.getItem('lastOrder') || '{}');

  return (
    <div className="page center-page">
      <div className="card auth-card">
        <h1>¡Compra exitosa!</h1>
        <p>Tu orden #{order.id} ha sido procesada correctamente.</p>
        <p>Estado de la orden: <strong>{order.status}</strong></p>
        <div className="button-row centered">
          <Link className="primary-button inline-button" to="/orders">Ver Mis Pedidos</Link>
          <Link className="secondary-button inline-button" to="/home">Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}
