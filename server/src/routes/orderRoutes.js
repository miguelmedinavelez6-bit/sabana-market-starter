const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function canAccessOrder(user, order) {
  return user.role === 'admin' || String(order.userId) === String(user.id);
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
      if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
        return res.status(400).json({ message: 'No fue posible procesar la compra' });
      }
      checkoutItems = cart.items;
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
        sellerName: item.sellerName,
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
    const filter = req.user.role === 'admin' ? {} : { userId: String(req.user.id) };
    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({
      orders: orders.map((o) => ({
        id: o.orderId,
        items: o.items,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
      })),
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

    return res.json({
      order: {
        id: order.orderId,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        items: order.items,
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

    return res.json({
      order: {
        id: order.orderId,
        items: order.items,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener la orden' });
  }
});

module.exports = router;
