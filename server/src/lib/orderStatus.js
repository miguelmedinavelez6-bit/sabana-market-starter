const ORDER_STATUS_STEPS = ['pending', 'confirmed', 'processing', 'delivered'];

const ORDER_STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'En proceso',
  delivered: 'Entregado',
};

function normalizeOrderStatus(status, fallback = 'pending') {
  if (ORDER_STATUS_STEPS.includes(status)) return status;
  return ORDER_STATUS_STEPS.includes(fallback) ? fallback : 'pending';
}

function getOrderStatusIndex(status) {
  return ORDER_STATUS_STEPS.indexOf(normalizeOrderStatus(status));
}

function getNextOrderStatus(status) {
  const currentIndex = getOrderStatusIndex(status);
  return ORDER_STATUS_STEPS[currentIndex + 1] || null;
}

function getItemOrderStatus(item = {}, fallback = 'pending') {
  return normalizeOrderStatus(item.status, fallback);
}

function getAggregateOrderStatus(items = [], fallback = 'pending') {
  if (!Array.isArray(items) || items.length === 0) {
    return normalizeOrderStatus(fallback);
  }

  const indexes = items.map((item) => getOrderStatusIndex(getItemOrderStatus(item, fallback)));
  return ORDER_STATUS_STEPS[Math.min(...indexes)] || normalizeOrderStatus(fallback);
}

function isValidOrderStatus(status) {
  return ORDER_STATUS_STEPS.includes(status);
}

function isSequentialOrderTransition(currentStatus, nextStatus) {
  return getOrderStatusIndex(nextStatus) === getOrderStatusIndex(currentStatus) + 1;
}

module.exports = {
  ORDER_STATUS_STEPS,
  ORDER_STATUS_LABELS,
  normalizeOrderStatus,
  getOrderStatusIndex,
  getNextOrderStatus,
  getItemOrderStatus,
  getAggregateOrderStatus,
  isValidOrderStatus,
  isSequentialOrderTransition,
};
