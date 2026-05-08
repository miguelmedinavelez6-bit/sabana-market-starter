import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProductById } from '../services/api';

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
  const navigate = useNavigate();

  useEffect(() => {
    getProductById(id).then((data) => setProduct(data.product));
  }, [id]);

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex((item) => item.id === product.id || item._id === product._id);
    if (idx >= 0) {
      cart[idx].quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    navigate('/cart');
  };

  const contactSeller = () => {
    navigate('/messages', { state: { product } });
  };

  if (!product) return <div className="page"><p>Cargando...</p></div>;

  const cat = CATEGORY_COLORS[product.category] || { bg: '#f3f4f6', color: '#6b7280' };
  const seller = product.seller || {};

  return (
    <div className="page">
      <Link to="/home" className="back-link">← Volver al marketplace</Link>

      <div className="product-layout">
        <section className="card">
          <div className="pdetail-badges">
            <span className="pcard-cat" style={{ background: cat.bg, color: cat.color }}>
              {product.category}
            </span>
            <span className="product-tag">{product.statusLabel}</span>
          </div>

          <h1>{product.title}</h1>
          <p className="price">${product.price.toLocaleString('es-CO')}</p>
          <p>{product.description}</p>

          <div className="button-row">
            <button className="primary-button" onClick={addToCart}>Agregar al carrito</button>
            <button className="secondary-button" onClick={contactSeller}>Contactar al vendedor</button>
          </div>
        </section>

        <aside className="card seller-card">
          <h3>Información del vendedor</h3>
          <p><strong>{seller.fullName}</strong></p>
          <Stars value={seller.reputation} />
          <p className="muted">Miembro desde 2022</p>
          <Link to={`/seller/${seller.id}`} className="text-link-bold seller-profile-link">
            Ver perfil completo →
          </Link>
        </aside>
      </div>
    </div>
  );
}
