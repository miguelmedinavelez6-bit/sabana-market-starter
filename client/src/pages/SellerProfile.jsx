import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getProducts } from '../services/api';

export default function SellerProfile() {
  const { id } = useParams();
  const { state } = useLocation();
  const [products, setProducts] = useState([]);

  const seller = useMemo(() => {
    if (state?.seller) return state.seller;
    return {
      id,
      fullName: decodeURIComponent(id || 'Vendedor'),
      reputation: 4.8,
    };
  }, [id, state]);

  useEffect(() => {
    getProducts({ page: 1, limit: 100 })
      .then((data) => {
        const sellerProducts = (data.products || []).filter(
          (product) => product.sellerName === seller.fullName
        );
        setProducts(sellerProducts);
      })
      .catch(() => setProducts([]));
  }, [seller.fullName]);

  return (
    <div className="page">
      <Link to="/home" className="back-link">← Volver al marketplace</Link>

      <div className="card seller-profile-card">
        <div className="seller-profile-header">
          <div className="seller-profile-avatar">{seller.fullName?.[0] || 'V'}</div>
          <div>
            <h2>{seller.fullName || 'Vendedor'}</h2>
            <p className="muted">Vendedor de la comunidad universitaria</p>
            <p className="muted">Miembro desde 2022 · Vendedor verificado</p>
          </div>
        </div>

        <div className="seller-profile-stats">
          <div className="seller-stat">
            <span className="seller-stat-value">{Number(seller.reputation || 4.8).toFixed(1)}</span>
            <span className="seller-stat-label">Reputación</span>
          </div>
          <div className="seller-stat">
            <span className="seller-stat-value">{products.length}</span>
            <span className="seller-stat-label">Productos</span>
          </div>
          <div className="seller-stat">
            <span className="seller-stat-value">98%</span>
            <span className="seller-stat-label">Respuesta</span>
          </div>
        </div>

        {products.length > 0 && (
          <div className="stack">
            <h3>Publicaciones activas</h3>
            {products.slice(0, 3).map((product) => (
              <Link
                key={product.id || product._id}
                to={`/product/${product.id || product._id}`}
                className="text-link-bold"
              >
                {product.title}
              </Link>
            ))}
          </div>
        )}

        <div className="button-row">
          <Link
            to="/messages"
            state={{ product: { id: seller.id, title: 'Consulta general', seller, price: null } }}
            className="primary-button"
            style={{ textDecoration: 'none', textAlign: 'center' }}
          >
            Enviar mensaje
          </Link>
        </div>
      </div>
    </div>
  );
}
