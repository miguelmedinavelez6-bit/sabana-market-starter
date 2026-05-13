require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Conversation = require('../models/Conversation');
const NotificationInbox = require('../models/NotificationInbox');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Report = require('../models/Report');
const Review = require('../models/Review');
const User = require('../models/User');
const { getAggregateOrderStatus } = require('../lib/orderStatus');

const users = [
  {
    fullName: 'Sofía Rodríguez',
    institutionalEmail: 'sofia.rodriguez@unisabana.edu.co',
    password: '123456',
    career: 'Administración de Empresas',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&h=240&fit=crop&q=80',
    reputation: 4.9,
    isVerified: true,
    role: 'buyer',
    authProvider: 'password',
  },
  {
    fullName: 'Mateo Pérez',
    institutionalEmail: 'mateo.perez@unisabana.edu.co',
    password: '123456',
    career: 'Ingeniería Industrial',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&h=240&fit=crop&q=80',
    reputation: 4.8,
    isVerified: true,
    role: 'seller',
    authProvider: 'password',
  },
  {
    fullName: 'Laura Gómez',
    institutionalEmail: 'laura.gomez@unisabana.edu.co',
    password: '123456',
    career: 'Medicina',
    photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=240&h=240&fit=crop&q=80',
    reputation: 4.7,
    isVerified: true,
    role: 'seller',
    authProvider: 'password',
  },
  {
    fullName: 'Admin Sabana',
    institutionalEmail: 'admin.market@unisabana.edu.co',
    password: '123456',
    career: 'Administración de Sistemas',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240&h=240&fit=crop&q=80',
    reputation: 5,
    isVerified: true,
    role: 'admin',
    authProvider: 'password',
  },
  {
    fullName: 'Camilo Torres',
    institutionalEmail: 'camilo.torres@unisabana.edu.co',
    password: '123456',
    career: 'Derecho',
    photoUrl: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=240&h=240&fit=crop&q=80',
    reputation: 4.2,
    isVerified: true,
    role: 'buyer',
    authProvider: 'password',
    isSuspended: true,
    suspensionReason: 'Caso demo para moderación administrativa',
  },
];

const products = [
  {
    title: 'iPad Air 4 (64GB) + Apple Pencil',
    description: 'Excelente estado, lo vendo porque compré la versión Pro. Incluye caja original y cargador.',
    price: 1500000,
    category: 'Electrónica',
    status: 'used',
    statusLabel: 'Usado - Como nuevo',
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=400&fit=crop&q=80'],
    sellerName: 'Mateo Pérez',
    sellerReputation: 4.8,
  },
  {
    title: 'Audífonos Sony WH-1000XM4',
    description: 'Detalles de uso en las almohadillas pero funcionamiento 10/10.',
    price: 650000,
    category: 'Electrónica',
    status: 'used',
    statusLabel: 'Usado - Regular',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop&q=80'],
    sellerName: 'Mateo Pérez',
    sellerReputation: 4.8,
  },
  {
    title: 'Calculadora Casio fx-991LA X',
    description: 'Calculadora científica en su empaque original.',
    price: 85000,
    category: 'Accesorios',
    status: 'new',
    statusLabel: 'Nuevo',
    images: ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&h=400&fit=crop&q=80'],
    sellerName: 'Mateo Pérez',
    sellerReputation: 4.8,
  },
  {
    title: 'Libro: Cálculo de Stewart 8va Ed.',
    description: 'Pocas marcas de resaltador, perfecto para Cálculo I y II.',
    price: 120000,
    category: 'Libros',
    status: 'used',
    statusLabel: 'Usado - Buen estado',
    images: ['https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&h=400&fit=crop&q=80'],
    sellerName: 'Admin Sabana',
    sellerReputation: 5.0,
  },
  {
    title: 'Bata de Laboratorio Talla M',
    description: 'Bata 100% algodón, manga larga. Ideal para prácticas en la universidad.',
    price: 45000,
    category: 'Ropa',
    status: 'new',
    statusLabel: 'Nuevo',
    images: ['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop&q=80'],
    sellerName: 'Admin Sabana',
    sellerReputation: 5.0,
  },
  {
    title: 'Apuntes de Anatomía Semestre 1',
    description: 'PDFs completos de toda la teoría con ilustraciones dibujadas a mano.',
    price: 25000,
    category: 'Apuntes',
    status: 'digital',
    statusLabel: 'Digital',
    images: ['https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop&q=80'],
    sellerName: 'Laura Gómez',
    sellerReputation: 4.7,
  },
  {
    title: 'Atlas de Histología',
    description: 'Libro de apoyo para prácticas, con páginas subrayadas y notas útiles.',
    price: 78000,
    category: 'Libros',
    status: 'used',
    statusLabel: 'Usado - Buen estado',
    images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=400&fit=crop&q=80'],
    sellerName: 'Laura Gómez',
    sellerReputation: 4.7,
  },
];

function calculateOrderTotal(items = []) {
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );
  const serviceFee = Math.round(subtotal * 0.05);
  return subtotal + serviceFee;
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    Conversation.deleteMany({}),
    NotificationInbox.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    Report.deleteMany({}),
    Review.deleteMany({}),
    User.deleteMany({}),
  ]);

  const hashedUsers = await Promise.all(
    users.map(async (user) => ({ ...user, password: await bcrypt.hash(user.password, 10) }))
  );

  const insertedUsers = await User.insertMany(hashedUsers);
  const userByName = Object.fromEntries(insertedUsers.map((user) => [user.fullName, user]));

  const productsWithOwners = products.map((product) => ({
    ...product,
    sellerId: userByName[product.sellerName]?._id ? String(userByName[product.sellerName]._id) : '',
  }));
  const insertedProducts = await Product.insertMany(productsWithOwners);
  const productByTitle = Object.fromEntries(insertedProducts.map((product) => [product.title, product]));

  const orderDrafts = [
    {
      orderId: '1001',
      buyerName: 'Sofía Rodríguez',
      items: [
        {
          productTitle: 'iPad Air 4 (64GB) + Apple Pencil',
          quantity: 1,
          status: 'delivered',
        },
        {
          productTitle: 'Audífonos Sony WH-1000XM4',
          quantity: 1,
          status: 'delivered',
        },
      ],
    },
    {
      orderId: '1002',
      buyerName: 'Sofía Rodríguez',
      items: [
        {
          productTitle: 'Bata de Laboratorio Talla M',
          quantity: 1,
          status: 'processing',
        },
        {
          productTitle: 'Apuntes de Anatomía Semestre 1',
          quantity: 1,
          status: 'confirmed',
        },
      ],
    },
    {
      orderId: '1003',
      buyerName: 'Camilo Torres',
      items: [
        {
          productTitle: 'Calculadora Casio fx-991LA X',
          quantity: 1,
          status: 'pending',
        },
      ],
    },
  ];

  const ordersToInsert = orderDrafts.map((draft) => {
    const buyer = userByName[draft.buyerName];
    const items = draft.items.map((item) => {
      const product = productByTitle[item.productTitle];
      return {
        productId: String(product._id),
        title: product.title,
        price: product.price,
        quantity: item.quantity,
        sellerId: String(product.sellerId || ''),
        sellerName: product.sellerName,
        status: item.status,
      };
    });

    return {
      orderId: draft.orderId,
      userId: String(buyer._id),
      items,
      total: calculateOrderTotal(items),
      status: getAggregateOrderStatus(items, 'pending'),
    };
  });

  await Order.insertMany(ordersToInsert);

  await Review.insertMany([
    {
      orderId: '1001',
      userId: String(userByName['Sofía Rodríguez']._id),
      reviewerName: 'Sofía Rodríguez',
      rating: 5,
      comment: 'Mateo respondió rápido y el producto llegó tal como en las fotos.',
      receivedByUserIds: [String(userByName['Mateo Pérez']._id)],
      receivedBySellerNames: ['Mateo Pérez'],
      productTitles: ['iPad Air 4 (64GB) + Apple Pencil', 'Audífonos Sony WH-1000XM4'],
      createdAt: new Date('2026-05-05T15:00:00.000Z'),
      updatedAt: new Date('2026-05-05T15:00:00.000Z'),
    },
  ]);

  await Conversation.insertMany([
    {
      productId: String(productByTitle['iPad Air 4 (64GB) + Apple Pencil']._id),
      productTitle: 'iPad Air 4 (64GB) + Apple Pencil',
      productImage: productByTitle['iPad Air 4 (64GB) + Apple Pencil'].images?.[0] || '',
      sellerId: String(userByName['Mateo Pérez']._id),
      sellerName: 'Mateo Pérez',
      buyerId: String(userByName['Sofía Rodríguez']._id),
      buyerName: 'Sofía Rodríguez',
      messages: [
        {
          senderId: String(userByName['Sofía Rodríguez']._id),
          senderName: 'Sofía Rodríguez',
          senderRole: 'buyer',
          content: '¡Hola! ¿Sigue disponible el iPad?',
          createdAt: new Date('2026-05-04T13:30:00.000Z'),
        },
        {
          senderId: String(userByName['Mateo Pérez']._id),
          senderName: 'Mateo Pérez',
          senderRole: 'seller',
          content: 'Sí, todavía está disponible. ¿Quieres verlo hoy?',
          createdAt: new Date('2026-05-04T13:45:00.000Z'),
        },
      ],
      lastMessageAt: new Date('2026-05-04T13:45:00.000Z'),
      createdAt: new Date('2026-05-04T13:30:00.000Z'),
      updatedAt: new Date('2026-05-04T13:45:00.000Z'),
    },
    {
      productId: String(productByTitle['Bata de Laboratorio Talla M']._id),
      productTitle: 'Bata de Laboratorio Talla M',
      productImage: productByTitle['Bata de Laboratorio Talla M'].images?.[0] || '',
      sellerId: String(userByName['Admin Sabana']._id),
      sellerName: 'Admin Sabana',
      buyerId: String(userByName['Sofía Rodríguez']._id),
      buyerName: 'Sofía Rodríguez',
      messages: [
        {
          senderId: String(userByName['Sofía Rodríguez']._id),
          senderName: 'Sofía Rodríguez',
          senderRole: 'buyer',
          content: 'Hola, ¿la bata talla M sigue disponible?',
          createdAt: new Date('2026-05-08T09:00:00.000Z'),
        },
        {
          senderId: String(userByName['Admin Sabana']._id),
          senderName: 'Admin Sabana',
          senderRole: 'admin',
          content: 'Sí, la tengo disponible y la puedo entregar en campus.',
          createdAt: new Date('2026-05-08T09:12:00.000Z'),
        },
      ],
      lastMessageAt: new Date('2026-05-08T09:12:00.000Z'),
      createdAt: new Date('2026-05-08T09:00:00.000Z'),
      updatedAt: new Date('2026-05-08T09:12:00.000Z'),
    },
  ]);

  await NotificationInbox.insertMany([
    {
      userId: String(userByName['Sofía Rodríguez']._id),
      lastReadAt: new Date('2026-05-04T13:35:00.000Z'),
    },
    {
      userId: String(userByName['Mateo Pérez']._id),
      lastReadAt: new Date('2026-05-01T08:00:00.000Z'),
    },
  ]);

  await Report.insertMany([
    {
      reporterId: String(userByName['Sofía Rodríguez']._id),
      reporterName: 'Sofía Rodríguez',
      targetType: 'product',
      targetId: String(productByTitle['Atlas de Histología']._id),
      targetLabel: 'Atlas de Histología',
      targetOwnerId: String(userByName['Laura Gómez']._id),
      targetOwnerName: 'Laura Gómez',
      reason: 'Información engañosa',
      details: 'La descripción dice que está en buen estado, pero en fotos se ve bastante deteriorado.',
      status: 'pending',
      createdAt: new Date('2026-05-10T16:00:00.000Z'),
      updatedAt: new Date('2026-05-10T16:00:00.000Z'),
    },
    {
      reporterId: String(userByName['Sofía Rodríguez']._id),
      reporterName: 'Sofía Rodríguez',
      targetType: 'user',
      targetId: String(userByName['Camilo Torres']._id),
      targetLabel: 'Camilo Torres',
      targetOwnerId: String(userByName['Camilo Torres']._id),
      targetOwnerName: 'Camilo Torres',
      reason: 'Posible fraude',
      details: 'Intentó mover la conversación fuera de la plataforma de forma insistente.',
      status: 'resolved',
      adminNote: 'Usuario suspendido en seed demo para el panel administrador',
      createdAt: new Date('2026-05-09T11:00:00.000Z'),
      updatedAt: new Date('2026-05-09T15:00:00.000Z'),
    },
  ]);

  console.log(`Seeded ${insertedUsers.length} users, ${insertedProducts.length} products, ${ordersToInsert.length} orders, 1 review, 2 conversations and 2 reports`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
