# 🔧 EJEMPLOS DE INTEGRACIÓN FRONTEND

## 📋 **EJEMPLOS DE REQUESTS COMPLETOS**

### **🔑 Autenticación**

#### **Registro de Usuario**
```javascript
// POST /api/auth/registro
const register = async (userData) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/registro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'usuario@ejemplo.com',
        password: 'miPassword123',
        name: 'Juan Pérez'
      })
    });
    
    const result = await response.json();
    
    // Respuesta esperada:
    // {
    //   id: "uuid",
    //   email: "usuario@ejemplo.com",
    //   name: "Juan Pérez", 
    //   roles: ["user"],
    //   token: "eyJhbGciOiJIUzI1NiIs..."
    // }
    
    if (response.ok) {
      localStorage.setItem('token', result.token);
      return result;
    }
  } catch (error) {
    console.error('Error en registro:', error);
  }
};
```

#### **Login de Usuario**
```javascript
// POST /api/auth/login
const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', result.token);
      return result;
    } else {
      throw new Error(result.message || 'Error en login');
    }
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
};
```

#### **Verificar Estado de Autenticación**
```javascript
// GET /api/auth/check-status
const checkAuthStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const response = await fetch('http://localhost:3000/api/auth/check-status', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      // Actualizar token si es necesario
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      return result;
    } else {
      // Token inválido, limpiar localStorage
      localStorage.removeItem('token');
      return null;
    }
  } catch (error) {
    console.error('Error verificando auth:', error);
    return null;
  }
};
```

---

### **💼 Portfolio Management**

#### **Obtener Portfolio del Usuario**
```javascript
// GET /api/portfolio
const getUserPortfolio = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/portfolio', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const portfolio = await response.json();
      return portfolio;
    }
  } catch (error) {
    console.error('Error obteniendo portfolio:', error);
  }
};
```

#### **Agregar Asset al Portfolio**
```javascript
// POST /api/portfolio
const addAssetToPortfolio = async (assetData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/portfolio', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assetId: 'uuid-del-asset',
        quantity: 10,
        purchasePrice: 150.25,
        purchaseDate: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      return result;
    }
  } catch (error) {
    console.error('Error agregando asset al portfolio:', error);
  }
};
```

#### **Obtener Estadísticas del Portfolio**
```javascript
// GET /api/portfolio/statistics/:userId
const getPortfolioStats = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/portfolio/statistics/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const stats = await response.json();
      // Respuesta esperada:
      // {
      //   totalValue: 15000.50,
      //   totalGainLoss: 1250.30,
      //   totalGainLossPercentage: 8.35,
      //   topPerformers: [...],
      //   worstPerformers: [...],
      //   assetAllocation: {...}
      // }
      return stats;
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
  }
};
```

---

### **📊 Assets Management**

#### **Obtener Lista de Assets**
```javascript
// GET /api/assets
const getAssets = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();
    
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.symbol) queryParams.append('symbol', filters.symbol);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const url = `http://localhost:3000/api/assets${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const assets = await response.json();
      return assets;
    }
  } catch (error) {
    console.error('Error obteniendo assets:', error);
  }
};
```

#### **Crear Nuevo Asset**
```javascript
// POST /api/assets
const createAsset = async (assetData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/assets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: 'stock', // stock, crypto, bond
        price: 150.25,
        currency: 'USD'
      })
    });
    
    if (response.ok) {
      const newAsset = await response.json();
      return newAsset;
    }
  } catch (error) {
    console.error('Error creando asset:', error);
  }
};
```

---

### **💳 Suscripciones y Pagos**

#### **Obtener Suscripción Actual**
```javascript
// GET /api/subscriptions/current
const getCurrentSubscription = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/subscriptions/current', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const subscription = await response.json();
      // Respuesta esperada:
      // {
      //   id: "uuid",
      //   type: "basic|premium|enterprise", 
      //   status: "active|inactive|cancelled",
      //   startDate: "2025-01-01T00:00:00Z",
      //   endDate: "2025-02-01T00:00:00Z",
      //   features: [...]
      // }
      return subscription;
    }
  } catch (error) {
    console.error('Error obteniendo suscripción:', error);
  }
};
```

#### **Crear Pago con MercadoPago**
```javascript
// POST /api/payments/create
const createPayment = async (paymentData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/payments/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscriptionType: 'premium', // basic, premium, enterprise
        amount: 2999.99,
        currency: 'ARS'
      })
    });
    
    if (response.ok) {
      const paymentInfo = await response.json();
      // Respuesta esperada:
      // {
      //   paymentId: "MP-123456789",
      //   checkoutUrl: "https://www.mercadopago.com.ar/checkout/...",
      //   qrCode: "data:image/png;base64,...",
      //   status: "pending"
      // }
      
      // Redirigir al usuario al checkout de MercadoPago
      window.location.href = paymentInfo.checkoutUrl;
      
      return paymentInfo;
    }
  } catch (error) {
    console.error('Error creando pago:', error);
  }
};
```

#### **Obtener Historial de Pagos**
```javascript
// GET /api/payments/history
const getPaymentHistory = async (page = 1, limit = 10) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/payments/history?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const payments = await response.json();
      return payments;
    }
  } catch (error) {
    console.error('Error obteniendo historial de pagos:', error);
  }
};
```

---

### **🛡️ Panel de Administrador**

#### **Verificar si es Admin**
```javascript
// Verificar rol desde JWT
const isAdmin = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role === 'admin';
  } catch {
    return false;
  }
};
```

#### **Obtener Estadísticas del Sistema**
```javascript
// GET /api/admin/stats
const getSystemStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const stats = await response.json();
      // Respuesta esperada:
      // {
      //   totalUsers: 1250,
      //   activeSubscriptions: 890,
      //   totalRevenue: 125000.50,
      //   monthlyGrowth: 12.5
      // }
      return stats;
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas del sistema:', error);
  }
};
```

#### **Obtener Lista de Usuarios (Admin)**
```javascript
// GET /api/admin/users
const getUsers = async (page = 1, limit = 10, search = '') => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    });
    
    const response = await fetch(`http://localhost:3000/api/admin/users?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const users = await response.json();
      return users;
    }
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
  }
};
```

#### **Modificar Roles de Usuario**
```javascript
// PATCH /api/admin/users/:userId/roles
const updateUserRoles = async (userId, roles) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/admin/users/${userId}/roles`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ roles }) // ["user", "admin"]
    });
    
    if (response.ok) {
      const result = await response.json();
      return result;
    }
  } catch (error) {
    console.error('Error actualizando roles:', error);
  }
};
```

---

### **📄 Generación de Reportes**

#### **Descargar Reporte PDF**
```javascript
// GET /api/report/download
const downloadReport = async (userId, type = 'portfolio', period = 'monthly') => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/report/download?userId=${userId}&type=${type}&period=${period}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${type}-${period}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  } catch (error) {
    console.error('Error descargando reporte:', error);
  }
};
```

---

## 🔧 **UTILIDADES PARA MANEJO DE JWT**

### **Extractor de Información del JWT**
```javascript
// Utilidad para extraer información del JWT
const getJWTPayload = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      exp: payload.exp,
      iat: payload.iat
    };
  } catch (error) {
    console.error('Error decodificando JWT:', error);
    return null;
  }
};

// Verificar si el token ha expirado
const isTokenExpired = () => {
  const payload = getJWTPayload();
  if (!payload) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

// Obtener información del usuario actual
const getCurrentUser = () => {
  const payload = getJWTPayload();
  if (!payload || isTokenExpired()) {
    localStorage.removeItem('token');
    return null;
  }
  
  return {
    id: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role
  };
};
```

---

## 🚨 **MANEJO DE ERRORES**

### **Interceptor Global para Requests**
```javascript
// Función helper para requests con manejo de errores
const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    // Si el token expiró o es inválido
    if (response.status === 401) {
      localStorage.removeItem('token');
      // Redirigir al login
      window.location.href = '/login';
      return null;
    }
    
    // Si no hay permisos
    if (response.status === 403) {
      throw new Error('No tienes permisos para realizar esta acción');
    }
    
    // Si hay error del servidor
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en request:', error);
    throw error;
  }
};

// Ejemplo de uso:
const getPortfolioWithErrorHandling = async () => {
  try {
    const portfolio = await apiRequest('http://localhost:3000/api/portfolio');
    return portfolio;
  } catch (error) {
    // El error ya fue manejado por apiRequest
    alert(error.message);
    return null;
  }
};
```

---

## 🎯 **CHECKLIST DE COMPATIBILIDAD**

### **✅ Verificaciones Importantes:**

1. **JWT Token:**
   - ✅ El token contiene `userId`, `email`, `role`, `name`
   - ✅ Se incluye en header `Authorization: Bearer <token>`
   - ✅ Se maneja la expiración (6 horas)

2. **CORS:**
   - ✅ Frontend permitido en CORS del backend
   - ✅ Headers correctos en las requests

3. **Endpoints:**
   - ✅ Todos los endpoints documentados están disponibles
   - ✅ Estructura de respuesta consistente
   - ✅ Códigos de error estándar

4. **Roles:**
   - ✅ Verificar rol `admin` para endpoints administrativos
   - ✅ Usuario normal tiene rol `user`

5. **Datos:**
   - ✅ Validar estructura de objetos antes de enviar
   - ✅ Manejar respuestas vacías o nulas
   - ✅ Parsear correctamente fechas ISO

---

## 🚀 **PRÓXIMOS PASOS RECOMENDADOS**

1. **Implementar interceptores HTTP en tu framework frontend**
2. **Crear servicios/hooks reutilizables para cada módulo**
3. **Implementar manejo global de errores**
4. **Configurar auto-refresh de tokens**
5. **Implementar loading states para UX**
6. **Agregar validación client-side con los mismos DTOs**

El backend está **100% listo** para integración. Todos los endpoints funcionan correctamente y el sistema de autenticación está completamente compatible con cualquier frontend moderno. 🎉
