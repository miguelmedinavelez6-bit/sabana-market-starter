import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addCartItem, getProductById } from '../services/api';
import { syncCartFromResponse } from '../utils/cart';

const CATEGORY_COLORS = {
  'Electrónica': { bg: '#dbeafe', color: '#1d4ed8' },
  'Libros':      { bg: '#dcfce7', color: '#15803d' },
  'Apuntes':     { bg: '#fef9c3', color: '#92400e' },
  'Accesorios':  { bg: '#ffedd5', color: '#c2410c' },
  'Ropa':        { bg: '#f3e8ff', color: '#7e22ce' },
};

function Stars({ value }) {
  const rounded = Math.round(value);
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= rounded ? '#f59e0b' : '#d1d5db' }}>★</span>
      ))}
      <span className="stars-value">{value}</span>
    </span>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError('');

    getProductById(id)
      .then((data) => setProduct(data.product))
      .catch((err) => {
        setProduct(null);
        setError(err.message || 'No fue posible cargar el producto');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = async () => {
    try {
      const data = await addCartItem(product.id || product._id, 1);
      syncCartFromResponse(data.cart);
      navigate('/cart');
    } catch (err) {
      setCartMessage(err.message || 'No fue posible agregar el producto al carrito');
    }
  };

  const contactSeller = () => {
    navigate('/messages', { state: { product } });
  };

  if (loading) {
    return (
      <div className="page">
        <Link to="/home" className="back-link">← Volver al marketplace</Link>
        <div className="card products-feedback">
          <p className="muted">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page">
        <Link to="/home" className="back-link">← Volver al marketplace</Link>
        <div className="card products-feedback">
          <p className="login-error">{error || 'Producto no encontrado'}</p>
        </div>
      </div>
    );
  }

  const cat = CATEGORY_COLORS[product.category] || { bg: '#f3f4f6', color: '#6b7280' };
  const seller = product.seller || {};

  return (
    <div className="page">
      <Link to="/home" className="back-link">← Volver al marketplace</Link>

      <div className="product-layout">
        <section className="card">
          {product.images?.[0] && (
            <div className="product-detail-media">
              <img
                src={product.images[0]}
                alt={product.title}
                className="product-detail-image"
              />
            </div>
          )}

          <div className="pdetail-badges">
            <span className="pcard-cat" style={{ background: cat.bg, color: cat.color }}>
              {product.category}
            </span>
            <span className="product-tag">{product.statusLabel}</span>
          </div>

          <h1>{product.title}</h1>
          <p className="price">${product.price.toLocaleString('es-CO')}</p>
          <p className="product-detail-description">{product.description}</p>

          <div className="button-row">
            <button className="primary-button" onClick={addToCart}>Agregar al carrito</button>
            <button className="secondary-button" onClick={contactSeller}>Contactar al vendedor</button>
          </div>
          {cartMessage && <p className="login-error">{cartMessage}</p>}
        </section>

        <aside className="card seller-card">
          <h3>Información del vendedor</h3>
          <p><strong>{seller.fullName}</strong></p>
          <Stars value={seller.reputation} />
          <p className="muted">Miembro desde 2022</p>
          <Link
            to={`/seller/${seller.id}`}
            state={{ seller }}
            className="text-link-bold seller-profile-link"
          >
            Ver perfil completo →
          </Link>
        </aside>
      </div>
    </div>
  );
}
