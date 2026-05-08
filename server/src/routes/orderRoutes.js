const express = require('express');
const Order = require('../models/Order');

const router = express.Router();

router.post('/', async (req, res) => {
  const { cartId, paymentMethod, cardHolderName, cardNumber, expirationDate, cvc, items, total, userId } = req.body;

  if (!paymentMethod || !cardHolderName || !cardNumber || !expirationDate || !cvc) {
    return res.status(400).json({ message: 'No fue posible procesar la compra' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'No fue posible procesar la compra' });
  }

  try {
    const orderId = Math.floor(Math.random() * 9000) + 1000;
    const order = await Order.create({
      orderId: String(orderId),
      userId: userId || 'anonymous',
      items: items.map((item) => ({
        productId: String(item.id || item._id || ''),
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        sellerName: item.sellerName,
      })),
      total,
      status: 'pending',
    });

    return res.status(201).json({
      message: 'Compra confirmada exitosamente',
      order: {
        id: order.orderId,
        status: order.status,
        total: order.total,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible procesar la compra' });
  }
});

router.get('/history', async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
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

router.get('/:id/confirmation', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id }).lean();
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    return res.json({
      order: { id: order.orderId, status: order.status },
      message: 'Tu orden ha sido procesada correctamente',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener la orden' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id }).lean();
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
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
