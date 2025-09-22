# 📚 DOCUMENTACIÓN COMPLETA DEL BACKEND - PROYECTO AFIP

## 🏗️ **ARQUITECTURA GENERAL**

### **Stack Tecnológico:**
- **Framework:** NestJS (Node.js)
- **Base de Datos:** PostgreSQL con TypeORM
- **Autenticación:** JWT (JSON Web Tokens)
- **Pagos:** MercadoPago API
- **Email:** Nodemailer
- **Documentación:** Swagger/OpenAPI
- **Cron Jobs:** node-cron
- **PDF Generation:** PDFKit

### **Características Principales:**
- ✅ Sistema de autenticación completo con JWT
- ✅ Panel de administrador con CRUD completo
- ✅ Sistema de suscripciones con MercadoPago
- ✅ Gestión de portfolios de inversión
- ✅ Sistema de assets financieros
- ✅ Webhooks para pagos
- ✅ Generación de reportes PDF
- ✅ Sistema de emails automatizados
- ✅ CORS configurado para múltiples orígenes
- ✅ Validación de datos con class-validator
- ✅ Documentación automática con Swagger

---

## 🔐 **SISTEMA DE AUTENTICACIÓN**

### **JWT Payload Structure:**
```typescript
{
  userId: string,     // ID único del usuario
  email: string,      // Email del usuario  
  role: string,       // Rol principal (user/admin)
  name: string,       // Nombre completo
  iat: number,        // Fecha de emisión
  exp: number         // Fecha de expiración
}
```

### **Roles disponibles:**
- `user`: Usuario estándar
- `admin`: Administrador del sistema

---

## 🌐 **CONFIGURACIÓN CORS**

```typescript
origin: [
  'http://localhost:5173',      // Vite dev
  'http://localhost:5174',      // Vite dev alternativo
  'http://localhost:3000',      // Backend testing
  'https://financepr.netlify.app' // Producción
]
```

---

## 📋 **ENDPOINTS COMPLETOS**

### **🔑 AUTENTICACIÓN** (`/api/auth`)

#### **POST** `/api/auth/registro`
- **Función:** Registrar nuevo usuario
- **Acceso:** Público
- **Body:**
```json
{
  "email": "string",
  "password": "string", 
  "name": "string"
}
```
- **Respuesta:**
```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "roles": ["user"],
  "token": "jwt_token"
}
```

#### **POST** `/api/auth/login`
- **Función:** Iniciar sesión
- **Acceso:** Público
- **Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
- **Respuesta:**
```json
{
  "id": "uuid",
  "email": "string", 
  "name": "string",
  "roles": ["user"],
  "token": "jwt_token"
}
```

#### **GET** `/api/auth/check-status`
- **Función:** Verificar estado de autenticación
- **Acceso:** JWT requerido
- **Headers:** `Authorization: Bearer <token>`
- **Respuesta:** Usuario completo con nuevo token

#### **GET** `/api/auth/Panel-Administrador`
- **Función:** Acceso al panel de administrador
- **Acceso:** JWT + Rol Admin
- **Headers:** `Authorization: Bearer <token>`
- **Respuesta:** Datos del panel administrativo

---

### **👥 USUARIOS** (`/api/users`)

#### **POST** `/api/users`
- **Función:** Crear usuario
- **Acceso:** JWT requerido

#### **GET** `/api/users`
- **Función:** Listar todos los usuarios
- **Acceso:** JWT requerido

#### **GET** `/api/users/:id`
- **Función:** Obtener usuario por ID
- **Acceso:** JWT requerido

#### **PATCH** `/api/users/:id`
- **Función:** Actualizar usuario
- **Acceso:** JWT requerido

#### **DELETE** `/api/users/:id`
- **Función:** Eliminar usuario
- **Acceso:** JWT requerido

#### **PATCH** `/api/users/report-config/:id`
- **Función:** Configurar reportes del usuario
- **Acceso:** JWT requerido

#### **GET** `/api/users/verify-email`
- **Función:** Verificar email del usuario
- **Acceso:** Público (con token en query)

#### **POST** `/api/users/resend-verification/:id`
- **Función:** Reenviar email de verificación
- **Acceso:** JWT requerido

---

### **🛡️ ADMINISTRACIÓN** (`/api/admin`)

#### **GET** `/api/admin/stats`
- **Función:** Estadísticas del sistema
- **Acceso:** JWT + Admin
- **Respuesta:**
```json
{
  "totalUsers": number,
  "activeSubscriptions": number,
  "totalRevenue": number,
  "monthlyGrowth": number
}
```

#### **GET** `/api/admin/users`
- **Función:** Listar usuarios para admin
- **Acceso:** JWT + Admin
- **Query params:** `page`, `limit`, `search`

#### **PATCH** `/api/admin/users/:userId/subscription`
- **Función:** Modificar suscripción de usuario
- **Acceso:** JWT + Admin
- **Body:**
```json
{
  "subscriptionType": "basic|premium|enterprise",
  "status": "active|inactive|cancelled"
}
```

#### **PATCH** `/api/admin/users/:userId/toggle-status`
- **Función:** Activar/desactivar usuario
- **Acceso:** JWT + Admin

#### **POST** `/api/admin/users/:userId/verify-email`
- **Función:** Verificar email manualmente
- **Acceso:** JWT + Admin

#### **DELETE** `/api/admin/users/:userId`
- **Función:** Eliminar usuario
- **Acceso:** JWT + Admin

#### **PATCH** `/api/admin/users/:userId/roles`
- **Función:** Modificar roles de usuario
- **Acceso:** JWT + Admin
- **Body:**
```json
{
  "roles": ["user", "admin"]
}
```

#### **GET** `/api/admin/users/:userId`
- **Función:** Obtener detalles completos de usuario
- **Acceso:** JWT + Admin

---

### **📊 ASSETS FINANCIEROS** (`/api/assets`)

#### **POST** `/api/assets`
- **Función:** Crear nuevo asset
- **Acceso:** JWT requerido
- **Body:**
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "type": "stock|crypto|bond",
  "price": 150.25,
  "currency": "USD"
}
```

#### **GET** `/api/assets`
- **Función:** Listar todos los assets
- **Acceso:** JWT requerido
- **Query params:** `type`, `symbol`, `page`, `limit`

#### **GET** `/api/assets/:id`
- **Función:** Obtener asset por ID
- **Acceso:** JWT requerido

#### **PUT** `/api/assets/:id`
- **Función:** Actualizar asset completamente
- **Acceso:** JWT requerido

#### **DELETE** `/api/assets/:id`
- **Función:** Eliminar asset
- **Acceso:** JWT requerido

---

### **💼 PORTFOLIO** (`/api/portfolio`)

#### **POST** `/api/portfolio`
- **Función:** Agregar asset al portfolio
- **Acceso:** JWT requerido
- **Body:**
```json
{
  "assetId": "uuid",
  "quantity": 10,
  "purchasePrice": 150.25,
  "purchaseDate": "2025-01-27T00:00:00Z"
}
```

#### **GET** `/api/portfolio`
- **Función:** Obtener portfolio del usuario autenticado
- **Acceso:** JWT requerido

#### **GET** `/api/portfolio/:id`
- **Función:** Obtener item específico del portfolio
- **Acceso:** JWT requerido

#### **PATCH** `/api/portfolio/:id`
- **Función:** Actualizar item del portfolio
- **Acceso:** JWT requerido

#### **GET** `/api/portfolio/user/:userId`
- **Función:** Obtener portfolio de usuario específico
- **Acceso:** JWT requerido

#### **GET** `/api/portfolio/statistics/:userId`
- **Función:** Estadísticas del portfolio
- **Acceso:** JWT requerido
- **Respuesta:**
```json
{
  "totalValue": number,
  "totalGainLoss": number,
  "totalGainLossPercentage": number,
  "topPerformers": [],
  "worstPerformers": [],
  "assetAllocation": {}
}
```

#### **GET** `/api/portfolio/performance/:userId`
- **Función:** Rendimiento histórico del portfolio
- **Acceso:** JWT requerido

#### **DELETE** `/api/portfolio/item/:id`
- **Función:** Eliminar item del portfolio
- **Acceso:** JWT requerido

#### **GET** `/api/portfolio/history/:id`
- **Función:** Historial de transacciones de un item
- **Acceso:** JWT requerido

#### **GET** `/api/portfolio/current-performance/:userId`
- **Función:** Rendimiento actual del portfolio
- **Acceso:** JWT requerido

---

### **📄 REPORTES** (`/api/report`)

#### **GET** `/api/report/download`
- **Función:** Descargar reporte PDF del portfolio
- **Acceso:** JWT requerido
- **Query params:** `userId`, `type`, `period`
- **Respuesta:** PDF file stream

---

### **💳 SUSCRIPCIONES** (`/api/subscriptions`)

#### **GET** `/api/subscriptions/current`
- **Función:** Obtener suscripción actual del usuario
- **Acceso:** JWT requerido
- **Respuesta:**
```json
{
  "id": "uuid",
  "type": "basic|premium|enterprise",
  "status": "active|inactive|cancelled",
  "startDate": "ISO_date",
  "endDate": "ISO_date",
  "features": []
}
```

#### **GET** `/api/subscriptions/usage`
- **Función:** Obtener uso actual de la suscripción
- **Acceso:** JWT requerido
- **Respuesta:**
```json
{
  "currentUsage": number,
  "limit": number,
  "percentage": number,
  "resetDate": "ISO_date"
}
```

#### **POST** `/api/subscriptions/cancel`
- **Función:** Cancelar suscripción
- **Acceso:** JWT requerido

---

### **💰 PAGOS** (`/api/payments`)

#### **POST** `/api/payments/create`
- **Función:** Crear pago con MercadoPago
- **Acceso:** JWT requerido
- **Body:**
```json
{
  "subscriptionType": "basic|premium|enterprise",
  "amount": number,
  "currency": "ARS|USD"
}
```
- **Respuesta:**
```json
{
  "paymentId": "string",
  "checkoutUrl": "string",
  "qrCode": "string",
  "status": "pending"
}
```

#### **GET** `/api/payments/history`
- **Función:** Historial de pagos del usuario
- **Acceso:** JWT requerido
- **Query params:** `page`, `limit`, `status`

---

### **🔗 WEBHOOKS** (`/api/webhooks`)

#### **POST** `/api/webhooks/mercadopago`
- **Función:** Webhook de MercadoPago para actualizar pagos
- **Acceso:** Público (validado por MercadoPago)
- **Body:** MercadoPago webhook payload

---

### **📰 NOTICIAS** (`/api/news`)

#### **GET** `/api/news`
- **Función:** Obtener noticias financieras
- **Acceso:** JWT requerido
- **Query params:** `category`, `page`, `limit`

---

## 🗄️ **ESTRUCTURA DE BASE DE DATOS**

### **Entidades Principales:**

#### **User**
```typescript
{
  id: uuid,
  email: string (unique),
  name: string,
  password: string (hashed),
  roles: string[],
  isActive: boolean,
  emailVerified: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Asset**
```typescript
{
  id: uuid,
  symbol: string,
  name: string,
  type: enum,
  price: decimal,
  currency: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### **PortfolioItem**
```typescript
{
  id: uuid,
  userId: uuid,
  assetId: uuid,
  quantity: decimal,
  purchasePrice: decimal,
  purchaseDate: Date,
  ticker: string (nullable),
  createdAt: Date,
  updatedAt: Date
}
```

#### **Subscription**
```typescript
{
  id: uuid,
  userId: uuid,
  type: enum,
  status: enum,
  startDate: Date,
  endDate: Date,
  mercadoPagoId: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Payment**
```typescript
{
  id: uuid,
  userId: uuid,
  subscriptionId: uuid,
  amount: decimal,
  currency: string,
  status: enum,
  mercadoPagoId: string,
  paymentMethod: string,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔒 **SEGURIDAD**

### **Headers requeridos:**
- `Authorization: Bearer <jwt_token>` para endpoints protegidos
- `Content-Type: application/json` para POST/PATCH/PUT

### **Validaciones:**
- ✅ JWT tokens con expiración (6 horas)
- ✅ Validación de roles para endpoints administrativos
- ✅ Validación de entrada con class-validator
- ✅ Sanitización de datos
- ✅ Rate limiting implícito
- ✅ CORS configurado

---

## 🚨 **CÓDIGOS DE ERROR COMUNES**

- **401 Unauthorized:** Token JWT inválido o expirado
- **403 Forbidden:** Sin permisos suficientes (rol)
- **404 Not Found:** Recurso no encontrado
- **400 Bad Request:** Datos de entrada inválidos
- **409 Conflict:** Recurso ya existe (ej: email duplicado)
- **500 Internal Server Error:** Error del servidor

---

## 🔄 **FLUJO DE AUTENTICACIÓN PARA FRONTEND**

1. **Login/Registro:**
   ```javascript
   const response = await fetch('/api/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email, password })
   });
   const { token, ...user } = await response.json();
   ```

2. **Almacenar token:**
   ```javascript
   localStorage.setItem('token', token);
   ```

3. **Usar token en requests:**
   ```javascript
   const response = await fetch('/api/users', {
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('token')}`,
       'Content-Type': 'application/json'
     }
   });
   ```

4. **Verificar estado:**
   ```javascript
   const response = await fetch('/api/auth/check-status', {
     headers: { 'Authorization': `Bearer ${token}` }
   });
   ```

---

## 🌍 **URLs DE ACCESO**

- **Backend API:** `http://localhost:3000/api`
- **Swagger Docs:** `http://localhost:3000/api` (interfaz interactiva)
- **Producción:** Configurar según deployment

---

## 📞 **COMPATIBILIDAD CON FRONTEND**

### **Formato de respuesta estándar:**
```json
{
  "success": true,
  "data": {},
  "message": "string",
  "errors": []
}
```

### **JWT Compatible:**
- ✅ Campo `userId` disponible
- ✅ Campo `email` disponible  
- ✅ Campo `role` disponible (string)
- ✅ Campo `name` disponible
- ✅ Expiración automática manejada

### **CORS habilitado para:**
- Frontend desarrollo (localhost:5173, 5174)
- Backend testing (localhost:3000)
- Producción (financepr.netlify.app)

---

## 🎯 **NOTAS IMPORTANTES PARA EL FRONTEND**

1. **Todos los endpoints requieren JWT excepto:**
   - `/api/auth/registro`
   - `/api/auth/login`
   - `/api/users/verify-email`
   - `/api/webhooks/mercadopago`

2. **El JWT contiene toda la información del usuario:**
   - `userId`, `email`, `role`, `name`
   - No necesitas hacer requests adicionales para datos básicos

3. **Los endpoints de admin requieren rol `admin`:**
   - Verificar `role` en el JWT antes de mostrar UI de admin

4. **Paginación disponible en:**
   - `/api/admin/users`
   - `/api/assets`
   - `/api/payments/history`
   - `/api/news`

5. **MercadoPago integrado:**
   - `/api/payments/create` devuelve URL de checkout
   - Webhooks automáticos actualizan estados

Este backend está completamente funcional y listo para integración con cualquier frontend moderno. 🚀
