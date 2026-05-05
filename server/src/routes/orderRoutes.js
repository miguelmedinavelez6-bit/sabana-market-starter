const express = require('express');

const router = express.Router();

const orders = [];

router.post('/', (req, res) => {
  const { items, total, userId } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'La orden debe incluir al menos un producto' });
  }

  const order = {
    id: `ORD-${Math.floor(Math.random() * 9000) + 1000}`,
    userId,
    items,
    total,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  orders.unshift(order);

  return res.status(201).json({
    message: 'Compra confirmada exitosamente',
    order,
  });
});

router.get('/history', (_req, res) => {
  res.json({ orders });
});

module.exports = router;
