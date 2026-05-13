import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getProducts, getPublicSellerProfile, submitReport } from '../services/api';
import { getStoredUser } from '../utils/auth';

export default function SellerProfile() {
  const { id } = useParams();
  const { state } = useLocation();
  const currentUser = getStoredUser();
  const [products, setProducts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Comportamiento inapropiado');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSaving, setReportSaving] = useState(false);
  const [reportMessage, setReportMessage] = useState('');

  const seller = useMemo(() => {
    if (state?.seller) return state.seller;
    return {
      id,
      fullName: decodeURIComponent(id || 'Vendedor'),
      reputation: 4.8,
    };
  }, [id, state]);

  useEffect(() => {
    getPublicSellerProfile(id)
      .then((data) => {
        setProfile(data.user || null);
        setProducts(data.products || []);
        setError('');
      })
      .catch(() => {
        getProducts({ page: 1, limit: 100 })
          .then((data) => {
            const sellerProducts = (data.products || []).filter(
              (product) => product.sellerName === seller.fullName
            );
            setProducts(sellerProducts);
            setProfile({
              id,
              fullName: seller.fullName,
              reputation: seller.reputation || 4.8,
              photoUrl: '',
              verified: true,
            });
            setError('');
          })
          .catch((err) => {
            setProducts([]);
            setError(err.message || 'No fue posible cargar el perfil del vendedor');
          });
      });
  }, [id, seller.fullName, seller.reputation]);

  const featuredProduct = products[0]
    ? {
        ...products[0],
        seller: profile || seller,
        sellerId: profile?.id || seller.id || encodeURIComponent(seller.fullName || 'Vendedor'),
        sellerName: profile?.fullName || seller.fullName || products[0].sellerName || 'Vendedor',
      }
    : null;

  const displaySeller = profile || seller;

  const handleReportSeller = async (event) => {
    event.preventDefault();
    if (!profile?.id) return;

    setReportSaving(true);
    setReportMessage('');

    try {
      const data = await submitReport({
        targetType: 'user',
        targetId: profile.id,
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

  return (
    <div className="page">
      <Link to="/home" className="back-link">← Volver al marketplace</Link>

      <div className="card seller-profile-card">
        {error && <p className="login-error">{error}</p>}
        <div className="seller-profile-header">
          <div className="seller-profile-avatar">
            {displaySeller.photoUrl ? (
              <img src={displaySeller.photoUrl} alt={displaySeller.fullName || 'Vendedor'} className="seller-profile-avatar-image" />
            ) : (
              displaySeller.fullName?.[0] || 'V'
            )}
          </div>
          <div>
            <h2>{displaySeller.fullName || 'Vendedor'}</h2>
            <p className="muted">Vendedor de la comunidad universitaria</p>
            <p className="muted">
              {displaySeller.career || 'Comunidad Unisabana'} · {displaySeller.verified ? 'Vendedor verificado' : 'Verificación pendiente'}
            </p>
          </div>
        </div>

        <div className="seller-profile-stats">
          <div className="seller-stat">
            <span className="seller-stat-value">{Number(displaySeller.reputation || 4.8).toFixed(1)}</span>
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
          {featuredProduct ? (
            <Link
              to="/messages"
              state={{ product: featuredProduct }}
              className="primary-button"
              style={{ textDecoration: 'none', textAlign: 'center' }}
            >
              Enviar mensaje
            </Link>
          ) : (
            <button type="button" className="secondary-button" disabled>
              Sin productos para chatear
            </button>
          )}
          {profile?.id && String(profile.id) !== String(currentUser.id || '') && (
            <button type="button" className="secondary-button" onClick={() => setReportOpen((open) => !open)}>
              {reportOpen ? 'Cancelar reporte' : 'Reportar perfil'}
            </button>
          )}
        </div>

        {reportMessage && (
          <p className={reportMessage.includes('correctamente') ? 'success-note' : 'login-error'}>
            {reportMessage}
          </p>
        )}

        {reportOpen && (
          <form className="report-form" onSubmit={handleReportSeller}>
            <label>
              Motivo
              <select
                className="seller-select"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option>Comportamiento inapropiado</option>
                <option>Posible fraude</option>
                <option>Suplantación de identidad</option>
                <option>Incumplimiento reiterado</option>
              </select>
            </label>
            <label>
              Detalles
              <textarea
                className="seller-textarea"
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe lo ocurrido"
              />
            </label>
            <div className="button-row">
              <button type="submit" className="primary-button" disabled={reportSaving}>
                {reportSaving ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
