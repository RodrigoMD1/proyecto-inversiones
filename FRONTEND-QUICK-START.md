# 🚀 QUICK START - INTEGRACIÓN FRONTEND

## Para tu desarrollador frontend, envíale esto:

---

## 📡 NUEVO ENDPOINT DISPONIBLE

### **POST /api/portfolio/report/generate**

Genera un PDF profesional de 10 páginas con análisis completo del portfolio.

---

## 💻 CÓDIGO PARA COPIAR Y PEGAR

### **React/TypeScript:**

```typescript
// components/ReportButton.tsx
import { useState } from 'react';
import axios from 'axios';

export function ReportButton() {
  const [loading, setLoading] = useState(false);

  const downloadReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:3000/api/portfolio/report/generate',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Descargar archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Informe_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert('✅ Informe descargado correctamente');
    } catch (error) {
      alert('❌ Error generando informe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={downloadReport} 
      disabled={loading}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Generando...' : '📄 Descargar Informe Completo'}
    </button>
  );
}
```

### **Vanilla JavaScript:**

```javascript
async function downloadReport() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/api/portfolio/report/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Informe_${Date.now()}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
```

### **HTML Simple:**

```html
<button onclick="downloadReport()">
  📄 Descargar Informe Completo
</button>

<script>
async function downloadReport() {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('http://localhost:3000/api/portfolio/report/generate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Informe.pdf';
    a.click();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}
</script>
```

---

## 🎨 ESTILOS SUGERIDOS (TailwindCSS)

```tsx
// Botón principal
<button className="
  bg-gradient-to-r from-blue-600 to-blue-700
  text-white font-semibold
  px-6 py-3 rounded-lg
  shadow-lg hover:shadow-xl
  transform hover:scale-105
  transition-all duration-200
  flex items-center gap-2
">
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
  Descargar Informe Completo
</button>

// Botón loading
<button className="... opacity-50 cursor-not-allowed" disabled>
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
  </svg>
  Generando...
</button>
```

---

## 📊 OPCIONAL: Mostrar Dashboard de Análisis

### **GET /api/portfolio/report/data**

Obtiene JSON con todo el análisis (sin generar PDF):

```typescript
const { data } = await axios.get('/api/portfolio/report/data', {
  headers: { Authorization: `Bearer ${token}` }
});

// data contiene:
// - summary (resumen ejecutivo)
// - distribution (distribución por tipo)
// - assets (lista de activos)
// - topPerformers (top 5 mejores)
// - diversificationAnalysis (score 0-100)
// - riskAnalysis (nivel de riesgo)
// - recommendations (recomendaciones personalizadas)
```

### **Componente de Dashboard:**

```tsx
function Dashboard({ data }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Valor Total */}
      <Card>
        <h3>💰 Valor Total</h3>
        <p className="text-3xl font-bold">
          ${data.summary.totalValue.toLocaleString()}
        </p>
        <p className={data.summary.status === 'Positivo' ? 'text-green-600' : 'text-red-600'}>
          {data.summary.totalGainLoss >= 0 ? '+' : ''}
          ${data.summary.totalGainLoss.toLocaleString()} 
          ({data.summary.totalGainLossPercentage.toFixed(2)}%)
        </p>
      </Card>

      {/* Diversificación */}
      <Card>
        <h3>📊 Diversificación</h3>
        <div className="flex items-center gap-2">
          <Progress value={data.diversificationAnalysis.score} />
          <span>{data.diversificationAnalysis.score}/100</span>
        </div>
        <p className="text-sm">{data.diversificationAnalysis.level}</p>
      </Card>

      {/* Riesgo */}
      <Card>
        <h3>⚠️ Nivel de Riesgo</h3>
        <p className="text-2xl font-bold">{data.riskAnalysis.level}</p>
        <p className="text-sm">Score: {data.riskAnalysis.score}/100</p>
      </Card>
    </div>
  );
}
```

---

## 🎯 UBICACIONES SUGERIDAS

### **1. En la página de Portfolio:**
```
Portfolio > [Ver Detalle] [Descargar Informe ⬇️]
```

### **2. En el Dashboard principal:**
```
Dashboard > Card "Reportes" > [Descargar Informe Completo]
```

### **3. En menú de usuario:**
```
[Avatar] → Dropdown:
  - Mi Perfil
  - Configuración
  - Descargar Informe 📄
  - Cerrar Sesión
```

---

## ✅ CHECKLIST DE INTEGRACIÓN

- [ ] Agregar botón "Descargar Informe"
- [ ] Implementar función de descarga
- [ ] Agregar loading state
- [ ] Agregar manejo de errores
- [ ] (Opcional) Agregar dashboard con datos
- [ ] Testear con usuario real
- [ ] Verificar que descarga el PDF correctamente

---

## 🐛 TROUBLESHOOTING

### **Error 401 (Unauthorized)**
- Verificar que el token sea válido
- Verificar header `Authorization: Bearer ${token}`

### **Error 500 (Server Error)**
- Verificar que el usuario tenga activos en el portfolio
- Ver logs del backend para más detalles

### **El PDF no se descarga**
- Verificar `responseType: 'blob'` en la petición
- Verificar que el navegador permite descargas automáticas

### **El PDF está vacío**
- Verificar que el portfolio tenga activos
- Hacer `console.log(response)` para ver la respuesta

---

## 📱 EJEMPLO COMPLETO EN ACCIÓN

```tsx
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

export function CompleteReportButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const downloadReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Mostrar notificación de inicio
      toast({
        title: "⏳ Generando informe...",
        description: "Esto puede tardar unos segundos",
      });

      const response = await axios.post(
        'http://localhost:3000/api/portfolio/report/generate',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
          timeout: 30000 // 30 segundos de timeout
        }
      );

      // Crear link de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Informe_Portfolio_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Limpiar URL
      window.URL.revokeObjectURL(url);
      
      // Notificación de éxito
      toast({
        title: "✅ Informe descargado",
        description: "Tu informe de 10 páginas se descargó correctamente",
      });
    } catch (error) {
      console.error('Error:', error);
      
      toast({
        title: "❌ Error",
        description: error.response?.data?.message || "No se pudo generar el informe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={downloadReport} 
      disabled={loading}
      className="gap-2"
      size="lg"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Descargar Informe Completo
        </>
      )}
    </Button>
  );
}
```

---

## 🎉 ¡LISTO!

Con esto el frontend puede integrar el sistema de informes en 5 minutos.

**El PDF generado incluye:**
- ✅ 10 páginas profesionales
- ✅ 50+ métricas analizadas
- ✅ Gráficos y visualizaciones
- ✅ 5-10 recomendaciones personalizadas
- ✅ Análisis de riesgo y diversificación
- ✅ Top performers
- ✅ Disclaimer legal

**Valor percibido:** $50-100 USD en otras plataformas.

---

**¿Dudas?** Ver `FRONTEND-REPORTS-GUIDE.md` para documentación completa.
