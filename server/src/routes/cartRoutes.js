const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authMiddleware, requireRoles } = require('../middleware/auth');

const router = express.Router();

function computeCartTotals(items = []) {
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );
  const serviceFee = Math.round(subtotal * 0.05);
  return {
    subtotal,
    serviceFee,
    total: subtotal + serviceFee,
  };
}

function serializeCart(cart) {
  const items = (cart?.items || []).map((item) => ({
    productId: item.productId,
    title: item.title,
    price: item.price,
    quantity: item.quantity,
    sellerId: item.sellerId,
    sellerName: item.sellerName,
    image: item.image,
  }));

  return {
    id: String(cart?._id || ''),
    items,
    ...computeCartTotals(items),
  };
}

async function findOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
}

// Admins can also browse/buy as buyers in the marketplace.
router.use(authMiddleware, requireRoles(['buyer', 'admin']));

router.get('/', async (req, res) => {
  try {
    const cart = await findOrCreateCart(String(req.user.id));
    return res.json({ cart: serializeCart(cart) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener el carrito' });
  }
});

router.post('/items', async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId || Number(quantity) < 1) {
    return res.status(400).json({ message: 'Producto y cantidad válidos son requeridos' });
  }

  try {
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const cart = await findOrCreateCart(String(req.user.id));
    const existingItem = cart.items.find((item) => item.productId === String(product._id));

    if (existingItem) {
      existingItem.quantity += Number(quantity);
      existingItem.price = product.price;
      existingItem.title = product.title;
      existingItem.sellerId = product.sellerId || '';
      existingItem.sellerName = product.sellerName;
      existingItem.image = product.images?.[0] || '';
    } else {
      cart.items.push({
        productId: String(product._id),
        title: product.title,
        price: product.price,
        quantity: Number(quantity),
        sellerId: product.sellerId || '',
        sellerName: product.sellerName,
        image: product.images?.[0] || '',
      });
    }

    await cart.save();
    return res.json({ cart: serializeCart(cart) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible agregar el producto al carrito' });
  }
});

router.patch('/items/:id', async (req, res) => {
  const { quantity } = req.body;

  if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
    return res.status(400).json({ message: 'La cantidad debe ser mayor o igual a 1' });
  }

  try {
    const cart = await findOrCreateCart(String(req.user.id));
    const item = cart.items.find((entry) => entry.productId === req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Producto no encontrado en el carrito' });
    }

    item.quantity = Number(quantity);
    await cart.save();
    return res.json({ cart: serializeCart(cart) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible actualizar el carrito' });
  }
});

router.delete('/items/:id', async (req, res) => {
  try {
    const cart = await findOrCreateCart(String(req.user.id));
    const nextItems = cart.items.filter((item) => item.productId !== req.params.id);

    if (nextItems.length === cart.items.length) {
      return res.status(404).json({ message: 'Producto no encontrado en el carrito' });
    }

    cart.items = nextItems;
    await cart.save();
    return res.json({ cart: serializeCart(cart) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible eliminar el producto del carrito' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const cart = await findOrCreateCart(String(req.user.id));
    cart.items = [];
    await cart.save();
    return res.json({ cart: serializeCart(cart) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible limpiar el carrito' });
  }
});

module.exports = router;
