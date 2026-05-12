export function getStoredCart() {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch {
    return [];
  }
}

export function saveStoredCartItems(items = []) {
  localStorage.setItem('cart', JSON.stringify(items));
}

export function syncCartFromResponse(cart) {
  const items = (cart?.items || []).map((item) => ({
    ...item,
    id: item.productId,
  }));
  saveStoredCartItems(items);
  return items;
}

export function clearStoredCart() {
  localStorage.removeItem('cart');
}

export function getStoredCartCount() {
  return getStoredCart().reduce((sum, item) => sum + (item.quantity || 0), 0);
}
