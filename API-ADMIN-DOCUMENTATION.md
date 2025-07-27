# 📋 DOCUMENTACIÓN COMPLETA API ADMIN - PARA FRONTEND

## 🔐 AUTENTICACIÓN

### Login
```
POST /api/auth/login
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "id": "uuid",
  "email": "user@example.com", 
  "name": "Nombre Completo",
  "roles": ["admin", "user"],        // ✅ ARRAY de roles
  "isActive": true,
  "emailVerified": true,
  "token": "jwt_token_here"
}
```

## 📊 ENDPOINTS ADMINISTRATIVOS

### 1. Estadísticas del Sistema
```
GET /api/admin/stats
Authorization: Bearer {token}

Response:
{
  "totalUsers": 150,
  "activeUsers": 140,
  "premiumUsers": 25,
  "freeUsers": 125,
  "totalSubscriptions": 25,
  "totalAssets": 1200,
  "recentUsers": [...]
}
```

### 2. Lista de Usuarios
```
GET /api/admin/users
Authorization: Bearer {token}

Response: [
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Nombre Usuario",
    "roles": ["user"],
    "isActive": true,
    "emailVerified": true,
    "subscription": {
      "plan": "FREE",
      "status": "ACTIVE"
    },
    "createdAt": "2025-01-01T00:00:00.000Z",
    "portfolioItemsCount": 5
  }
]
```

### 3. Detalles de Usuario Específico
```
GET /api/admin/users/:userId
Authorization: Bearer {token}

Response: {
  "id": "uuid",
  "email": "user@example.com",
  "name": "Nombre Usuario",
  "roles": ["user"],
  "isActive": true,
  "emailVerified": true,
  "subscription": {
    "plan": "FREE",
    "status": "ACTIVE"
  },
  "createdAt": "2025-01-01T00:00:00.000Z",
  "portfolioItemsCount": 5
}
```

### 4. Cambiar Plan de Suscripción
```
PATCH /api/admin/users/:userId/subscription
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "plan": "PREMIUM"  // "FREE" | "PREMIUM"
}

Response:
{
  "message": "Suscripción actualizada exitosamente",
  "user": {...},
  "subscription": {
    "plan": "PREMIUM",
    "status": "ACTIVE"
  }
}
```

### 5. Verificar Email Manualmente
```
POST /api/admin/users/:userId/verify-email
Authorization: Bearer {token}

Response:
{
  "message": "Email verificado exitosamente",
  "user": {
    "id": "uuid",
    "emailVerified": true
  }
}
```

### 6. Activar/Desactivar Usuario
```
PATCH /api/admin/users/:userId/toggle-status
Authorization: Bearer {token}

Response:
{
  "message": "Estado del usuario actualizado",
  "user": {
    "id": "uuid",
    "isActive": false
  }
}
```

### 7. Eliminar Usuario
```
DELETE /api/admin/users/:userId
Authorization: Bearer {token}

Response:
{
  "message": "Usuario eliminado exitosamente"
}
```

### 8. Cambiar Roles de Usuario
```
PATCH /api/admin/users/:userId/roles
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "roles": ["admin", "user"]  // Array de roles
}

Response:
{
  "message": "Roles actualizados exitosamente",
  "user": {
    "id": "uuid",
    "roles": ["admin", "user"]
  }
}
```

## 🔒 PROTECCIÓN DE RUTAS

### Middleware Automático
- Todas las rutas `/api/admin/*` están protegidas
- Requieren JWT token válido en header Authorization
- Requieren rol 'admin' en el array de roles del usuario

### Headers Requeridos
```
Authorization: Bearer {jwt_token}
Content-Type: application/json (para POST/PATCH)
```

## ❌ CÓDIGOS DE ERROR

### Autenticación
- `401 Unauthorized`: Token inválido o expirado
- `403 Forbidden`: Usuario no tiene rol de admin

### Validación
- `400 Bad Request`: Datos inválidos en el body
- `404 Not Found`: Usuario no encontrado

### Servidor
- `500 Internal Server Error`: Error interno del servidor

## 🌐 CORS CONFIGURADO
```javascript
// Orígenes permitidos:
- http://localhost:5173  // Vite dev
- http://localhost:5174  // Vite alternativo  
- http://localhost:3000  // Backend testing
- https://financepr.netlify.app // Producción
```

## 🧪 TESTING
```bash
# Probar el sistema completo
node test-complete-admin-system.js

# Probar solo login
node test-login-roles.js
```

---

## ✅ ESTADO: 100% IMPLEMENTADO Y LISTO

Tu backend está completamente preparado para el frontend. 
Todos los endpoints funcionan exactamente como el frontend los espera.
