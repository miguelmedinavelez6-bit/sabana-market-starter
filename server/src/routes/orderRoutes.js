const express = require('express');

const router = express.Router();

const orders = [];

router.post('/', (req, res) => {
  const { cartId, paymentMethod, cardHolderName, cardNumber, expirationDate, cvc, items, total } = req.body;

  if (!paymentMethod || !cardHolderName || !cardNumber || !expirationDate || !cvc) {
    return res.status(400).json({ message: 'No fue posible procesar la compra' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'No fue posible procesar la compra' });
  }

  const order = {
    id: Math.floor(Math.random() * 9000) + 1000,
    cartId: cartId ?? null,
    paymentMethod,
    items,
    total,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  orders.unshift(order);

  return res.status(201).json({
    message: 'Compra confirmada exitosamente',
    order: {
      id: order.id,
      status: order.status,
      total: order.total,
    },
  });
});

router.get('/history', (_req, res) => {
  res.json({ orders });
});

router.get('/:id/confirmation', (req, res) => {
  const id = Number(req.params.id);
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ message: 'Orden no encontrada' });
  }
  return res.json({
    order: { id: order.id, status: order.status },
    message: 'Tu orden ha sido procesada correctamente',
  });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ message: 'Orden no encontrada' });
  }
  return res.json({ order });
});

module.exports = router;
