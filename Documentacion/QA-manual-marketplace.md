# QA Manual Marketplace

## Preparación

1. Configurar `server/.env`
2. Si quieres datos demo consistentes con las últimas features:
   - `cd server`
   - `npm run seed`
3. Levantar backend y frontend

## Smoke checks ejecutados en esta sesión

- `npm run build` en `client` ✅
- `node --check` backend relevante ✅
- `node -e "require('./server/server')"` ✅
- `npm test` en `server` ✅

## Flujos manuales sugeridos

### 1. Admin y moderación

- Iniciar sesión con `admin.market@unisabana.edu.co / 123456`
- Abrir `Panel administrador`
- Validar:
  - métricas cargan
  - lista de usuarios
  - lista de productos
  - lista de reportes
  - suspender/reactivar usuario
  - eliminar producto
  - resolver/descartar reporte

### 2. Reportes

- Como comprador:
  - entrar a un producto
  - reportar producto
  - entrar al perfil de un vendedor
  - reportar perfil
- Como admin:
  - verificar que los dos reportes aparezcan

### 3. Perfil y foto

- Abrir `Mi perfil`
- Editar:
  - carrera
  - URL de foto
- Verificar:
  - avatar en perfil
  - avatar en navbar
  - persistencia tras recargar

### 4. Chat y privacidad

- Crear conversación desde un producto
- Responder desde la cuenta vendedora
- Verificar:
  - cada cuenta solo ve sus conversaciones
  - no aparecen conversaciones de terceros
  - el nombre mostrado cambia según contraparte (comprador/vendedor)

### 5. Órdenes y seller dashboard

- Desde comprador:
  - crear orden
  - revisar `Mis pedidos`
- Desde vendedor:
  - abrir `Panel de vendedor`
  - avanzar estado de orden
- Validar:
  - seguimiento del comprador se actualiza
  - seller ve solo sus ítems
  - órdenes mixtas mantienen estado agregado correcto

### 6. Notificaciones

- Validar eventos de:
  - mensaje nuevo
  - compra
  - cambio de estado
  - reseña recibida
- Usar `Marcar todas como leídas`

## Datos demo clave del seed

- Compradora: `sofia.rodriguez@unisabana.edu.co / 123456`
- Seller: `mateo.perez@unisabana.edu.co / 123456`
- Seller: `laura.gomez@unisabana.edu.co / 123456`
- Admin: `admin.market@unisabana.edu.co / 123456`
- Usuario suspendido demo: `camilo.torres@unisabana.edu.co / 123456`
