import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyReceivedReviews, getUserProfile, updateUserProfile } from '../services/api';
import {
  clearAuthSession,
  getRoleLabel,
  getStoredToken,
  getStoredUser,
  saveAuthSession,
} from '../utils/auth';

export default function Profile() {
  const storedUser = getStoredUser();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('products');
  const [utilityPanel, setUtilityPanel] = useState('');
  const [profile, setProfile] = useState({
    user: {
      fullName: storedUser.fullName || 'Usuario',
      institutionalEmail: storedUser.institutionalEmail || '',
      career: storedUser.career || '',
      reputation: Number(storedUser.reputation || 5),
      verified: storedUser.verified ?? true,
      role: storedUser.role || 'buyer',
    },
    products: [],
    stats: {
      productsCount: 0,
      reviewsCount: 0,
    },
  });
  const [reviews, setReviews] = useState([]);
  const [reviewsMeta, setReviewsMeta] = useState({
    total: 0,
    reputation: Number(storedUser.reputation || 5),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileForm, setProfileForm] = useState({
    career: storedUser.career || '',
    photoUrl: storedUser.photoUrl || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([getUserProfile(), getMyReceivedReviews()])
      .then(([profileData, reviewsData]) => {
        if (cancelled) return;

        setProfile({
          user: profileData.user || profile.user,
          products: profileData.products || [],
          stats: profileData.stats || { productsCount: 0, reviewsCount: 0 },
        });
        setReviews(reviewsData.reviews || []);
        setReviewsMeta({
          total: reviewsData.total || 0,
          reputation: Number(reviewsData.reputation || profileData.user?.reputation || 5),
        });
        setProfileForm({
          career: profileData.user?.career || '',
          photoUrl: profileData.user?.photoUrl || '',
        });

        const token = getStoredToken();
        if (token && profileData.user) {
          saveAuthSession({
            token,
            user: {
              ...storedUser,
              ...profileData.user,
            },
          });
        }

        setError('');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'No fue posible cargar tu perfil');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const fullName = profile.user.fullName || 'Usuario';
  const roleLabel = getRoleLabel(profile.user.role);

  const reputationLabel = useMemo(
    () => Number(reviewsMeta.reputation || profile.user.reputation || 5).toFixed(1),
    [reviewsMeta.reputation, profile.user.reputation]
  );

  const logout = () => {
    clearAuthSession();
    navigate('/');
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setError('');
    setSuccess('');

    try {
      const data = await updateUserProfile(profileForm);
      setProfile((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          ...data.user,
        },
      }));

      const token = getStoredToken();
      if (token) {
        saveAuthSession({
          token,
          user: {
            ...getStoredUser(),
            ...data.user,
          },
        });
      }

      setSuccess(data.message || 'Perfil actualizado correctamente');
    } catch (err) {
      setError(err.message || 'No fue posible actualizar tu perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderStars = (value) => {
    const rounded = Math.round(Number(value || 0));

    return (
      <span className="profile-stars" aria-label={`Reputación ${value} de 5`}>
        {[1, 2, 3, 4, 5].map((item) => (
          <span key={item} style={{ color: item <= rounded ? '#f59e0b' : '#d1d5db' }}>★</span>
        ))}
      </span>
    );
  };

  return (
    <div className="page profile-page">
      <Link to="/home" className="back-link">← Volver al marketplace</Link>

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
        <div className="card account-card">
          <p className="muted">Cargando perfil...</p>
        </div>
      ) : (
        <div className="profile-layout">
          <section className="card profile-main-card">
            <div className="account-header">
              <div className="account-avatar">
                {profile.user.photoUrl ? (
                  <img src={profile.user.photoUrl} alt={fullName} className="account-avatar-image" />
                ) : (
                  fullName[0]?.toUpperCase() || 'U'
                )}
              </div>
              <div>
                <h1 className="account-title">{fullName}</h1>
                <p className="muted account-subtitle">{profile.user.institutionalEmail || 'Sin correo registrado'}</p>
                <p className="muted account-subtitle">{profile.user.career || 'Comunidad Unisabana'}</p>
              </div>
            </div>

            <div className="profile-badges-row">
              <div className="account-role-badge">{roleLabel}</div>
              <div className={`profile-verified-badge ${profile.user.verified ? 'profile-verified-badge--ok' : ''}`}>
                {profile.user.verified ? 'Cuenta verificada' : 'Verificación pendiente'}
              </div>
            </div>

            <div className="profile-reputation-card">
              <div>
                <p className="profile-section-eyebrow">REPUTACIÓN</p>
                <div className="profile-reputation-row">
                  <span className="profile-reputation-value">{reputationLabel}</span>
                  {renderStars(reputationLabel)}
                </div>
              </div>
              <p className="muted profile-reputation-meta">
                Basado en {reviewsMeta.total || profile.stats.reviewsCount || 0} reseña{(reviewsMeta.total || profile.stats.reviewsCount || 0) !== 1 ? 's' : ''} recibida{(reviewsMeta.total || profile.stats.reviewsCount || 0) !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="profile-stats-grid">
              <div className="profile-stat-box">
                <span className="profile-stat-value">{profile.stats.productsCount || profile.products.length}</span>
                <span className="profile-stat-label">Mis productos</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-value">{reviewsMeta.total}</span>
                <span className="profile-stat-label">Reseñas recibidas</span>
              </div>
            </div>

            <form className="profile-photo-form" onSubmit={handleProfileUpdate}>
              <div className="profile-photo-form-header">
                <div>
                  <p className="profile-section-eyebrow">FOTO DE PERFIL</p>
                  <p className="muted">Agrega una URL de imagen para personalizar tu cuenta.</p>
                </div>
              </div>
              <div className="two-columns">
                <label>
                  Carrera
                  <input
                    value={profileForm.career}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, career: e.target.value }))}
                    placeholder="Tu carrera"
                  />
                </label>
                <label>
                  URL de foto
                  <input
                    value={profileForm.photoUrl}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, photoUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </label>
              </div>
              <div className="button-row">
                <button type="submit" className="secondary-button" disabled={savingProfile}>
                  {savingProfile ? 'Guardando...' : 'Guardar perfil'}
                </button>
              </div>
            </form>

            <div className="profile-tabs">
              <button
                type="button"
                className={`profile-tab-btn ${activeTab === 'products' ? 'profile-tab-btn--active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                Mis productos
              </button>
              <button
                type="button"
                className={`profile-tab-btn ${activeTab === 'reviews' ? 'profile-tab-btn--active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reseñas recibidas
              </button>
            </div>

            {activeTab === 'products' ? (
              profile.products.length === 0 ? (
                <div className="profile-empty-state">
                  <p className="muted">Todavía no tienes productos publicados.</p>
                  <Link className="secondary-button inline-button" to="/home">Explorar marketplace</Link>
                </div>
              ) : (
                <div className="profile-products-list">
                  {profile.products.map((product) => (
                    <Link key={product.id} to={`/product/${product.id}`} className="profile-product-card">
                      {product.image ? (
                        <img src={product.image} alt={product.title} className="profile-product-image" />
                      ) : (
                        <div className="profile-product-image profile-product-image--placeholder" />
                      )}
                      <div className="profile-product-content">
                        <div className="profile-product-topline">
                          <span className="profile-product-category">{product.category}</span>
                          <span className="profile-product-status">{product.statusLabel}</span>
                        </div>
                        <h3 className="profile-product-title">{product.title}</h3>
                        <p className="profile-product-price">${Number(product.price || 0).toLocaleString('es-CO')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              reviews.length === 0 ? (
                <div className="profile-empty-state">
                  <p className="muted">Aún no has recibido reseñas.</p>
                </div>
              ) : (
                <div className="profile-reviews-list">
                  {reviews.map((review) => (
                    <article key={review.id} className="profile-review-card">
                      <div className="profile-review-header">
                        <div>
                          <p className="profile-review-author">{review.reviewerName || 'Usuario'}</p>
                          <p className="muted profile-review-date">{formatDate(review.createdAt)}</p>
                        </div>
                        <div className="profile-review-rating">
                          {renderStars(review.rating)}
                          <span>{Number(review.rating || 0).toFixed(1)}</span>
                        </div>
                      </div>
                      {review.productTitles?.length > 0 && (
                        <p className="muted profile-review-products">
                          Sobre: {review.productTitles.join(', ')}
                        </p>
                      )}
                      <p className="profile-review-comment">{review.comment || 'Sin comentario adicional.'}</p>
                    </article>
                  ))}
                </div>
              )
            )}
          </section>

          <aside className="profile-side-stack">
            <div className="card">
              <h2 className="profile-side-title">Acciones</h2>
              <div className="stack">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setUtilityPanel(utilityPanel === 'privacy' ? '' : 'privacy')}
                >
                  Privacidad
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setUtilityPanel(utilityPanel === 'help' ? '' : 'help')}
                >
                  Ayuda
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={logout}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>

            {utilityPanel === 'privacy' && (
              <div className="card profile-info-card">
                <h3>Privacidad</h3>
                <p className="muted">
                  Tu correo institucional solo se usa para autenticación y verificación dentro del marketplace.
                </p>
              </div>
            )}

            {utilityPanel === 'help' && (
              <div className="card profile-info-card">
                <h3>Ayuda</h3>
                <p className="muted">
                  Si necesitas soporte, contáctanos desde el canal institucional del marketplace o revisa tus mensajes y notificaciones.
                </p>
              </div>
            )}

            <div className="card profile-shortcuts-card">
              <h3 className="profile-side-title">Atajos</h3>
              <div className="stack">
                {(profile.user.role === 'seller' || profile.user.role === 'admin') && (
                  <Link className="secondary-button inline-button" to="/seller/dashboard">Panel de vendedor</Link>
                )}
                {profile.user.role === 'admin' && (
                  <Link className="secondary-button inline-button" to="/admin/dashboard">Panel administrador</Link>
                )}
                <Link className="secondary-button inline-button" to="/orders">Ver Mis Pedidos</Link>
                <Link className="secondary-button inline-button" to="/notifications">Ver Notificaciones</Link>
                <Link className="secondary-button inline-button" to="/messages">Ir a Mensajes</Link>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
