const Conversation = require('../models/Conversation');
const NotificationInbox = require('../models/NotificationInbox');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { buildConversationAccessQuery } = require('./conversationScope');
const { getAggregateOrderStatus } = require('./orderStatus');

const ORDER_STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'En proceso',
  delivered: 'Entregado',
};

function getTimestamp(value, fallback = Date.now()) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildNotification({ id, type, message, eventAt, metadata = {} }) {
  const timestamp = getTimestamp(eventAt);
  return {
    id,
    type,
    message,
    createdAt: new Date(timestamp).toISOString(),
    metadata,
  };
}

async function buildNotificationsForUser(user) {
  const userId = String(user.id);

  const [orders, conversations, reviews, inbox] = await Promise.all([
    Order.find({ userId }).sort({ updatedAt: -1 }).lean(),
    Conversation.find(buildConversationAccessQuery(user)).sort({ lastMessageAt: -1, updatedAt: -1 }).lean(),
    Review.find({
      $or: [
        { receivedByUserIds: userId },
        { receivedBySellerNames: user.fullName || '' },
      ],
    }).sort({ createdAt: -1 }).lean(),
    NotificationInbox.findOne({ userId }).lean(),
  ]);

  const notifications = [];

  for (const conversation of conversations) {
    const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    messages.forEach((message, index) => {
      if (String(message.senderId) === userId) return;

      notifications.push(buildNotification({
        id: `message-${conversation._id}-${message._id || index}-${index}`,
        type: 'new_message',
        message: `Nuevo mensaje de ${message.senderName || conversation.sellerName || 'un usuario'}.`,
        eventAt: message.createdAt || conversation.lastMessageAt || conversation.updatedAt,
        metadata: {
          productId: conversation.productId,
          productTitle: conversation.productTitle || '',
          senderName: message.senderName || '',
          conversationId: String(conversation._id),
        },
      }));
    });
  }

  for (const order of orders) {
    const status = getAggregateOrderStatus(order.items, order.status);

    notifications.push(buildNotification({
      id: `purchase-${order.orderId}`,
      type: 'new_purchase',
      message: `Tu compra #${order.orderId} fue registrada exitosamente.`,
      eventAt: order.createdAt,
      metadata: {
        orderId: order.orderId,
        status,
      },
    }));

    notifications.push(buildNotification({
      id: `order-${order.orderId}-${status}`,
      type: 'order_status',
      message: `Tu orden #${order.orderId} está en estado ${ORDER_STATUS_LABELS[status] || status}.`,
      eventAt: order.updatedAt || order.createdAt,
      metadata: {
        orderId: order.orderId,
        status,
      },
    }));
  }

  for (const review of reviews) {
    notifications.push(buildNotification({
      id: `review-${review._id}`,
      type: 'new_review',
      message: `Recibiste una nueva reseña sobre ${review.productTitles?.[0] || `la orden #${review.orderId}`}.`,
      eventAt: review.createdAt,
      metadata: {
        orderId: review.orderId,
        rating: review.rating,
      },
    }));
  }

  const lastReadAt = inbox?.lastReadAt ? getTimestamp(inbox.lastReadAt, 0) : 0;

  return notifications
    .sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt))
    .map((notification) => ({
      ...notification,
      read: lastReadAt > 0 ? getTimestamp(notification.createdAt) <= lastReadAt : false,
    }));
}

module.exports = {
  buildNotificationsForUser,
};
