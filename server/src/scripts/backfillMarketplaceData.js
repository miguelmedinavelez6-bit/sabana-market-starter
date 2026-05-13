require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { getAggregateOrderStatus, normalizeOrderStatus } = require('../lib/orderStatus');

async function backfillUsers() {
  const users = await User.find({});
  let updated = 0;

  for (const user of users) {
    let dirty = false;

    if (typeof user.photoUrl !== 'string') {
      user.photoUrl = '';
      dirty = true;
    }

    if (!user.authProvider) {
      user.authProvider = 'password';
      dirty = true;
    }

    if (typeof user.isSuspended !== 'boolean') {
      user.isSuspended = false;
      dirty = true;
    }

    if (dirty) {
      await user.save();
      updated += 1;
    }
  }

  return updated;
}

async function backfillProducts(usersByName) {
  const products = await Product.find({});
  let updated = 0;

  for (const product of products) {
    let dirty = false;

    if (!product.sellerId && usersByName.has(product.sellerName)) {
      product.sellerId = String(usersByName.get(product.sellerName)._id);
      dirty = true;
    }

    if (!Array.isArray(product.images) || product.images.length === 0) {
      product.images = ['https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&h=400&fit=crop&q=80'];
      dirty = true;
    }

    if (dirty) {
      await product.save();
      updated += 1;
    }
  }

  return updated;
}

async function backfillOrders() {
  const orders = await Order.find({});
  let updated = 0;

  for (const order of orders) {
    let dirty = false;
    order.items = (order.items || []).map((item) => {
      const serializedItem = typeof item.toObject === 'function' ? item.toObject() : item;
      const normalizedStatus = normalizeOrderStatus(item.status || order.status || 'pending');

      if (item.status !== normalizedStatus) {
        dirty = true;
      }

      return {
        ...serializedItem,
        status: normalizedStatus,
      };
    });

    const aggregateStatus = getAggregateOrderStatus(order.items, order.status || 'pending');
    if (order.status !== aggregateStatus) {
      order.status = aggregateStatus;
      dirty = true;
    }

    if (dirty) {
      await order.save();
      updated += 1;
    }
  }

  return updated;
}

async function backfillConversations(usersByName, productsById) {
  const conversations = await Conversation.find({});
  let updated = 0;

  for (const conversation of conversations) {
    let dirty = false;
    const relatedProduct = productsById.get(String(conversation.productId || ''));
    const sellerByName = usersByName.get(conversation.sellerName || '');

    if (!conversation.sellerId && relatedProduct?.sellerId) {
      conversation.sellerId = String(relatedProduct.sellerId);
      dirty = true;
    } else if (!conversation.sellerId && sellerByName?._id) {
      conversation.sellerId = String(sellerByName._id);
      dirty = true;
    }

    if (relatedProduct && !conversation.productTitle) {
      conversation.productTitle = relatedProduct.title;
      dirty = true;
    }

    if (relatedProduct && !conversation.productImage) {
      conversation.productImage = relatedProduct.images?.[0] || '';
      dirty = true;
    }

    if (dirty) {
      await conversation.save();
      updated += 1;
    }
  }

  return updated;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const users = await User.find({});
  const products = await Product.find({});
  const usersByName = new Map(users.map((user) => [user.fullName, user]));
  const productsById = new Map(products.map((product) => [String(product._id), product]));

  const [usersUpdated, productsUpdated, ordersUpdated, conversationsUpdated] = await Promise.all([
    backfillUsers(),
    backfillProducts(usersByName),
    backfillOrders(),
    backfillConversations(usersByName, productsById),
  ]);

  console.log(`Backfill complete → users: ${usersUpdated}, products: ${productsUpdated}, orders: ${ordersUpdated}, conversations: ${conversationsUpdated}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
