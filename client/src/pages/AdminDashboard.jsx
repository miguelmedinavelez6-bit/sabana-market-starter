import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteAdminProduct,
  getAdminDashboard,
  getAdminProducts,
  getAdminReports,
  getAdminUsers,
  updateAdminReport,
  updateAdminUserSuspension,
} from '../services/api';

function MetricCard({ label, value, helper }) {
  return (
    <article className="seller-metric-card">
      <p className="seller-metric-label">{label}</p>
      <p className="seller-metric-value">{value}</p>
      {helper && <p className="seller-metric-helper">{helper}</p>}
    </article>
  );
}

const REPORT_STATUS_META = {
  pending: { label: 'Pendiente', color: '#b45309', bg: '#fef3c7' },
  resolved: { label: 'Resuelto', color: '#15803d', bg: '#dcfce7' },
  dismissed: { label: 'Descartado', color: '#475569', bg: '#e2e8f0' },
};

const ADMIN_PAGE_SIZE = 5;

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [metrics, setMetrics] = useState({
    registeredUsers: 0,
    activeProducts: 0,
    pendingReports: 0,
    suspendedUsers: 0,
  });
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const loadAll = async () => {
    const [dashboardData, usersData, productsData, reportsData] = await Promise.all([
      getAdminDashboard(),
      getAdminUsers(),
      getAdminProducts(),
      getAdminReports(),
    ]);

    setMetrics(dashboardData.metrics || {
      registeredUsers: 0,
      activeProducts: 0,
      pendingReports: 0,
      suspendedUsers: 0,
    });
    setUsers(usersData.users || []);
    setProducts(productsData.products || []);
    setReports(reportsData.reports || []);
  };

  useEffect(() => {
    loadAll()
      .then(() => setError(''))
      .catch((err) => setError(err.message || 'No fue posible cargar el panel administrador'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, statusFilter]);

  const pendingReports = useMemo(
    () => reports.filter((report) => report.status === 'pending').length,
    [reports]
  );

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery = !q || [
        user.fullName,
        user.institutionalEmail,
        user.role,
        user.career,
      ].some((value) => String(value || '').toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && !user.suspended)
        || (statusFilter === 'suspended' && user.suspended);

      return matchesQuery && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery = !q || [
        product.title,
        product.sellerName,
        product.category,
      ].some((value) => String(value || '').toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'reported' && Number(product.pendingReports || 0) > 0)
        || (statusFilter === 'clean' && Number(product.pendingReports || 0) === 0);

      return matchesQuery && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesQuery = !q || [
        report.targetLabel,
        report.reporterName,
        report.reason,
        report.targetType,
      ].some((value) => String(value || '').toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [reports, search, statusFilter]);

  const currentItems = activeTab === 'users'
    ? filteredUsers
    : activeTab === 'products'
      ? filteredProducts
      : filteredReports;

  const totalPages = Math.max(1, Math.ceil(currentItems.length / ADMIN_PAGE_SIZE));
  const visibleItems = currentItems.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleToggleSuspension = async (user) => {
    const suspended = !user.suspended;
    const reason = suspended ? 'Suspendido por moderación del marketplace' : '';

    setBusyKey(`user:${user.id}`);
    setError('');
    setSuccess('');

    try {
      const data = await updateAdminUserSuspension(user.id, { suspended, reason });
      setUsers((prev) => prev.map((entry) => (entry.id === user.id ? data.user : entry)));
      setMetrics((prev) => ({
        ...prev,
        suspendedUsers: suspended
          ? Number(prev.suspendedUsers || 0) + 1
          : Math.max(0, Number(prev.suspendedUsers || 0) - 1),
      }));
      setSuccess(data.message || 'Usuario actualizado correctamente');
    } catch (err) {
      setError(err.message || 'No fue posible actualizar el usuario');
    } finally {
      setBusyKey('');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este producto?')) return;

    setBusyKey(`product:${productId}`);
    setError('');
    setSuccess('');

    try {
      const resolvedPendingForProduct = reports.filter((report) => (
        report.targetType === 'product' && report.targetId === productId && report.status === 'pending'
      )).length;
      const data = await deleteAdminProduct(productId);
      setProducts((prev) => prev.filter((product) => product.id !== productId));
      setReports((prev) => prev.map((report) => (
        report.targetType === 'product' && report.targetId === productId && report.status === 'pending'
          ? {
              ...report,
              status: 'resolved',
              adminNote: 'Producto retirado por administración',
            }
          : report
      )));
      setMetrics((prev) => ({
        ...prev,
        activeProducts: Math.max(0, Number(prev.activeProducts || 0) - 1),
        pendingReports: Math.max(
          0,
          Number(prev.pendingReports || 0) - resolvedPendingForProduct
        ),
      }));
      setSuccess(data.message || 'Producto eliminado correctamente');
    } catch (err) {
      setError(err.message || 'No fue posible eliminar el producto');
    } finally {
      setBusyKey('');
    }
  };

  const handleUpdateReport = async (reportId, status) => {
    setBusyKey(`report:${reportId}:${status}`);
    setError('');
    setSuccess('');

    try {
      const data = await updateAdminReport(reportId, {
        status,
        adminNote: status === 'dismissed'
          ? 'Reporte descartado tras revisión administrativa'
          : 'Reporte revisado y resuelto por administración',
      });

      setReports((prev) => prev.map((report) => (
        report.id === reportId ? data.report : report
      )));
      setMetrics((prev) => ({
        ...prev,
        pendingReports: status === 'pending'
          ? Number(prev.pendingReports || 0)
          : Math.max(0, Number(prev.pendingReports || 0) - 1),
      }));
      setSuccess(data.message || 'Reporte actualizado correctamente');
    } catch (err) {
      setError(err.message || 'No fue posible actualizar el reporte');
    } finally {
      setBusyKey('');
    }
  };

  return (
    <div className="page seller-dashboard-page">
      <Link to="/home" className="back-link">← Volver al marketplace</Link>

      <div className="seller-dashboard-header">
        <div>
          <h1 className="seller-dashboard-title">Panel de administrador</h1>
          <p className="muted seller-dashboard-subtitle">
            Gestiona usuarios, productos activos y reportes del marketplace.
          </p>
        </div>
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

      {loading ? (
        <div className="card">
          <p className="muted">Cargando panel administrador...</p>
        </div>
      ) : (
        <>
          <section className="seller-metrics-grid">
            <MetricCard label="Usuarios" value={metrics.registeredUsers || 0} helper="Cuentas registradas" />
            <MetricCard label="Productos" value={metrics.activeProducts || 0} helper="Publicaciones activas" />
            <MetricCard label="Reportes" value={metrics.pendingReports || pendingReports} helper="Pendientes de revisar" />
            <MetricCard label="Suspendidos" value={metrics.suspendedUsers || 0} helper="Usuarios bajo moderación" />
          </section>

          <div className="seller-tabs">
            <button
              type="button"
              className={`seller-tab-btn ${activeTab === 'users' ? 'seller-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Usuarios
            </button>
            <button
              type="button"
              className={`seller-tab-btn ${activeTab === 'products' ? 'seller-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              Productos
            </button>
            <button
              type="button"
              className={`seller-tab-btn ${activeTab === 'reports' ? 'seller-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Reportes
            </button>
          </div>

          <div className="card admin-toolbar">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                activeTab === 'users'
                  ? 'Buscar usuarios'
                  : activeTab === 'products'
                    ? 'Buscar productos'
                    : 'Buscar reportes'
              }
            />
            <select
              className="seller-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {activeTab === 'users' && (
                <>
                  <option value="all">Todos los usuarios</option>
                  <option value="active">Solo activos</option>
                  <option value="suspended">Solo suspendidos</option>
                </>
              )}
              {activeTab === 'products' && (
                <>
                  <option value="all">Todos los productos</option>
                  <option value="reported">Con reportes pendientes</option>
                  <option value="clean">Sin reportes pendientes</option>
                </>
              )}
              {activeTab === 'reports' && (
                <>
                  <option value="all">Todos los reportes</option>
                  <option value="pending">Pendientes</option>
                  <option value="resolved">Resueltos</option>
                  <option value="dismissed">Descartados</option>
                </>
              )}
            </select>
          </div>

          {activeTab === 'users' && (
            visibleItems.length === 0 ? (
              <div className="card seller-empty-state">
                <p className="muted">No hay usuarios que coincidan con los filtros.</p>
              </div>
            ) : (
              <div className="admin-list">
                {visibleItems.map((user) => (
                  <article key={user.id} className="card admin-row-card">
                    <div className="admin-row-main">
                      <div>
                        <p className="seller-order-id">{user.fullName}</p>
                        <p className="muted">{user.institutionalEmail}</p>
                        <p className="muted">
                          {user.role} · {user.career} · {user.pendingReports || 0} reporte(s) pendiente(s)
                        </p>
                      </div>
                      <span
                        className="seller-order-status"
                        style={{
                          color: user.suspended ? '#b42318' : '#15803d',
                          background: user.suspended ? '#fee4e2' : '#dcfce7',
                        }}
                      >
                        {user.suspended ? 'Suspendido' : 'Activo'}
                      </span>
                    </div>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={busyKey === `user:${user.id}`}
                        onClick={() => handleToggleSuspension(user)}
                      >
                        {busyKey === `user:${user.id}`
                          ? 'Guardando...'
                          : user.suspended
                            ? 'Reactivar'
                            : 'Suspender'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )
          )}

          {activeTab === 'products' && (
            visibleItems.length === 0 ? (
              <div className="card seller-empty-state">
                <p className="muted">No hay productos que coincidan con los filtros.</p>
              </div>
            ) : (
              <div className="admin-list">
                {visibleItems.map((product) => (
                  <article key={product.id} className="card admin-row-card">
                    <div className="admin-row-main">
                      <div>
                        <p className="seller-order-id">{product.title}</p>
                        <p className="muted">
                          {product.sellerName} · {product.category} · ${Number(product.price || 0).toLocaleString('es-CO')}
                        </p>
                        <p className="muted">{product.pendingReports || 0} reporte(s) pendiente(s)</p>
                      </div>
                      <span className="seller-order-status" style={{ color: '#1d4ed8', background: '#dbeafe' }}>
                        {product.statusLabel}
                      </span>
                    </div>
                    <div className="admin-row-actions">
                      <Link to={`/product/${product.id}`} className="secondary-button inline-button">
                        Ver
                      </Link>
                      <button
                        type="button"
                        className="link-button seller-delete-btn"
                        disabled={busyKey === `product:${product.id}`}
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        {busyKey === `product:${product.id}` ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )
          )}

          {activeTab === 'reports' && (
            visibleItems.length === 0 ? (
              <div className="card seller-empty-state">
                <p className="muted">No hay reportes que coincidan con los filtros.</p>
              </div>
            ) : (
              <div className="admin-list">
                {visibleItems.map((report) => {
                  const meta = REPORT_STATUS_META[report.status] || REPORT_STATUS_META.pending;

                  return (
                    <article key={report.id} className="card admin-row-card">
                      <div className="admin-row-main">
                        <div>
                          <p className="seller-order-id">
                            Reporte sobre {report.targetType === 'product' ? 'producto' : 'perfil'}: {report.targetLabel}
                          </p>
                          <p className="muted">Motivo: {report.reason}</p>
                          {report.details && <p className="muted">{report.details}</p>}
                          <p className="muted">
                            Reportado por {report.reporterName} · {new Date(report.createdAt).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                        <span className="seller-order-status" style={{ color: meta.color, background: meta.bg }}>
                          {meta.label}
                        </span>
                      </div>
                      {report.status === 'pending' && (
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="primary-button"
                            disabled={busyKey === `report:${report.id}:resolved`}
                            onClick={() => handleUpdateReport(report.id, 'resolved')}
                          >
                            {busyKey === `report:${report.id}:resolved` ? 'Resolviendo...' : 'Resolver'}
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={busyKey === `report:${report.id}:dismissed`}
                            onClick={() => handleUpdateReport(report.id, 'dismissed')}
                          >
                            {busyKey === `report:${report.id}:dismissed` ? 'Descartando...' : 'Descartar'}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )
          )}

          {currentItems.length > ADMIN_PAGE_SIZE && (
            <div className="pagination-controls">
              <button
                type="button"
                className="secondary-button"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Anterior
              </button>
              <span className="muted">Página {page} de {totalPages}</span>
              <button
                type="button"
                className="secondary-button"
                disabled={page === totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
