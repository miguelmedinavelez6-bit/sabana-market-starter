require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');

const users = [
  {
    fullName: 'Sofía Rodríguez',
    institutionalEmail: 'sofia.rodriguez@unisabana.edu.co',
    password: '123456',
    role: 'buyer',
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
    sellerName: 'Juan P.',
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
    sellerName: 'María G.',
    sellerReputation: 4.5,
  },
  {
    title: 'Calculadora Casio fx-991LA X',
    description: 'Calculadora científica en su empaque original.',
    price: 85000,
    category: 'Accesorios',
    status: 'new',
    statusLabel: 'Nuevo',
    images: ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&h=400&fit=crop&q=80'],
    sellerName: 'Tienda Universitaria',
    sellerReputation: 4.9,
  },
  {
    title: 'Apuntes de Anatomía Semestre 1',
    description: 'PDFs completos de toda la teoría con ilustraciones dibujadas a mano.',
    price: 25000,
    category: 'Apuntes',
    status: 'digital',
    statusLabel: 'Digital',
    images: ['https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop&q=80'],
    sellerName: 'Dr. Carlos',
    sellerReputation: 5.0,
  },
  {
    title: 'Audífonos Sony WH-1000XM4',
    description: 'Detalles de uso en las almohadillas pero funcionamiento 10/10.',
    price: 650000,
    category: 'Electrónica',
    status: 'used',
    statusLabel: 'Usado - Regular',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop&q=80'],
    sellerName: 'Andrés M.',
    sellerReputation: 4.2,
  },
  {
    title: 'Bata de Laboratorio Talla M',
    description: 'Bata 100% algodón, manga larga. Ideal para prácticas en la universidad.',
    price: 45000,
    category: 'Ropa',
    status: 'new',
    statusLabel: 'Nuevo',
    images: ['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop&q=80'],
    sellerName: 'Tienda Universitaria',
    sellerReputation: 4.7,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Product.deleteMany({});

  const hashedUsers = await Promise.all(
    users.map(async (u) => ({ ...u, password: await bcrypt.hash(u.password, 10) }))
  );

  await User.insertMany(hashedUsers);
  await Product.insertMany(products);

  console.log(`Seeded ${hashedUsers.length} users and ${products.length} products`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
