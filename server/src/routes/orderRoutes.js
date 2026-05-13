const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Review = require('../models/Review');
const { authMiddleware } = require('../middleware/auth');
const { getAggregateOrderStatus } = require('../lib/orderStatus');

const router = express.Router();

function canAccessOrder(user, order) {
  return user.role === 'admin' || String(order.userId) === String(user.id);
}

function serializeReview(review) {
  return {
    id: String(review._id),
    orderId: review.orderId,
    reviewerName: review.reviewerName || 'Usuario',
    rating: review.rating,
    comment: review.comment || '',
    productTitles: review.productTitles || [],
    createdAt: review.createdAt,
  };
}

function serializeOrder(order, reviewed = false) {
  const currentStatus = getAggregateOrderStatus(order.items, order.status);

  return {
    id: order.orderId,
    items: order.items,
    total: order.total,
    status: currentStatus,
    createdAt: order.createdAt,
    reviewed,
  };
}

async function getReviewedOrderIds(orderIds = [], userId = '') {
  if (!orderIds.length || !userId) return new Set();

  const reviews = await Review.find({
    userId,
    orderId: { $in: orderIds },
  }).select('orderId').lean();

  return new Set(reviews.map((review) => review.orderId));
}

router.post('/', authMiddleware, async (req, res) => {
  const { cartId, paymentMethod, cardHolderName, cardNumber, expirationDate, cvc, items } = req.body;

  if (!paymentMethod || !cardHolderName || !cardNumber || !expirationDate || !cvc) {
    return res.status(400).json({ message: 'No fue posible procesar la compra' });
  }

  try {
    let checkoutItems = Array.isArray(items) ? items : [];

    if (cartId) {
      const cart = await Cart.findOne({ _id: cartId, userId: String(req.user.id) }).lean();
      if (cart && Array.isArray(cart.items) && cart.items.length > 0) {
        checkoutItems = cart.items;
      } else if (!Array.isArray(checkoutItems) || checkoutItems.length === 0) {
        return res.status(400).json({ message: 'No fue posible procesar la compra' });
      }
    }

    if (!Array.isArray(checkoutItems) || checkoutItems.length === 0) {
      return res.status(400).json({ message: 'No fue posible procesar la compra' });
    }

    const orderId = Math.floor(Math.random() * 9000) + 1000;
    const subtotal = checkoutItems.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0
    );
    const serviceFee = Math.round(subtotal * 0.05);
    const total = subtotal + serviceFee;

    const order = await Order.create({
      orderId: String(orderId),
      userId: String(req.user.id),
      items: checkoutItems.map((item) => ({
        productId: String(item.productId || item.id || item._id || ''),
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        sellerId: item.sellerId || '',
        sellerName: item.sellerName,
        status: 'pending',
      })),
      total,
      status: 'pending',
    });

    await Cart.findOneAndUpdate(
      { userId: String(req.user.id) },
      { $set: { items: [] } }
    );

    return res.status(201).json({
      message: 'Compra confirmada exitosamente',
      order: {
        id: order.orderId,
        status: order.status,
        subtotal,
        serviceFee,
        total: order.total,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible procesar la compra' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: String(req.user.id) }).sort({ createdAt: -1 }).lean();
    const reviewedOrderIds = await getReviewedOrderIds(
      orders.map((order) => order.orderId),
      String(req.user.id)
    );

    return res.json({
      orders: orders.map((order) => serializeOrder(order, reviewedOrderIds.has(order.orderId))),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener pedidos' });
  }
});

router.get('/:id/confirmation', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id }).lean();
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    if (!canAccessOrder(req.user, order)) {
      return res.status(403).json({ message: 'No tienes permisos para consultar esta orden' });
    }

    const review = await Review.findOne({
      orderId: order.orderId,
      userId: String(req.user.id),
    }).lean();

    return res.json({
      order: {
        ...serializeOrder(order, Boolean(review)),
      },
      message: 'Tu orden ha sido procesada correctamente',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener la orden' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id }).lean();
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    if (!canAccessOrder(req.user, order)) {
      return res.status(403).json({ message: 'No tienes permisos para consultar esta orden' });
    }

    const review = await Review.findOne({
      orderId: order.orderId,
      userId: String(req.user.id),
    }).lean();

    return res.json({
      order: serializeOrder(order, Boolean(review)),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener la orden' });
  }
});

router.post('/:id/review', authMiddleware, async (req, res) => {
  const rating = Number(req.body?.rating);
  const comment = String(req.body?.comment || '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'La calificación debe estar entre 1 y 5 estrellas' });
  }

  try {
    const order = await Order.findOne({ orderId: req.params.id }).lean();

    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    if (String(order.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Solo puedes reseñar tus propias órdenes' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Solo puedes reseñar órdenes entregadas' });
    }

    const existingReview = await Review.findOne({
      orderId: order.orderId,
      userId: String(req.user.id),
    });

    if (existingReview) {
      return res.json({
        message: 'Ya habías registrado una reseña para esta orden',
        review: serializeReview(existingReview),
        alreadySubmitted: true,
      });
    }

    const review = await Review.create({
      orderId: order.orderId,
      userId: String(req.user.id),
      reviewerName: req.user.fullName || 'Usuario',
      rating,
      comment,
      receivedByUserIds: [...new Set(order.items.map((item) => String(item.sellerId || '')).filter(Boolean))],
      receivedBySellerNames: [...new Set(order.items.map((item) => item.sellerName).filter(Boolean))],
      productTitles: [...new Set(order.items.map((item) => item.title).filter(Boolean))],
    });

    return res.status(201).json({
      message: 'Reseña registrada exitosamente',
      review: serializeReview(review),
      alreadySubmitted: false,
    });
  } catch (err) {
    if (err?.code === 11000) {
      const existingReview = await Review.findOne({
        orderId: req.params.id,
        userId: String(req.user.id),
      }).lean();

      return res.json({
        message: 'Ya habías registrado una reseña para esta orden',
        review: existingReview ? serializeReview(existingReview) : null,
        alreadySubmitted: true,
      });
    }

    console.error(err);
    return res.status(500).json({ message: 'No fue posible registrar la reseña' });
  }
});

module.exports = router;
