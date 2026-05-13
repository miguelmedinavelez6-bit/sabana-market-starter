import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addCartItem, becomeSeller, getCart, getMarketplaceProducts, getNotifications } from '../services/api';
import { clearAuthSession, getRoleLabel, getStoredUser, saveAuthSession } from '../utils/auth';
import { addLocalCartItem, getStoredCartCount, syncCartFromResponse } from '../utils/cart';

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
  const productId = product.id || product._id;

  return (
    <article className="product-card-v2">
      <Link to={`/product/${productId}`} className="pcard-link-area">
        <div className="pcard-img-wrap">
          <img src={product.images[0]} alt={product.title} className="pcard-img" />
          <span className="pcard-cat" style={{ background: cat.bg, color: cat.color }}>
            {product.category}
          </span>
        </div>
        <div className="pcard-body">
          <div className="pcard-meta">
            <span className="pcard-dot" style={{ background: status.color }} />
            <span className="pcard-status" style={{ color: status.color }}>{status.label}</span>
            <Stars value={product.sellerReputation} />
          </div>
          <h3 className="pcard-title">{product.title}</h3>
          <p className="pcard-price">${product.price.toLocaleString('es-CO')}</p>
          <p className="pcard-seller">A. {product.sellerName || product.seller}</p>
        </div>
      </Link>
      <div className="pcard-actions">
        <button type="button" className="pcard-add-btn" onClick={() => onAdd(product)}>
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
  const [conditions, setConditions] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('relevance');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [user, setUser] = useState(getStoredUser());
  const [roleMessage, setRoleMessage] = useState('');
  const [roleError, setRoleError] = useState('');
  const [cartFeedback, setCartFeedback] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [upgradingRole, setUpgradingRole] = useState(false);
  const [cartCount, setCartCount] = useState(() => getStoredCartCount());
  const [notificationCount, setNotificationCount] = useState(0);
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);

  const displayName = user.fullName
    ? user.fullName.split(' ').slice(0, 2).map((w, i) => i === 1 ? w[0] + '.' : w).join(' ')
    : 'Usuario';

  const conditionsKey = useMemo(() => conditions.slice().sort().join(','), [conditions]);
  const hasSearch = search.trim() !== '';
  const hasActiveFilters = category !== 'Todas' || conditions.length > 0 || minPrice !== '' || maxPrice !== '';

  useEffect(() => {
    setPage(1);
  }, [search, category, conditionsKey, minPrice, maxPrice, sort]);

  useEffect(() => {
    getCart()
      .then((data) => {
        const items = syncCartFromResponse(data.cart);
        setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const data = await getNotifications();
        if (!cancelled) {
          setNotificationCount(data.unreadCount ?? (data.notifications || []).filter((item) => !item.read).length);
        }
      } catch {
        if (!cancelled) setNotificationCount(0);
      }
    };

    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      setLoadingProducts(true);
      setProductsError('');

      try {
        const data = await getMarketplaceProducts({
          page,
          limit: 10,
          q: search,
          category,
          status: conditions,
          minPrice,
          maxPrice,
          sort,
        });

        setProducts(data.products || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } catch (err) {
        setProducts([]);
        setTotal(0);
        setPages(1);
        setProductsError(err.message || 'No fue posible cargar los productos');
      } finally {
        setLoadingProducts(false);
      }
    }, search.trim() ? 250 : 0);

    return () => clearTimeout(timeoutId);
  }, [page, search, category, conditions, minPrice, maxPrice, sort]);

  const addToCart = async (product) => {
    const productId = product.id || product._id;
    try {
      const data = await addCartItem(productId, 1);
      const items = syncCartFromResponse(data.cart);
      setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
      setCartFeedback(`${product.title} se agregó al carrito`);
      setTimeout(() => setCartFeedback(''), 2200);
    } catch (err) {
      const fallbackCart = addLocalCartItem(product);
      setCartCount(fallbackCart.items.reduce((sum, item) => sum + item.quantity, 0));
      setCartFeedback('Guardamos el producto en el carrito local mientras se recupera la API.');
      setTimeout(() => setCartFeedback(''), 2600);
    }
  };

  const handleBecomeSeller = async () => {
    setRoleError('');
    setRoleMessage('');
    setUpgradingRole(true);
    try {
      const data = await becomeSeller();
      saveAuthSession(data);
      setUser(data.user);
      setRoleMessage(data.message);
    } catch (err) {
      setRoleError(err.message || 'No fue posible activar el perfil de vendedor');
    } finally {
      setUpgradingRole(false);
    }
  };

  const logout = () => {
    clearAuthSession();
    navigate('/');
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('Todas');
    setConditions([]);
    setMinPrice('');
    setMaxPrice('');
    setSort('relevance');
  };

  const resultLabel = search.trim()
    ? `"${search.trim()}"`
    : category !== 'Todas'
      ? `"${category}"`
      : 'todos los productos';

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
          <Link className="nav-icon-btn" to="/notifications" aria-label="Notificaciones">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {notificationCount > 0 && <span className="nav-badge">{notificationCount}</span>}
          </Link>
          <Link className="nav-icon-btn" to="/messages" aria-label="Mensajes">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </Link>
          <Link className="nav-icon-btn" to="/cart" aria-label="Carrito">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
          </Link>
          <div className="profile-menu-wrap" ref={profileMenuRef}>
            <button
              className="user-pill"
              type="button"
              onClick={() => setProfileMenuOpen((open) => !open)}
            >
              <span className="user-avatar-nav">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.fullName || 'Usuario'} className="user-avatar-nav-image" />
                ) : (
                  displayName[0]
                )}
              </span>
              <span>
                {displayName}
                <span className="user-role-label">{getRoleLabel(user.role)}</span>
              </span>
            </button>

            {profileMenuOpen && (
              <div className="profile-menu card">
                <p className="profile-menu-name">{user.fullName || 'Usuario'}</p>
                <p className="muted profile-menu-email">{user.institutionalEmail}</p>

                <Link
                  className="profile-menu-link"
                  to="/notifications"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  Ver notificaciones
                </Link>
                <Link
                  className="profile-menu-link"
                  to="/profile"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  Ver mi perfil
                </Link>
                {(user.role === 'seller' || user.role === 'admin') && (
                  <Link
                    className="profile-menu-link"
                    to="/seller/dashboard"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    Panel de vendedor
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    className="profile-menu-link"
                    to="/admin/dashboard"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    Panel administrador
                  </Link>
                )}
                <Link
                  className="profile-menu-link"
                  to="/orders"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  Mis pedidos
                </Link>
                <button
                  type="button"
                  className="profile-menu-link profile-menu-link--danger"
                  onClick={logout}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="home-body">
        <section className="hero-banner">
          <div className="hero-text">
            <h1 className="hero-title">El mercado de la comunidad Sabana</h1>
            <p className="hero-sub">
              Compra, vende e intercambia libros, apuntes y más con otros estudiantes en tu campus.
            </p>
            <div className="button-row">
              <button className="hero-cta" type="button">
                Ver ofertas del mes
              </button>
              {(user.role === 'seller' || user.role === 'admin') && (
                <Link className="secondary-button inline-button" to="/seller/dashboard">
                  Ir a mi panel
                </Link>
              )}
              {user.role === 'admin' && (
                <Link className="secondary-button inline-button" to="/admin/dashboard">
                  Ir a moderación
                </Link>
              )}
              {user.role === 'buyer' && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={handleBecomeSeller}
                  disabled={upgradingRole}
                >
                  {upgradingRole ? 'Activando perfil...' : 'Activar perfil vendedor'}
                </button>
              )}
            </div>
            <p className="hero-role-note">
              Rol actual: <strong>{getRoleLabel(user.role)}</strong>
              {user.role === 'seller' && ' · Como vendedor también conservas todas las funciones de comprador.'}
              {user.role === 'admin' && ' · Tu cuenta tiene permisos administrativos institucionales.'}
            </p>
            {roleMessage && <p className="hero-role-note hero-role-note--success">{roleMessage}</p>}
            {roleError && <p className="hero-role-note hero-role-note--error">{roleError}</p>}
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
                  <label key={c.value} className="sidebar-checkbox-label">
                    <input
                      type="checkbox"
                      checked={conditions.includes(c.value)}
                      onChange={() =>
                        setConditions((prev) =>
                          prev.includes(c.value)
                            ? prev.filter((v) => v !== c.value)
                            : [...prev, c.value]
                        )
                      }
                    />
                    {c.label}
                  </label>
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
                <div className="price-filter-row">
                  <span className="price-filter-label">Hasta:</span>
                  <input
                    type="number"
                    className="price-filter-input"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="2000000"
                  />
                </div>
              </div>

              {(hasSearch || hasActiveFilters) && (
                <button type="button" className="secondary-button sidebar-clear-btn" onClick={clearFilters}>
                  Limpiar filtros
                </button>
              )}
            </div>
          </aside>

          <main>
            <div className="results-header">
              <p className="results-text">
                Resultados para <strong>{resultLabel}</strong>
                <span className="results-count"> ({total} encontrados)</span>
              </p>
              <select
                className="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="relevance">Ordenar por: Relevancia</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
              </select>
            </div>

            {loadingProducts ? (
              <div className="card products-feedback">
                <p className="muted">Cargando productos...</p>
              </div>
            ) : productsError ? (
              <div className="card products-feedback">
                <p className="login-error">{productsError}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="card products-feedback">
                <p>No encontramos productos con esos filtros.</p>
              </div>
            ) : (
              <>
                <div className="products-grid">
                  {products.map((product) => (
                    <ProductCard key={product.id || product._id} product={product} onAdd={addToCart} />
                  ))}
                </div>

                {pages > 1 && (
                  <div className="pagination-row">
                    <button
                      type="button"
                      className="secondary-button small-button"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </button>
                    <span className="pagination-label">Página {page} de {pages}</span>
                    <button
                      type="button"
                      className="secondary-button small-button"
                      onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
                      disabled={page === pages}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {cartFeedback && (
        <div className="floating-toast" role="status" aria-live="polite">
          {cartFeedback}
        </div>
      )}
    </div>
  );
}
