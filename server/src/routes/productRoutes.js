const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

function serializeProductList(product) {
  const sellerName = product.sellerName || 'Vendedor';
  const sellerReputation = product.sellerReputation ?? 5;

  return {
    ...product,
    id: String(product._id),
    seller: sellerName,
    sellerName,
    sellerReputation,
  };
}

function serializeProductDetail(product) {
  const sellerName = product.sellerName || 'Vendedor';
  const sellerReputation = product.sellerReputation ?? 5;

  return {
    ...product,
    id: String(product._id),
    sellerName,
    sellerReputation,
    seller: {
      id: encodeURIComponent(sellerName),
      fullName: sellerName,
      reputation: sellerReputation,
    },
  };
}

function buildProductQuery(params = {}) {
  const { q, category, status, minPrice, maxPrice } = params;
  const query = {};

  if (q?.trim()) {
    const safeQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { title: { $regex: safeQuery, $options: 'i' } },
      { description: { $regex: safeQuery, $options: 'i' } },
      { category: { $regex: safeQuery, $options: 'i' } },
      { sellerName: { $regex: safeQuery, $options: 'i' } },
    ];
  }

  if (category && category !== 'Todas') query.category = category;

  const statuses = Array.isArray(status)
    ? status.flatMap((value) => String(value).split(','))
    : status
      ? String(status).split(',')
      : [];

  if (statuses.length) {
    query.status = { $in: statuses.filter(Boolean) };
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  return query;
}

function getRelevanceScore(product, q = '') {
  if (!q?.trim()) {
    return (product.sellerReputation || 0) * 10;
  }

  const term = q.trim().toLowerCase();
  const title = String(product.title || '').toLowerCase();
  const description = String(product.description || '').toLowerCase();
  const category = String(product.category || '').toLowerCase();
  const sellerName = String(product.sellerName || '').toLowerCase();
  const words = term.split(/\s+/).filter(Boolean);

  let score = 0;

  if (title === term) score += 300;
  if (title.startsWith(term)) score += 180;
  if (title.includes(term)) score += 120;
  if (description.includes(term)) score += 70;
  if (category.includes(term)) score += 55;
  if (sellerName.includes(term)) score += 30;

  for (const word of words) {
    if (title.includes(word)) score += 25;
    if (description.includes(word)) score += 12;
    if (category.includes(word)) score += 10;
  }

  return score + (product.sellerReputation || 0);
}

function sortProducts(products, { sort = 'relevance', q = '' } = {}) {
  const sorted = [...products];

  if (sort === 'price_asc') {
    return sorted.sort((a, b) => a.price - b.price);
  }

  if (sort === 'price_desc') {
    return sorted.sort((a, b) => b.price - a.price);
  }

  return sorted.sort((a, b) => {
    const scoreDiff = getRelevanceScore(b, q) - getRelevanceScore(a, q);
    if (scoreDiff !== 0) return scoreDiff;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
}

async function respondWithProducts(req, res, { detail = false } = {}) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;
  const q = req.query.q?.trim() || '';
  const sort = req.query.sort || 'relevance';

  const products = await Product.find(buildProductQuery(req.query)).lean();
  const sortedProducts = sortProducts(products, { sort, q });
  const paginatedProducts = sortedProducts.slice(skip, skip + limit);
  const total = sortedProducts.length;

  return res.json({
    products: paginatedProducts.map(detail ? serializeProductDetail : serializeProductList),
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}

router.get('/', async (req, res) => {
  await respondWithProducts(req, res);
});

router.get('/search', async (req, res) => {
  const q = req.query.q?.trim();
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

  if (!q) {
    return res.json({ products: [], total: 0, page: 1, limit, pages: 1 });
  }

  await respondWithProducts(req, res);
});

router.get('/filter', async (req, res) => {
  await respondWithProducts(req, res);
});

router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

  return res.json({ product: serializeProductDetail(product) });
});

module.exports = router;
