const express = require('express');
const Review = require('../models/Review');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

function serializeReceivedReview(review) {
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

function computeAverageRating(reviews = [], fallback = 5) {
  if (!reviews.length) return Number(fallback || 5);
  const total = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
  return Number((total / reviews.length).toFixed(1));
}

router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const reviews = await Review.find({
      $or: [
        { receivedByUserIds: String(user._id) },
        { receivedBySellerNames: user.fullName },
      ],
    }).sort({ createdAt: -1 }).lean();

    return res.json({
      reviews: reviews.map(serializeReceivedReview),
      total: reviews.length,
      reputation: computeAverageRating(reviews, user.reputation),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible cargar tus reseñas' });
  }
});

module.exports = router;
