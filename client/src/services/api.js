import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

async function handleResponse(response) {
  const data = await response.json();
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
    cartId: cart.id,
    paymentMethod: 'simulated',
    cardHolderName,
    cardNumber,
    expirationDate,
    cvc,
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
