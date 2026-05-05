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

export async function getProducts() {
  const response = await fetch(`${API_URL}/products`);
  return handleResponse(response);
}

export async function getProductById(id) {
  const response = await fetch(`${API_URL}/products/${id}`);
  return handleResponse(response);
}

export async function createOrder(orderData) {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  return handleResponse(response);
}

export async function getOrdersHistory() {
  const response = await fetch(`${API_URL}/orders/history`);
  return handleResponse(response);
}
