const express = require('express');

const router = express.Router();

const products = [
  {
    id: '1',
    title: 'iPad Air 4 (64GB) + Apple Pencil',
    description: 'Excelente estado, lo vendo porque compré la versión Pro. Incluye caja original y cargador.',
    price: 1500000,
    category: 'Electrónica',
    status: 'used',
    statusLabel: 'Usado - Como nuevo',
    images: ['https://placehold.co/600x400?text=iPad+Air+4'],
    sellerName: 'Juan P.',
    sellerReputation: 4.8,
  },
  {
    id: '2',
    title: 'Libro: Cálculo de Stewart 8va Ed.',
    description: 'Pocas marcas de resaltador, perfecto para Cálculo I y II.',
    price: 120000,
    category: 'Libros',
    status: 'used',
    statusLabel: 'Usado - Buen estado',
    images: ['https://placehold.co/600x400?text=Libro+Stewart'],
    sellerName: 'María G.',
    sellerReputation: 4.5,
  },
  {
    id: '3',
    title: 'Calculadora Casio fx-991LA X',
    description: 'Calculadora científica en su empaque original.',
    price: 85000,
    category: 'Accesorios',
    status: 'new',
    statusLabel: 'Nuevo',
    images: ['https://placehold.co/600x400?text=Calculadora+Casio'],
    sellerName: 'Tienda Universitaria',
    sellerReputation: 4.9,
  },
  {
    id: '4',
    title: 'Apuntes de Anatomía Semestre 1',
    description: 'PDFs completos de toda la teoría con ilustraciones dibujadas a mano.',
    price: 25000,
    category: 'Apuntes',
    status: 'digital',
    statusLabel: 'Digital',
    images: ['https://placehold.co/600x400?text=Apuntes+Anatomia'],
    sellerName: 'Dr. Carlos',
    sellerReputation: 5.0,
  },
  {
    id: '5',
    title: 'Audífonos Sony WH-1000XM4',
    description: 'Detalles de uso en las almohadillas pero funcionamiento 10/10.',
    price: 650000,
    category: 'Electrónica',
    status: 'used',
    statusLabel: 'Usado - Regular',
    images: ['https://placehold.co/600x400?text=Audifonos+Sony'],
    sellerName: 'Andrés M.',
    sellerReputation: 4.2,
  },
  {
    id: '6',
    title: 'Bata de Laboratorio Talla M',
    description: 'Bata 100% algodón, manga larga. Ideal para prácticas en la universidad.',
    price: 45000,
    category: 'Ropa',
    status: 'new',
    statusLabel: 'Nuevo',
    images: ['https://placehold.co/600x400?text=Bata+de+Laboratorio'],
    sellerName: 'Tienda Universitaria',
    sellerReputation: 4.7,
  },
];

router.get('/', (_req, res) => {
  res.json({ products });
});

router.get('/:id', (req, res) => {
  const product = products.find((item) => item.id === req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }
  return res.json({ product });
});

module.exports = router;
