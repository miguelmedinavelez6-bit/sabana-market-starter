# Sabana Market Starter

Starter full-stack para avanzar el 33% del proyecto:
- Login
- Marketplace
- Detalle de producto
- Carrito
- Checkout simulado
- Compra exitosa
- Mis pedidos

## 1. Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

## 2. Frontend
En otra terminal:
```bash
cd client
npm install
npm run dev
```

## Credenciales demo
- Correo: `sofia.rodriguez@unisabana.edu.co`
- Contraseña: `123456`

## Rutas principales
- `/` login
- `/home` marketplace
- `/product/:id` detalle
- `/cart` carrito
- `/checkout` checkout simulado
- `/success` compra exitosa
- `/orders` mis pedidos

## Notas
- El carrito se guarda en `localStorage` para acelerar la demo.
- Los productos y el login del backend están mockeados.
- Las órdenes sí se crean durante la ejecución del servidor y se consultan en historial.
