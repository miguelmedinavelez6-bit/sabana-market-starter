const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

function serializeProfileProduct(product) {
  return {
    id: String(product._id),
    title: product.title,
    price: product.price,
    category: product.category,
    status: product.status,
    statusLabel: product.statusLabel,
    image: product.images?.[0] || '',
    sellerName: product.sellerName || 'Vendedor',
    createdAt: product.createdAt,
  };
}

function buildReceivedReviewsQuery(user) {
  return {
    $or: [
      { receivedByUserIds: String(user._id) },
      { receivedBySellerNames: user.fullName },
    ],
  };
}

function computeAverageRating(reviews = [], fallback = 5) {
  if (!reviews.length) return Number(fallback || 5);
  const total = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
  return Number((total / reviews.length).toFixed(1));
}

function isValidPhotoUrl(value = '') {
  if (!value) return true;

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const [products, receivedReviews] = await Promise.all([
      Product.find({
        $or: [
          { sellerId: String(user._id) },
          { sellerName: user.fullName },
        ],
      }).sort({ createdAt: -1 }).lean(),
      Review.find(buildReceivedReviewsQuery(user)).sort({ createdAt: -1 }).lean(),
    ]);

    const reputation = computeAverageRating(receivedReviews, user.reputation);

    return res.json({
      user: {
        id: String(user._id),
        fullName: user.fullName,
        institutionalEmail: user.institutionalEmail,
        career: user.career || 'Comunidad Unisabana',
        photoUrl: user.photoUrl || '',
        reputation,
        verified: user.isVerified !== false,
        role: user.role,
      },
      products: products.map(serializeProfileProduct),
      stats: {
        productsCount: products.length,
        reviewsCount: receivedReviews.length,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible cargar tu perfil' });
  }
});

router.patch('/profile', async (req, res) => {
  const career = String(req.body?.career || '').trim();
  const photoUrl = String(req.body?.photoUrl || '').trim();

  if (!isValidPhotoUrl(photoUrl)) {
    return res.status(400).json({ message: 'La foto de perfil debe ser una URL http o https válida' });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.career = career || user.career || 'Comunidad Unisabana';
    user.photoUrl = photoUrl;
    await user.save();

    return res.json({
      message: 'Perfil actualizado correctamente',
      user: {
        id: String(user._id),
        fullName: user.fullName,
        institutionalEmail: user.institutionalEmail,
        career: user.career || 'Comunidad Unisabana',
        photoUrl: user.photoUrl || '',
        reputation: Number(user.reputation || 5),
        verified: user.isVerified !== false,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible actualizar tu perfil' });
  }
});

router.get('/public/:id', async (req, res) => {
  try {
    const requestedId = String(req.params.id || '').trim();
    const decodedId = decodeURIComponent(requestedId);
    const userQuery = [{ fullName: decodedId }];

    if (/^[0-9a-fA-F]{24}$/.test(requestedId)) {
      userQuery.unshift({ _id: requestedId });
    }

    const user = await User.findOne({
      $or: userQuery,
    }).lean();

    if (!user) {
      return res.status(404).json({ message: 'Vendedor no encontrado' });
    }

    const [products, receivedReviews] = await Promise.all([
      Product.find({
        $or: [
          { sellerId: String(user._id) },
          { sellerName: user.fullName },
        ],
      }).sort({ createdAt: -1 }).lean(),
      Review.find(buildReceivedReviewsQuery(user)).lean(),
    ]);

    return res.json({
      user: {
        id: String(user._id),
        fullName: user.fullName,
        photoUrl: user.photoUrl || '',
        career: user.career || 'Comunidad Unisabana',
        reputation: computeAverageRating(receivedReviews, user.reputation || 5),
        verified: user.isVerified !== false,
        role: user.role,
      },
      products: products.map(serializeProfileProduct),
      stats: {
        productsCount: products.length,
        reviewsCount: receivedReviews.length,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible cargar el perfil público' });
  }
});

module.exports = router;
