import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts } from '../services/api';

const CATEGORY_COLORS = {
  'Electrónica': { bg: '#dbeafe', color: '#1d4ed8' },
  'Libros':      { bg: '#dcfce7', color: '#15803d' },
  'Apuntes':     { bg: '#fef9c3', color: '#92400e' },
  'Accesorios':  { bg: '#ffedd5', color: '#c2410c' },
  'Ropa':        { bg: '#f3e8ff', color: '#7e22ce' },
};

const STATUS_MAP = {
  new:     { label: 'NUEVO',   color: '#16a34a' },
  used:    { label: 'USADO',   color: '#ea580c' },
  digital: { label: 'DIGITAL', color: '#2563eb' },
};

const CATEGORIES = ['Todas', 'Libros', 'Electrónica', 'Apuntes', 'Accesorios', 'Ropa'];
const CONDITIONS = [
  { value: 'new',     label: 'Nuevo' },
  { value: 'used',    label: 'Usado' },
  { value: 'digital', label: 'Digital' },
];

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

function ProductCard({ product, onAdd }) {
  const cat = CATEGORY_COLORS[product.category] || { bg: '#f3f4f6', color: '#6b7280' };
  const status = STATUS_MAP[product.status] || { label: product.statusLabel, color: '#6b7280' };

  return (
    <article className="product-card-v2">
      <Link to={`/product/${product.id}`} className="pcard-img-wrap">
        <img src={product.images[0]} alt={product.title} className="pcard-img" />
        <span className="pcard-cat" style={{ background: cat.bg, color: cat.color }}>
          {product.category}
        </span>
      </Link>
      <div className="pcard-body">
        <div className="pcard-meta">
          <span className="pcard-dot" style={{ background: status.color }} />
          <span className="pcard-status" style={{ color: status.color }}>{status.label}</span>
          <Stars value={product.sellerReputation} />
        </div>
        <h3 className="pcard-title">{product.title}</h3>
        <p className="pcard-price">${product.price.toLocaleString('es-CO')}</p>
        <p className="pcard-seller">A. {product.sellerName}</p>
        <button className="pcard-add-btn" onClick={() => onAdd(product)}>
          Agregar al carrito
        </button>
      </div>
    </article>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [condition, setCondition] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [cartCount, setCartCount] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('cart') || '[]');
    return saved.reduce((sum, item) => sum + item.quantity, 0);
  });
  const navigate = useNavigate();

  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const displayName = user.fullName
    ? user.fullName.split(' ').slice(0, 2).map((w, i) => i === 1 ? w[0] + '.' : w).join(' ')
    : 'Usuario';

  useEffect(() => {
    getProducts().then((data) => setProducts(data.products || []));
  }, []);

  const filtered = useMemo(() => products.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.category.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== 'Todas' && p.category !== category) return false;
    if (condition && p.status !== condition) return false;
    if (minPrice && p.price < Number(minPrice)) return false;
    return true;
  }), [products, search, category, condition, minPrice]);

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex((i) => i.id === product.id);
    if (idx >= 0) {
      cart[idx].quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    setCartCount(cart.reduce((sum, i) => sum + i.quantity, 0));
  };

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="home-root">
      <nav className="navbar">
        <div className="navbar-brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a227" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          Sabana Market
        </div>

        <div className="navbar-search-wrap">
          <svg className="search-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="navbar-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar libros, apuntes, electrónica..."
          />
        </div>

        <div className="navbar-actions">
          <button className="nav-icon-btn" aria-label="Notificaciones">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="nav-badge">1</span>
          </button>
          <button className="nav-icon-btn" aria-label="Mensajes">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="nav-badge">1</span>
          </button>
          <Link className="nav-icon-btn" to="/cart" aria-label="Carrito">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
          </Link>
          <button className="user-pill" onClick={logout}>
            <span className="user-avatar-nav">{displayName[0]}</span>
            {displayName}
          </button>
        </div>
      </nav>

      <div className="home-body">
        <section className="hero-banner">
          <div className="hero-text">
            <h1 className="hero-title">El mercado de la comunidad Sabana</h1>
            <p className="hero-sub">
              Compra, vende e intercambia libros, apuntes y más con otros estudiantes en tu campus.
            </p>
            <button className="hero-cta">Ver ofertas del mes</button>
          </div>
        </section>

        <div className="home-layout">
          <aside>
            <div className="card sidebar-card">
              <h3 className="sidebar-heading">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
                Filtros
              </h3>

              <div className="sidebar-section">
                <p className="sidebar-label">CATEGORÍAS</p>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`sidebar-item ${category === cat ? 'sidebar-item--active' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="sidebar-section">
                <p className="sidebar-label">CONDICIÓN</p>
                {CONDITIONS.map((c) => (
                  <button
                    key={c.value}
                    className={`sidebar-item ${condition === c.value ? 'sidebar-item--active' : ''}`}
                    onClick={() => setCondition(condition === c.value ? '' : c.value)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="sidebar-section">
                <p className="sidebar-label">PRECIO</p>
                <div className="price-filter-row">
                  <span className="price-filter-label">De:</span>
                  <input
                    type="number"
                    className="price-filter-input"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </aside>

          <main>
            <div className="results-header">
              <p className="results-text">
                Resultados para <strong>"{category}"</strong>
                <span className="results-count"> ({filtered.length} encontrados)</span>
              </p>
              <select className="sort-select">
                <option>Ordenar por: Relevancia</option>
                <option>Precio: menor a mayor</option>
                <option>Precio: mayor a menor</option>
              </select>
            </div>

            <div className="products-grid">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
