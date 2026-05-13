import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteMyProduct,
  getMyProducts,
  getSellerDashboard,
  getSellerOrders,
  publishProduct,
  updateMyProduct,
  updateSellerOrderStatus,
} from '../services/api';

const CATEGORY_OPTIONS = ['Libros', 'Electrónica', 'Apuntes', 'Accesorios', 'Ropa'];
const STATUS_OPTIONS = [
  { value: 'new', label: 'Nuevo' },
  { value: 'used', label: 'Usado' },
  { value: 'digital', label: 'Digital' },
];

const STATUS_BADGES = {
  pending: { label: 'Pendiente', color: '#b45309', bg: '#fef3c7' },
  confirmed: { label: 'Confirmado', color: '#1d4ed8', bg: '#dbeafe' },
  processing: { label: 'En proceso', color: '#7c3aed', bg: '#ede9fe' },
  delivered: { label: 'Entregado', color: '#15803d', bg: '#dcfce7' },
};

const NEXT_ORDER_ACTIONS = {
  pending: { status: 'confirmed', label: 'Confirmar pedido' },
  confirmed: { status: 'processing', label: 'Marcar en proceso' },
  processing: { status: 'delivered', label: 'Marcar entregada' },
};

const initialForm = {
  title: '',
  description: '',
  category: 'Libros',
  status: 'used',
  price: '',
  imageUrl: '',
};

function MetricCard({ label, value, helper }) {
  return (
    <article className="seller-metric-card">
      <p className="seller-metric-label">{label}</p>
      <p className="seller-metric-value">{value}</p>
      {helper && <p className="seller-metric-helper">{helper}</p>}
    </article>
  );
}

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingProductId, setEditingProductId] = useState('');
  const [metrics, setMetrics] = useState({
    monthlySales: 0,
    activeProducts: 0,
    pendingOrders: 0,
    reputation: 5,
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [success, setSuccess] = useState('');

  const loadDashboard = async () => {
    const [dashboardData, productsData, ordersData] = await Promise.all([
      getSellerDashboard(),
      getMyProducts(),
      getSellerOrders(),
    ]);

    setMetrics(dashboardData.metrics || {
      monthlySales: 0,
      activeProducts: 0,
      pendingOrders: 0,
      reputation: 5,
    });
    setProducts(productsData.products || []);
    setOrders(ordersData.orders || []);
  };

  useEffect(() => {
    loadDashboard()
      .then(() => setError(''))
      .catch((err) => setError(err.message || 'No fue posible cargar el panel de vendedor'))
      .finally(() => setLoading(false));
  }, []);

  const formattedMonthlySales = useMemo(
    () => `$${Number(metrics.monthlySales || 0).toLocaleString('es-CO')}`,
    [metrics.monthlySales]
  );

  const formattedReputation = useMemo(
    () => Number(metrics.reputation || 5).toFixed(1),
    [metrics.reputation]
  );

  const formMode = editingProductId ? 'edit' : 'create';

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetFormState = () => {
    setForm(initialForm);
    setEditingProductId('');
    setShowPublishForm(false);
  };

  const openCreateForm = () => {
    setEditingProductId('');
    setForm(initialForm);
    setShowPublishForm(true);
    setSuccess('');
    setError('');
  };

  const openEditForm = (product) => {
    setEditingProductId(product.id);
    setForm({
      title: product.title || '',
      description: product.description || '',
      category: product.category || 'Libros',
      status: product.status || 'used',
      price: String(product.price || ''),
      imageUrl: product.images?.[0] || product.image || '',
    });
    setShowPublishForm(true);
    setSuccess('');
    setError('');
    setActiveTab('products');
  };

  const handlePublishProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        status: form.status,
        price: Number(form.price),
        images: form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
      };

      const data = formMode === 'create'
        ? await publishProduct(payload)
        : await updateMyProduct(editingProductId, payload);

      const savedProduct = data.product;
      setProducts((prev) => {
        if (formMode === 'create') return [savedProduct, ...prev];
        return prev.map((product) => product.id === savedProduct.id ? savedProduct : product);
      });
      if (formMode === 'create') {
        setMetrics((prev) => ({
          ...prev,
          activeProducts: Number(prev.activeProducts || 0) + 1,
        }));
      }
      resetFormState();
      setSuccess(data.message || (formMode === 'create' ? 'Producto publicado correctamente' : 'Producto actualizado correctamente'));
      setActiveTab('products');
    } catch (err) {
      setError(err.message || (formMode === 'create' ? 'No fue posible publicar el producto' : 'No fue posible actualizar el producto'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este producto?')) return;

    setError('');
    setSuccess('');

    try {
      const data = await deleteMyProduct(productId);
      setProducts((prev) => prev.filter((product) => product.id !== productId));
      setMetrics((prev) => ({
        ...prev,
        activeProducts: Math.max(0, Number(prev.activeProducts || 0) - 1),
      }));
      if (editingProductId === productId) {
        resetFormState();
      }
      setSuccess(data.message || 'Producto eliminado correctamente');
    } catch (err) {
      setError(err.message || 'No fue posible eliminar el producto');
    }
  };

  const handleAdvanceOrderStatus = async (order) => {
    const nextAction = NEXT_ORDER_ACTIONS[order.status];
    if (!nextAction) return;

    setUpdatingOrderId(order.id);
    setError('');
    setSuccess('');

    try {
      const data = await updateSellerOrderStatus(order.id, nextAction.status);
      const updatedOrder = data.order;

      setOrders((prev) => {
        const nextOrders = prev.map((entry) => (
          entry.id === updatedOrder.id ? updatedOrder : entry
        ));

        setMetrics((current) => ({
          ...current,
          pendingOrders: nextOrders.filter((entry) => entry.status === 'pending').length,
        }));

        return nextOrders;
      });
      setSuccess(data.message || 'Estado de la orden actualizado correctamente');
    } catch (err) {
      setError(err.message || 'No fue posible actualizar el estado de la orden');
    } finally {
      setUpdatingOrderId('');
    }
  };

  const formatDate = (value) => new Date(value).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="page seller-dashboard-page">
      <Link to="/home" className="back-link">← Volver al marketplace</Link>

      <div className="seller-dashboard-header">
        <div>
          <h1 className="seller-dashboard-title">Panel de vendedor</h1>
          <p className="muted seller-dashboard-subtitle">
            Revisa tus métricas, administra tus productos y consulta las órdenes recibidas.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            if (showPublishForm && formMode === 'create') {
              resetFormState();
            } else {
              openCreateForm();
            }
          }}
        >
          {showPublishForm && formMode === 'create' ? 'Cerrar formulario' : 'Publicar producto'}
        </button>
      </div>

      {error && (
        <div className="card products-feedback">
          <p className="login-error">{error}</p>
        </div>
      )}

      {success && (
        <div className="card products-feedback">
          <p className="success-note">{success}</p>
        </div>
      )}

      {showPublishForm && (
        <form className="card seller-publish-form" onSubmit={handlePublishProduct}>
          <div className="seller-publish-header">
            <h2>{formMode === 'create' ? 'Publicar producto' : 'Editar producto'}</h2>
            <p className="muted">
              {formMode === 'create'
                ? 'Completa la información básica para crear una nueva publicación.'
                : 'Actualiza la información de tu producto.'}
            </p>
          </div>

          <div className="two-columns">
            <label>
              Título
              <input
                value={form.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="Ej. Calculadora gráfica"
                required
              />
            </label>
            <label>
              Precio
              <input
                type="number"
                min="1"
                value={form.price}
                onChange={(e) => handleFormChange('price', e.target.value)}
                placeholder="65000"
                required
              />
            </label>
            <label>
              Categoría
              <select
                className="seller-select"
                value={form.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              Estado
              <select
                className="seller-select"
                value={form.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            URL de imagen
            <input
              value={form.imageUrl}
              onChange={(e) => handleFormChange('imageUrl', e.target.value)}
              placeholder="https://..."
            />
          </label>

          <label>
            Descripción
            <textarea
              className="seller-textarea"
              rows={4}
              value={form.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Describe el producto, su estado y lo que incluye."
              required
            />
          </label>

          <div className="button-row">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving
                ? (formMode === 'create' ? 'Publicando...' : 'Guardando...')
                : (formMode === 'create' ? 'Publicar producto' : 'Guardar cambios')}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                resetFormState();
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="card">
          <p className="muted">Cargando panel...</p>
        </div>
      ) : (
        <>
          <section className="seller-metrics-grid">
            <MetricCard label="Ventas del mes" value={formattedMonthlySales} helper="Ingresos de tus órdenes del mes actual" />
            <MetricCard label="Productos activos" value={metrics.activeProducts || 0} helper="Publicaciones visibles en tu panel" />
            <MetricCard label="Órdenes pendientes" value={metrics.pendingOrders || 0} helper="Pedidos que aún requieren seguimiento" />
            <MetricCard label="Reputación" value={formattedReputation} helper="Promedio de reseñas recibidas" />
          </section>

          <div className="seller-tabs">
            <button
              type="button"
              className={`seller-tab-btn ${activeTab === 'products' ? 'seller-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              Mis productos
            </button>
            <button
              type="button"
              className={`seller-tab-btn ${activeTab === 'orders' ? 'seller-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              Órdenes recibidas
            </button>
          </div>

          {activeTab === 'products' ? (
            products.length === 0 ? (
              <div className="card seller-empty-state">
                <p className="muted">Aún no tienes productos activos.</p>
                <button type="button" className="primary-button" onClick={openCreateForm}>
                  Publicar mi primer producto
                </button>
              </div>
            ) : (
              <div className="seller-products-grid">
                {products.map((product) => (
                  <article key={product.id} className="seller-product-card card">
                    <img src={product.images?.[0] || product.image} alt={product.title} className="seller-product-image" />
                    <div className="seller-product-body">
                      <div className="seller-product-tags">
                        <span className="seller-product-tag">{product.category}</span>
                        <span className="seller-product-tag seller-product-tag--muted">{product.statusLabel}</span>
                      </div>
                      <h3 className="seller-product-title">{product.title}</h3>
                      <p className="seller-product-price">${Number(product.price || 0).toLocaleString('es-CO')}</p>
                      <div className="seller-product-actions">
                        <Link to={`/product/${product.id}`} className="secondary-button inline-button seller-action-link">
                          Ver
                        </Link>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => openEditForm(product)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="link-button seller-delete-btn"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : (
            orders.length === 0 ? (
              <div className="card seller-empty-state">
                <p className="muted">No has recibido órdenes todavía.</p>
              </div>
            ) : (
              <div className="seller-orders-list">
                {orders.map((order) => {
                  const status = STATUS_BADGES[order.status] || STATUS_BADGES.pending;
                  const overallStatus = STATUS_BADGES[order.overallStatus] || status;
                  const nextAction = NEXT_ORDER_ACTIONS[order.status];

                  return (
                    <article key={order.id} className="card seller-order-card">
                      <div className="seller-order-header">
                        <div>
                          <p className="seller-order-id">Orden #{order.id}</p>
                          <p className="muted seller-order-date">{formatDate(order.createdAt)}</p>
                        </div>
                        <span className="seller-order-status" style={{ color: status.color, background: status.bg }}>
                          {status.label}
                        </span>
                      </div>

                      <div className="seller-order-meta">
                        <p className="muted">
                          Comprador: <strong>{order.buyer?.fullName || 'Comprador'}</strong>
                        </p>
                        {order.buyer?.institutionalEmail && (
                          <p className="muted">{order.buyer.institutionalEmail}</p>
                        )}
                        {order.overallStatus && order.overallStatus !== order.status && (
                          <p className="muted seller-order-progress-note">
                            Estado general del pedido:{' '}
                            <strong style={{ color: overallStatus.color }}>
                              {overallStatus.label}
                            </strong>
                          </p>
                        )}
                      </div>

                      <div className="seller-order-items">
                        {order.items.map((item) => (
                          <div key={`${order.id}-${item.productId || item.title}`} className="seller-order-item">
                            <span>{item.title}</span>
                            <span>x{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="seller-order-footer">
                        <span className="muted">Subtotal para ti</span>
                        <strong>${Number(order.subtotal || 0).toLocaleString('es-CO')}</strong>
                      </div>

                      {nextAction && (
                        <div className="seller-order-actions">
                          <button
                            type="button"
                            className="primary-button"
                            disabled={updatingOrderId === order.id}
                            onClick={() => handleAdvanceOrderStatus(order)}
                          >
                            {updatingOrderId === order.id ? 'Actualizando...' : nextAction.label}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
