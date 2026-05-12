export function getStoredCart() {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch {
    return [];
  }
}

function normalizeCartItem(item = {}) {
  const productId = item.productId || item.id || item._id;
  return {
    ...item,
    productId,
    id: productId,
    quantity: Number(item.quantity) || 1,
  };
}

export function saveStoredCartItems(items = []) {
  localStorage.setItem('cart', JSON.stringify(items));
}

export function syncCartFromResponse(cart) {
  const items = (cart?.items || []).map((item) => ({
    ...normalizeCartItem(item),
  }));
  saveStoredCartItems(items);
  return items;
}

export function buildLocalCartSnapshot() {
  const items = getStoredCart().map(normalizeCartItem);
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0);
  const serviceFee = Math.round(subtotal * 0.05);

  return {
    id: '',
    items,
    subtotal,
    serviceFee,
    total: subtotal + serviceFee,
  };
}

export function addLocalCartItem(product) {
  const items = getStoredCart().map(normalizeCartItem);
  const productId = product.productId || product.id || product._id;
  const idx = items.findIndex((item) => item.productId === productId);

  if (idx >= 0) {
    items[idx].quantity += 1;
  } else {
    items.push(normalizeCartItem({
      ...product,
      productId,
      sellerName: product.sellerName || product.seller || product.seller?.fullName || 'Vendedor',
      image: product.image || product.images?.[0] || '',
      quantity: 1,
    }));
  }

  saveStoredCartItems(items);
  return buildLocalCartSnapshot();
}

export function updateLocalCartQuantity(productId, quantity) {
  const items = getStoredCart()
    .map(normalizeCartItem)
    .map((item) => item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item);

  saveStoredCartItems(items);
  return buildLocalCartSnapshot();
}

export function deleteLocalCartItem(productId) {
  const items = getStoredCart()
    .map(normalizeCartItem)
    .filter((item) => item.productId !== productId);

  saveStoredCartItems(items);
  return buildLocalCartSnapshot();
}

export function clearStoredCart() {
  localStorage.removeItem('cart');
}

export function getStoredCartCount() {
  return getStoredCart().reduce((sum, item) => sum + (item.quantity || 0), 0);
}
