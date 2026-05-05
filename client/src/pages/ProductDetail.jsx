import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProductById } from '../services/api';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const data = await getProductById(id);
      setProduct(data.product);
    }
    load();
  }, [id]);

  const addToCart = () => {
    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingIndex = currentCart.findIndex((item) => item.id === product.id);

    if (existingIndex >= 0) {
      currentCart[existingIndex].quantity += 1;
    } else {
      currentCart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(currentCart));
    navigate('/cart');
  };

  if (!product) return <div className="page"><p>Cargando...</p></div>;

  return (
    <div className="page">
      <Link to="/home" className="back-link">← Volver al marketplace</Link>
      <div className="product-layout">
        <section className="card">
          <div className="product-tag">{product.statusLabel}</div>
          <h1>{product.title}</h1>
          <p className="price">${product.price.toLocaleString('es-CO')}</p>
          <p>{product.description}</p>
          <div className="button-row">
            <button className="primary-button" onClick={addToCart}>Agregar al carrito</button>
            <button className="secondary-button">Contactar al vendedor</button>
          </div>
        </section>
        <aside className="card seller-card">
          <h3>Información del vendedor</h3>
          <p><strong>{product.sellerName}</strong></p>
          <p className="muted">Reputación: {product.sellerReputation}</p>
          <p className="muted">Miembro desde 2022</p>
        </aside>
      </div>
    </div>
  );
}
