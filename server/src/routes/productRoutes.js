const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find().skip(skip).limit(limit).lean(),
    Product.countDocuments(),
  ]);

  res.json({ products, total, page, limit, pages: Math.ceil(total / limit) });
});

router.get('/search', async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.json({ products: [] });

  const products = await Product.find({
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } },
    ],
  }).lean();

  res.json({ products });
});

router.get('/filter', async (req, res) => {
  const { category, status, minPrice, maxPrice } = req.query;
  const query = {};

  if (category && category !== 'Todas') query.category = category;
  if (status) query.status = { $in: status.split(',') };
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const products = await Product.find(query).lean();
  res.json({ products });
});

router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
  res.json({ product });
});

module.exports = router;
