const express = require('express');
const Conversation = require('../models/Conversation');
const Product = require('../models/Product');
const { authMiddleware } = require('../middleware/auth');
const {
  buildConversationAccessQuery,
  canAccessConversation,
} = require('../lib/conversationScope');

const router = express.Router();

router.use(authMiddleware);

function serializeMessage(message) {
  return {
    id: message?._id ? String(message._id) : undefined,
    senderId: String(message?.senderId || ''),
    senderName: message?.senderName || 'Usuario',
    senderRole: message?.senderRole || 'buyer',
    content: message?.content || '',
    createdAt: message?.createdAt || new Date().toISOString(),
  };
}

function serializeConversation(conversation) {
  const messages = Array.isArray(conversation?.messages)
    ? conversation.messages.map(serializeMessage)
    : [];
  const lastMessage = messages[messages.length - 1] || null;

  return {
    id: String(conversation._id),
    productId: String(conversation.productId || ''),
    productTitle: conversation.productTitle || '',
    productImage: conversation.productImage || '',
    sellerId: String(conversation.sellerId || ''),
    sellerName: conversation.sellerName || 'Vendedor',
    buyerId: String(conversation.buyerId || ''),
    buyerName: conversation.buyerName || 'Comprador',
    messages,
    lastMessage,
    updatedAt: conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt || null,
  };
}

function matchesSearch(conversation, query) {
  if (!query) return true;

  const q = query.toLowerCase();
  const lastMessage = conversation.messages?.[conversation.messages.length - 1];

  return [
    conversation.productTitle,
    conversation.sellerName,
    conversation.buyerName,
    lastMessage?.content,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

async function appendMessage(conversation, user, content) {
  conversation.messages.push({
    senderId: String(user.id),
    senderName: user.fullName || 'Usuario',
    senderRole: user.role || 'buyer',
    content: content.trim(),
    createdAt: new Date(),
  });
  conversation.lastMessageAt = new Date();
  await conversation.save();
  return conversation;
}

router.get('/', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const conversations = await Conversation.find(buildConversationAccessQuery(req.user))
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    const filtered = q
      ? conversations.filter((conversation) => matchesSearch(conversation, q))
      : conversations;

    return res.json({
      conversations: filtered.map(serializeConversation),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible cargar las conversaciones' });
  }
});

router.post('/', async (req, res) => {
  const productId = String(req.body?.productId || '').trim();
  const content = String(req.body?.content || '').trim();
  const sellerIdFromBody = String(req.body?.sellerId || '').trim();

  if (!productId || !content) {
    return res.status(400).json({ message: 'productId y content son obligatorios' });
  }

  try {
    const product = await Product.findById(productId).lean();

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const sellerName = product.sellerName || 'Vendedor';
    const sellerId = String(product.sellerId || sellerIdFromBody || encodeURIComponent(sellerName));
    const buyerId = String(req.user.id);

    if (buyerId === sellerId) {
      return res.status(400).json({ message: 'No puedes iniciar una conversación con tu propio producto' });
    }

    let conversation = await Conversation.findOne({
      productId: String(product._id),
      buyerId,
      $or: [
        { sellerId },
        { sellerName },
      ],
    });

    if (!conversation) {
      conversation = await Conversation.create({
        productId: String(product._id),
        productTitle: product.title || '',
        productImage: product.images?.[0] || '',
        sellerId,
        sellerName,
        buyerId,
        buyerName: req.user.fullName || 'Comprador',
        messages: [],
      });
    }

    conversation.productTitle = conversation.productTitle || product.title || '';
    conversation.productImage = conversation.productImage || product.images?.[0] || '';
    conversation.sellerName = conversation.sellerName || sellerName;
    conversation.buyerName = conversation.buyerName || req.user.fullName || 'Comprador';

    await appendMessage(conversation, req.user, content);

    return res.status(201).json({
      message: 'Mensaje enviado correctamente',
      conversationId: String(conversation._id),
      conversation: serializeConversation(conversation),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible iniciar la conversación' });
  }
});

router.post('/:id/messages', async (req, res) => {
  const content = String(req.body?.content || '').trim();

  if (!content) {
    return res.status(400).json({ message: 'El mensaje no puede estar vacío' });
  }

  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversación no encontrada' });
    }

    if (!canAccessConversation(conversation, req.user)) {
      return res.status(403).json({ message: 'No tienes permisos para responder en esta conversación' });
    }

    await appendMessage(conversation, req.user, content);

    return res.status(201).json({
      message: 'Mensaje enviado correctamente',
      conversationId: String(conversation._id),
      conversation: serializeConversation(conversation),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible enviar el mensaje' });
  }
});

module.exports = router;
