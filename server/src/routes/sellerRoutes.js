const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Review = require('../models/Review');
const User = require('../models/User');
const { authMiddleware, requireRoles } = require('../middleware/auth');
const {
  ORDER_STATUS_LABELS,
  getAggregateOrderStatus,
  getItemOrderStatus,
  getNextOrderStatus,
  isSequentialOrderTransition,
  isValidOrderStatus,
} = require('../lib/orderStatus');

const router = express.Router();

router.use(authMiddleware, requireRoles(['seller', 'admin']));

function buildOwnedProductsQuery(user) {
  return {
    $or: [
      { sellerId: String(user.id || '') },
      { sellerName: user.fullName || '' },
    ],
  };
}

function buildReceivedReviewsQuery(user) {
  return {
    $or: [
      { receivedByUserIds: String(user.id || '') },
      { receivedBySellerNames: user.fullName || '' },
    ],
  };
}

function getSellerItems(order, user) {
  return (order.items || []).filter((item) => (
    String(item.sellerId || '') === String(user.id || '')
    || String(item.sellerName || '') === String(user.fullName || '')
  ));
}

function isSellerItemOwned(item, user) {
  return (
    String(item.sellerId || '') === String(user.id || '')
    || String(item.sellerName || '') === String(user.fullName || '')
  );
}

function computeAverageRating(reviews = [], fallback = 5) {
  if (!reviews.length) return Number(fallback || 5);
  const total = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
  return Number((total / reviews.length).toFixed(1));
}

function serializeSellerOrder(order, sellerItems = [], buyer = null) {
  const subtotal = sellerItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );
  const sellerStatus = getAggregateOrderStatus(sellerItems, order.status);
  const overallStatus = getAggregateOrderStatus(order.items, order.status);
  const nextStatus = getNextOrderStatus(sellerStatus);

  return {
    id: order.orderId,
    status: sellerStatus,
    overallStatus,
    nextStatus,
    createdAt: order.createdAt,
    buyer: {
      id: String(buyer?._id || order.userId || ''),
      fullName: buyer?.fullName || 'Comprador',
      institutionalEmail: buyer?.institutionalEmail || '',
    },
    items: sellerItems.map((item) => ({
      productId: item.productId,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      sellerId: item.sellerId || '',
      sellerName: item.sellerName || '',
      status: getItemOrderStatus(item, order.status),
    })),
    subtotal,
  };
}

async function getSellerOrdersForUser(user) {
  const rawOrders = await Order.find({
    $or: [
      { 'items.sellerId': String(user.id || '') },
      { 'items.sellerName': user.fullName || '' },
    ],
  }).sort({ createdAt: -1 }).lean();

  const ordersWithItems = rawOrders
    .map((order) => ({ order, sellerItems: getSellerItems(order, user) }))
    .filter((entry) => entry.sellerItems.length > 0);

  const buyerIds = [...new Set(ordersWithItems.map((entry) => String(entry.order.userId || '')).filter(Boolean))];
  const buyers = await User.find({ _id: { $in: buyerIds } }).lean();
  const buyerMap = new Map(buyers.map((buyer) => [String(buyer._id), buyer]));

  return ordersWithItems.map(({ order, sellerItems }) => (
    serializeSellerOrder(order, sellerItems, buyerMap.get(String(order.userId)))
  ));
}

router.get('/dashboard', async (req, res) => {
  try {
    const [products, orders, reviews] = await Promise.all([
      Product.find(buildOwnedProductsQuery(req.user)).lean(),
      getSellerOrdersForUser(req.user),
      Review.find(buildReceivedReviewsQuery(req.user)).lean(),
    ]);

    const now = new Date();
    const monthlySales = orders.reduce((sum, order) => {
      const createdAt = new Date(order.createdAt);
      const sameMonth = createdAt.getUTCFullYear() === now.getUTCFullYear()
        && createdAt.getUTCMonth() === now.getUTCMonth();
      return sameMonth ? sum + (Number(order.subtotal) || 0) : sum;
    }, 0);

    return res.json({
      metrics: {
        monthlySales,
        activeProducts: products.length,
        pendingOrders: orders.filter((order) => order.status === 'pending').length,
        reputation: computeAverageRating(reviews, req.user.reputation || 5),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible cargar el panel de vendedor' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const orders = await getSellerOrdersForUser(req.user);

    return res.json({
      orders,
      total: orders.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible cargar tus órdenes recibidas' });
  }
});

router.patch('/orders/:id/status', async (req, res) => {
  const nextStatus = String(req.body?.status || '').trim();

  if (!isValidOrderStatus(nextStatus)) {
    return res.status(400).json({ message: 'Debes enviar un estado válido para la orden' });
  }

  try {
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    const sellerItems = getSellerItems(order, req.user);
    if (!sellerItems.length) {
      return res.status(403).json({ message: 'No puedes gestionar una orden que no te pertenece' });
    }

    const currentSellerStatus = getAggregateOrderStatus(sellerItems, order.status);

    if (nextStatus === currentSellerStatus) {
      const buyer = await User.findById(order.userId).lean();

      return res.json({
        message: `La orden ya estaba en estado ${ORDER_STATUS_LABELS[currentSellerStatus] || currentSellerStatus}`,
        order: serializeSellerOrder(order.toObject(), sellerItems, buyer),
      });
    }

    if (!isSequentialOrderTransition(currentSellerStatus, nextStatus)) {
      return res.status(400).json({
        message: 'Solo puedes avanzar la orden al siguiente estado del flujo',
      });
    }

    order.items = (order.items || []).map((item) => {
      if (!isSellerItemOwned(item, req.user)) return item;
      return {
        ...item,
        status: nextStatus,
      };
    });
    order.status = getAggregateOrderStatus(order.items, order.status);
    await order.save();

    const buyer = await User.findById(order.userId).lean();
    const updatedSellerItems = getSellerItems(order, req.user);

    return res.json({
      message: `Orden actualizada a ${ORDER_STATUS_LABELS[nextStatus] || nextStatus}`,
      order: serializeSellerOrder(order.toObject(), updatedSellerItems, buyer),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible actualizar el estado de la orden' });
  }
});

module.exports = router;
