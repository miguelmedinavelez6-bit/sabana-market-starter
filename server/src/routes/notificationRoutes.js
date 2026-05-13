const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { buildNotificationsForUser } = require('../lib/notifications');
const NotificationInbox = require('../models/NotificationInbox');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const notifications = await buildNotificationsForUser(req.user);
    return res.json({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.read).length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible cargar las notificaciones' });
  }
});

router.patch('/read-all', async (req, res) => {
  try {
    await NotificationInbox.findOneAndUpdate(
      { userId: String(req.user.id) },
      { $set: { lastReadAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ message: 'Todas las notificaciones fueron marcadas como leídas' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible marcar las notificaciones como leídas' });
  }
});

module.exports = router;
