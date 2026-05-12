const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/lib/db');
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const messageRoutes = require('./src/routes/messageRoutes');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(async (_req, res, next) => {
  try {
    await connectDB();
    next();
  } catch {
    res.status(500).json({ message: 'Error de conexión' });
  }
});

app.get('/', (_req, res) => {
  res.json({ message: 'Sabana Market API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);

if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
