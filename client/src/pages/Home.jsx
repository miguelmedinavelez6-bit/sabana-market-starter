import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/api';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');

  useEffect(() => {
    async function load() {
      const data = await getProducts();
      setProducts(data.products || []);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.title.toLowerCase().includes(search.toLowerCase()) || product.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'Todas' || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  const categories = ['Todas', 'Libros', 'Electrónica', 'Apuntes', 'Accesorios', 'Ropa'];

  return (
    <div className="page">
      <header className="topbar">
        <h2>Sabana Market</h2>
        <div className="top-links">
          <Link to="/orders">Mis pedidos</Link>
          <Link to="/cart">Carrito</Link>
        </div>
      </header>

      <section className="hero card">
        <h1>El mercado de la comunidad Sabana</h1>
        <p>Compra, vende e intercambia libros, apuntes y más con otros estudiantes en tu campus.</p>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar libros, apuntes, electrónica..."
        />
        <div className="category-row">
          {categories.map((item) => (
            <button
              key={item}
              className={item === category ? 'chip active-chip' : 'chip'}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="section-header">
          <h3>Resultados ({filtered.length})</h3>
        </div>
        <div className="grid">
          {filtered.map((product) => (
            <article className="card product-card" key={product.id}>
              <div className="product-tag">{product.statusLabel}</div>
              <h3>{product.title}</h3>
              <p className="price">${product.price.toLocaleString('es-CO')}</p>
              <p className="muted">{product.sellerName}</p>
              <div className="product-actions">
                <Link className="secondary-button small-button" to={`/product/${product.id}`}>
                  Ver detalle
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
