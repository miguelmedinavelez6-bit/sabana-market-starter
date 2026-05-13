import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addCartItem, getProductById, submitReport } from '../services/api';
import { addLocalCartItem, syncCartFromResponse } from '../utils/cart';

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
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Información engañosa');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSaving, setReportSaving] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
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
      addLocalCartItem(product);
      setCartMessage('La API del carrito no respondió; guardamos el producto localmente para que puedas continuar.');
      navigate('/cart');
    }
  };

  const contactSeller = () => {
    navigate('/messages', {
      state: {
        product: {
          ...product,
          sellerId: product.seller?.id || product.sellerId || encodeURIComponent(product.sellerName || product.seller?.fullName || 'Vendedor'),
          sellerName: product.sellerName || product.seller?.fullName || 'Vendedor',
          productImage: product.images?.[0] || '',
        },
      },
    });
  };

  const handleReportProduct = async (event) => {
    event.preventDefault();
    setReportSaving(true);
    setReportMessage('');

    try {
      const data = await submitReport({
        targetType: 'product',
        targetId: product.id || product._id,
        reason: reportReason,
        details: reportDetails,
      });
      setReportMessage(data.message || 'Reporte enviado correctamente');
      setReportDetails('');
      setReportOpen(false);
    } catch (err) {
      setReportMessage(err.message || 'No fue posible enviar el reporte');
    } finally {
      setReportSaving(false);
    }
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
            <button className="secondary-button" onClick={() => setReportOpen((open) => !open)}>
              {reportOpen ? 'Cancelar reporte' : 'Reportar producto'}
            </button>
          </div>
          {cartMessage && <p className="login-error">{cartMessage}</p>}
          {reportMessage && <p className={reportMessage.includes('correctamente') ? 'success-note' : 'login-error'}>{reportMessage}</p>}
          {reportOpen && (
            <form className="report-form" onSubmit={handleReportProduct}>
              <label>
                Motivo
                <select
                  className="seller-select"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                >
                  <option>Información engañosa</option>
                  <option>Contenido inapropiado</option>
                  <option>Posible fraude</option>
                  <option>Producto prohibido</option>
                </select>
              </label>
              <label>
                Detalles
                <textarea
                  className="seller-textarea"
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Cuéntanos por qué estás reportando este producto"
                />
              </label>
              <div className="button-row">
                <button type="submit" className="primary-button" disabled={reportSaving}>
                  {reportSaving ? 'Enviando...' : 'Enviar reporte'}
                </button>
              </div>
            </form>
          )}
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
