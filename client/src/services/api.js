import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

async function handleResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  let data;

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    const looksLikeHtml = text.trim().startsWith('<');
    throw new Error(
      looksLikeHtml
        ? 'La API devolvió HTML en lugar de JSON. Revisa el despliegue del backend o la variable VITE_API_URL.'
        : text || 'Request failed'
    );
  }

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export async function loginUser(payload) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function registerUser(payload) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function getMicrosoftAuthUrl({ state, redirectUri }) {
  const searchParams = new URLSearchParams();
  if (state) searchParams.set('state', state);
  if (redirectUri) searchParams.set('redirectUri', redirectUri);

  const response = await fetch(`${API_URL}/auth/microsoft/url?${searchParams.toString()}`);
  return handleResponse(response);
}

export async function exchangeMicrosoftCode({ code, redirectUri }) {
  const response = await fetch(`${API_URL}/auth/microsoft/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri }),
  });
  return handleResponse(response);
}

export async function getUserProfile() {
  const response = await fetch(`${API_URL}/users/profile`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function updateUserProfile(payload) {
  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function getPublicSellerProfile(userId) {
  const response = await fetch(`${API_URL}/users/public/${encodeURIComponent(userId)}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getMyReceivedReviews() {
  const response = await fetch(`${API_URL}/reviews/mine`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function becomeSeller() {
  const response = await fetch(`${API_URL}/auth/become-seller`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
  });
  return handleResponse(response);
}

export async function getProducts(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  const response = await fetch(`${API_URL}/products${query ? `?${query}` : ''}`);
  return handleResponse(response);
}

export async function getMarketplaceProducts(params = {}) {
  const {
    page = 1,
    limit = 10,
    q = '',
    category = 'Todas',
    status = [],
    minPrice = '',
    maxPrice = '',
    sort = 'relevance',
  } = params;

  const trimmedQuery = q.trim();
  const hasSearch = Boolean(trimmedQuery);
  const hasFilters = category !== 'Todas' || status.length > 0 || minPrice !== '' || maxPrice !== '';

  let path = '/products';
  if (hasSearch && !hasFilters) path = '/products/search';
  if (hasFilters) path = '/products/filter';

  const searchParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort,
  });

  if (hasSearch) searchParams.set('q', trimmedQuery);
  if (category !== 'Todas') searchParams.set('category', category);
  if (status.length) searchParams.set('status', status.join(','));
  if (minPrice !== '') searchParams.set('minPrice', String(minPrice));
  if (maxPrice !== '') searchParams.set('maxPrice', String(maxPrice));

  const response = await fetch(`${API_URL}${path}?${searchParams.toString()}`);
  return handleResponse(response);
}

export async function getMyProducts() {
  const response = await fetch(`${API_URL}/products/mine`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function publishProduct(payload) {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function updateMyProduct(productId, payload) {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function deleteMyProduct(productId) {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getProductById(id) {
  const response = await fetch(`${API_URL}/products/${id}`);
  return handleResponse(response);
}

export async function getCart() {
  const response = await fetch(`${API_URL}/cart`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function addCartItem(productId, quantity = 1) {
  const response = await fetch(`${API_URL}/cart/items`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ productId, quantity }),
  });
  return handleResponse(response);
}

export async function updateCartItem(productId, quantity) {
  const response = await fetch(`${API_URL}/cart/items/${productId}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ quantity }),
  });
  return handleResponse(response);
}

export async function deleteCartItem(productId) {
  const response = await fetch(`${API_URL}/cart/items/${productId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function clearCart() {
  const response = await fetch(`${API_URL}/cart`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function createOrder({ cart, cardHolderName, cardNumber, expirationDate, cvc }) {
  const payload = {
    cartId: cart.id || undefined,
    paymentMethod: 'simulated',
    cardHolderName,
    cardNumber,
    expirationDate,
    cvc,
    items: cart.items,
  };
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function getOrdersHistory() {
  const response = await fetch(`${API_URL}/orders/history`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getOrderConfirmation(id) {
  const response = await fetch(`${API_URL}/orders/${id}/confirmation`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getOrderById(id) {
  const response = await fetch(`${API_URL}/orders/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getSellerDashboard() {
  const response = await fetch(`${API_URL}/seller/dashboard`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getSellerOrders() {
  const response = await fetch(`${API_URL}/seller/orders`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function updateSellerOrderStatus(orderId, status) {
  const response = await fetch(`${API_URL}/seller/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ status }),
  });
  return handleResponse(response);
}

export async function getConversations(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.q?.trim()) searchParams.set('q', params.q.trim());

  const response = await fetch(`${API_URL}/conversations${searchParams.toString() ? `?${searchParams.toString()}` : ''}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function createConversation(payload) {
  const response = await fetch(`${API_URL}/conversations`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function sendConversationMessage(conversationId, payload) {
  const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function getNotifications() {
  const response = await fetch(`${API_URL}/notifications`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function markAllNotificationsRead() {
  const response = await fetch(`${API_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({}),
  });
  return handleResponse(response);
}

export async function submitOrderReview(orderId, payload) {
  const response = await fetch(`${API_URL}/orders/${orderId}/review`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function submitReport(payload) {
  const response = await fetch(`${API_URL}/reports`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function getAdminDashboard() {
  const response = await fetch(`${API_URL}/admin/dashboard`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getAdminUsers() {
  const response = await fetch(`${API_URL}/admin/users`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function updateAdminUserSuspension(userId, payload) {
  const response = await fetch(`${API_URL}/admin/users/${userId}/suspension`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function getAdminProducts() {
  const response = await fetch(`${API_URL}/admin/products`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function deleteAdminProduct(productId) {
  const response = await fetch(`${API_URL}/admin/products/${productId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getAdminReports() {
  const response = await fetch(`${API_URL}/admin/reports`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function updateAdminReport(reportId, payload) {
  const response = await fetch(`${API_URL}/admin/reports/${reportId}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}
