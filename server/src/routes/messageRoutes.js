const express = require('express');
const MessageThread = require('../models/MessageThread');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

function serializeThread(thread) {
  const messages = thread?.messages || [];
  const lastMessage = messages[messages.length - 1] || null;

  return {
    productId: thread.productId,
    productTitle: thread.productTitle,
    sellerName: thread.sellerName,
    messages,
    lastMessage,
    updatedAt: thread.updatedAt,
  };
}

router.get('/threads', async (req, res) => {
  try {
    const threads = await MessageThread.find({}).sort({ updatedAt: -1 }).lean();
    return res.json({
      threads: threads.map(serializeThread),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener conversaciones' });
  }
});

router.get('/threads/:productId', async (req, res) => {
  try {
    const thread = await MessageThread.findOne({ productId: req.params.productId }).lean();
    if (!thread) {
      return res.json({
        thread: {
          productId: req.params.productId,
          productTitle: '',
          sellerName: '',
          messages: [],
          lastMessage: null,
          updatedAt: null,
        },
      });
    }

    return res.json({ thread: serializeThread(thread) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener la conversación' });
  }
});

router.post('/threads/:productId/messages', async (req, res) => {
  const { text, productTitle = '', sellerName = '' } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'El mensaje no puede estar vacío' });
  }

  try {
    let thread = await MessageThread.findOne({ productId: req.params.productId });
    if (!thread) {
      thread = await MessageThread.create({
        productId: req.params.productId,
        productTitle,
        sellerName,
        messages: [],
      });
    }

    thread.productTitle = thread.productTitle || productTitle;
    thread.sellerName = thread.sellerName || sellerName;
    thread.messages.push({
      senderId: String(req.user.id),
      senderName: req.user.fullName || 'Usuario',
      senderRole: req.user.role || 'buyer',
      text: text.trim(),
      ts: Date.now(),
    });

    await thread.save();

    return res.status(201).json({
      thread: serializeThread(thread),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'No fue posible enviar el mensaje' });
  }
});

module.exports = router;
