const express = require('express');
const Product = require('../models/Product');
const Report = require('../models/Report');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/', async (req, res) => {
  const targetType = String(req.body?.targetType || '').trim();
  const targetId = String(req.body?.targetId || '').trim();
  const reason = String(req.body?.reason || '').trim();
  const details = String(req.body?.details || '').trim();

  if (!['product', 'user'].includes(targetType) || !targetId || !reason) {
    return res.status(400).json({ message: 'Debes enviar targetType, targetId y razón del reporte' });
  }

  try {
    let reportPayload = {
      reporterId: String(req.user.id),
      reporterName: req.user.fullName || 'Usuario',
      targetType,
      targetId,
      reason,
      details,
    };

    if (targetType === 'product') {
      const product = await Product.findById(targetId).lean();

      if (!product) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      if (String(product.sellerId || '') === String(req.user.id)) {
        return res.status(400).json({ message: 'No puedes reportar tu propio producto' });
      }

      reportPayload = {
        ...reportPayload,
        targetLabel: product.title || 'Producto',
        targetOwnerId: String(product.sellerId || ''),
        targetOwnerName: product.sellerName || 'Vendedor',
      };
    } else {
      const user = await User.findById(targetId).lean();

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      if (String(user._id) === String(req.user.id)) {
        return res.status(400).json({ message: 'No puedes reportarte a ti mismo' });
      }

      reportPayload = {
        ...reportPayload,
        targetLabel: user.fullName || 'Usuario',
        targetOwnerId: String(user._id),
        targetOwnerName: user.fullName || 'Usuario',
      };
    }

    const report = await Report.create(reportPayload);

    return res.status(201).json({
      message: 'Reporte enviado correctamente',
      report: {
        id: String(report._id),
        status: report.status,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible enviar el reporte' });
  }
});

module.exports = router;
