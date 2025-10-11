# 🚨 FIX REQUERIDO EN FRONTEND

## Problema Detectado

El frontend está haciendo **GET** pero el backend espera **POST**:

```
❌ GET https://proyecto-inversiones.onrender.com/api/portfolio/report/generate 404 (Not Found)
```

Error del backend:
```json
{
  "message": "Cannot GET /api/portfolio/report/generate",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## ✅ Solución

### Archivo: `reportsService.ts` (línea ~236)

**ANTES (INCORRECTO):**
```typescript
async downloadReport() {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    `${API_URL}/api/portfolio/report/generate`,
    {
      method: 'GET',  // ❌ INCORRECTO
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Informe_${Date.now()}.pdf`;
  a.click();
}
```

**DESPUÉS (CORRECTO):**
```typescript
async downloadReport() {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    `${API_URL}/api/portfolio/report/generate`,
    {
      method: 'POST',  // ✅ CORRECTO
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Informe_${Date.now()}.pdf`;
  a.click();
}
```

---

## 📝 Cambios Necesarios

1. **Cambiar `method: 'GET'` → `method: 'POST'`**
2. **Agregar header `'Content-Type': 'application/json'`**

---

## 🔍 Backend - Configuración Correcta (YA APLICADA)

### Endpoint:
```typescript
@UseGuards(JwtOptionalPreflightGuard)  // ✅ Permite OPTIONS preflight
@Post('generate')  // ✅ POST, no GET
async generateCompleteReport(@Req() req: Request, @Res() res: Response) {
  // ... genera PDF y lo devuelve
}
```

### CORS:
```typescript
app.enableCors({
  origin: ['http://localhost:5173', ...],  // ✅ Permite tu frontend
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',  // ✅ Permite POST y OPTIONS
  credentials: true,  // ✅ Permite cookies/auth
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],  // ✅ Permite tus headers
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],  // ✅ Para descarga
  preflightContinue: false,  // ✅ Manejo correcto de preflight
  optionsSuccessStatus: 204  // ✅ Código correcto para OPTIONS
});
```

### Guard Personalizado:
```typescript
// jwt-optional-preflight.guard.ts
@Injectable()
export class JwtOptionalPreflightGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // Si es OPTIONS (preflight), permitir sin autenticación
    if (request.method === 'OPTIONS') {
      return true;
    }
    
    // Para POST, validar JWT normalmente
    return super.canActivate(context);
  }
}
```

---

## 🚀 Pasos para Desplegar

### Backend (YA ESTÁ LISTO):
```bash
cd proyecto-afip
git add .
git commit -m "Fix: CORS y guard para preflight OPTIONS"
git push
```

Render.com detectará el push y desplegará automáticamente (~3-5 min).

### Frontend (REQUIERE CAMBIO):
1. Ir a `reportsService.ts`
2. Cambiar `method: 'GET'` → `method: 'POST'`
3. Agregar `'Content-Type': 'application/json'` a headers
4. Guardar y probar

---

## ✅ Verificación

Después de ambos cambios, deberías ver:

1. **En Network Tab (DevTools):**
   - `OPTIONS /api/portfolio/report/generate` → Status 204 ✅
   - `POST /api/portfolio/report/generate` → Status 200 ✅
   - Content-Type: application/pdf ✅
   - Content-Disposition: attachment ✅

2. **En Consola:**
   - Sin errores CORS ✅
   - PDF descargado correctamente ✅

---

## 🐛 Si Sigue Fallando

### Verificar Backend en Producción:
```bash
curl -X OPTIONS https://proyecto-inversiones.onrender.com/api/portfolio/report/generate \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  -v
```

Debería devolver:
```
< HTTP/2 204
< access-control-allow-origin: http://localhost:5173
< access-control-allow-methods: GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
< access-control-allow-credentials: true
```

### Verificar Frontend:
```javascript
// En DevTools Console
fetch('https://proyecto-inversiones.onrender.com/api/portfolio/report/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
}).then(r => console.log('Status:', r.status))
```

---

## 📊 Resumen

| Componente | Estado | Acción Requerida |
|------------|--------|------------------|
| Backend - Endpoint | ✅ Correcto | Deploy a Render.com |
| Backend - CORS | ✅ Correcto | Deploy a Render.com |
| Backend - Guard | ✅ Correcto | Deploy a Render.com |
| Frontend - Method | ❌ Incorrecto | Cambiar GET → POST |
| Frontend - Headers | ⚠️ Incompleto | Agregar Content-Type |

---

**IMPORTANTE**: Ambos cambios (backend deploy + frontend fix) son necesarios para que funcione correctamente.
