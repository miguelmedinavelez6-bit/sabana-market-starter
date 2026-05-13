const express = require('express');
const Product = require('../models/Product');
const Report = require('../models/Report');
const User = require('../models/User');
const { authMiddleware, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware, requireRoles(['admin']));

function serializeAdminUser(user, relatedReports = []) {
  const pendingReports = relatedReports.filter((report) => report.status === 'pending').length;

  return {
    id: String(user._id),
    fullName: user.fullName,
    institutionalEmail: user.institutionalEmail,
    role: user.role,
    career: user.career || 'Comunidad Unisabana',
    photoUrl: user.photoUrl || '',
    reputation: Number(user.reputation || 5),
    verified: user.isVerified !== false,
    suspended: user.isSuspended === true,
    suspensionReason: user.suspensionReason || '',
    reportsCount: relatedReports.length,
    pendingReports,
  };
}

function serializeAdminProduct(product, relatedReports = []) {
  const pendingReports = relatedReports.filter((report) => report.status === 'pending').length;

  return {
    id: String(product._id),
    title: product.title,
    category: product.category,
    price: product.price,
    status: product.status,
    statusLabel: product.statusLabel,
    sellerId: String(product.sellerId || ''),
    sellerName: product.sellerName || 'Vendedor',
    image: product.images?.[0] || '',
    reportsCount: relatedReports.length,
    pendingReports,
    createdAt: product.createdAt,
  };
}

function serializeReport(report) {
  return {
    id: String(report._id),
    targetType: report.targetType,
    targetId: report.targetId,
    targetLabel: report.targetLabel || '',
    targetOwnerId: report.targetOwnerId || '',
    targetOwnerName: report.targetOwnerName || '',
    reporterId: report.reporterId,
    reporterName: report.reporterName || 'Usuario',
    reason: report.reason,
    details: report.details || '',
    status: report.status,
    adminNote: report.adminNote || '',
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

router.get('/dashboard', async (_req, res) => {
  try {
    const [registeredUsers, activeProducts, pendingReports, suspendedUsers] = await Promise.all([
      User.countDocuments({}),
      Product.countDocuments({}),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ isSuspended: true }),
    ]);

    return res.json({
      metrics: {
        registeredUsers,
        activeProducts,
        pendingReports,
        suspendedUsers,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible cargar el panel de administrador' });
  }
});

router.get('/users', async (_req, res) => {
  try {
    const [users, reports] = await Promise.all([
      User.find({}).sort({ createdAt: -1 }).lean(),
      Report.find({ targetType: 'user' }).lean(),
    ]);

    return res.json({
      users: users.map((user) => serializeAdminUser(
        user,
        reports.filter((report) => String(report.targetId) === String(user._id))
      )),
      total: users.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible cargar los usuarios' });
  }
});

router.patch('/users/:id/suspension', async (req, res) => {
  const suspended = Boolean(req.body?.suspended);
  const reason = String(req.body?.reason || '').trim();

  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ message: 'No puedes suspender tu propia cuenta de administrador' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.isSuspended = suspended;
    user.suspensionReason = suspended ? reason : '';
    await user.save();

    const relatedReports = await Report.find({ targetType: 'user', targetId: String(user._id) }).lean();

    return res.json({
      message: suspended ? 'Usuario suspendido correctamente' : 'Usuario reactivado correctamente',
      user: serializeAdminUser(user.toObject(), relatedReports),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible actualizar el estado del usuario' });
  }
});

router.get('/products', async (_req, res) => {
  try {
    const [products, reports] = await Promise.all([
      Product.find({}).sort({ createdAt: -1 }).lean(),
      Report.find({ targetType: 'product' }).lean(),
    ]);

    return res.json({
      products: products.map((product) => serializeAdminProduct(
        product,
        reports.filter((report) => String(report.targetId) === String(product._id))
      )),
      total: products.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible cargar los productos' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    await Product.deleteOne({ _id: product._id });
    await Report.updateMany(
      { targetType: 'product', targetId: String(product._id), status: 'pending' },
      { $set: { status: 'resolved', adminNote: 'Producto retirado por administración' } }
    );

    return res.json({ message: 'Producto eliminado correctamente' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible eliminar el producto' });
  }
});

router.get('/reports', async (_req, res) => {
  try {
    const reports = await Report.find({}).sort({ createdAt: -1 }).lean();

    return res.json({
      reports: reports.map(serializeReport),
      total: reports.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible cargar los reportes' });
  }
});

router.patch('/reports/:id', async (req, res) => {
  const status = String(req.body?.status || '').trim();
  const adminNote = String(req.body?.adminNote || '').trim();

  if (!['pending', 'resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ message: 'Debes enviar un estado válido para el reporte' });
  }

  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    report.status = status;
    report.adminNote = adminNote;
    await report.save();

    return res.json({
      message: 'Reporte actualizado correctamente',
      report: serializeReport(report.toObject()),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible actualizar el reporte' });
  }
});

module.exports = router;
