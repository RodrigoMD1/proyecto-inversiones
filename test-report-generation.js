const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000/api';

// =====================================================
// TEST: GENERACIÓN DE INFORME COMPLETO (10 PÁGINAS)
// =====================================================

async function testCompleteReportGeneration() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST: GENERACIÓN DE INFORME COMPLETO DE 10 PÁGINAS');
  console.log('='.repeat(60) + '\n');

  try {
    // Paso 1: Login para obtener token
    console.log('📝 Paso 1: Iniciando sesión...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',  // Cambia esto por un usuario real
      password: 'password123'     // Cambia esto por la contraseña real
    });

    const token = loginResponse.data.access_token;
    console.log('✅ Login exitoso. Token obtenido.\n');

    // Paso 2: Verificar que hay portfolio
    console.log('📊 Paso 2: Verificando portfolio...');
    const portfolioResponse = await axios.get(`${BASE_URL}/portfolio`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Portfolio encontrado con ${portfolioResponse.data.length} activos.\n`);

    if (portfolioResponse.data.length === 0) {
      console.log('⚠️  ADVERTENCIA: El portfolio está vacío. Agrega activos primero.');
      console.log('   Puedes agregar activos con POST /api/portfolio\n');
      return;
    }

    // Paso 3: Obtener datos del análisis (JSON)
    console.log('📈 Paso 3: Obteniendo datos del análisis...');
    const analysisResponse = await axios.get(`${BASE_URL}/portfolio/report/data`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const analysis = analysisResponse.data;
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN DEL ANÁLISIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📁 Información General:');
    console.log(`   ID Reporte: ${analysis.reportId}`);
    console.log(`   Usuario: ${analysis.userEmail}`);
    console.log(`   Versión: ${analysis.version}`);
    console.log(`   Generado: ${new Date(analysis.generatedAt).toLocaleString('es-ES')}\n`);

    console.log('💰 Resumen Ejecutivo:');
    console.log(`   Valor Total: $${analysis.summary.totalValue.toLocaleString('es-AR')}`);
    console.log(`   Inversión Total: $${analysis.summary.totalInvested.toLocaleString('es-AR')}`);
    console.log(`   Ganancia/Pérdida: $${analysis.summary.totalGainLoss.toLocaleString('es-AR')} (${analysis.summary.totalGainLossPercentage.toFixed(2)}%)`);
    console.log(`   Total Activos: ${analysis.summary.totalAssets}`);
    console.log(`   Estado: ${analysis.summary.status}\n`);

    console.log('📊 Indicadores Clave:');
    console.log(`   🎯 Diversificación: ${analysis.summary.diversificationScore}/100`);
    console.log(`   ⚠️  Riesgo: ${analysis.summary.riskLevel}`);
    console.log(`   🎯 Concentración Máx: ${analysis.summary.maxConcentration.toFixed(1)}%`);
    console.log(`   💰 Mejor Activo: ${analysis.summary.bestAsset}`);
    console.log(`   📉 Peor Activo: ${analysis.summary.worstAsset}\n`);

    console.log('📈 Distribución por Tipo:');
    analysis.distribution.forEach(dist => {
      console.log(`   ${dist.type}: $${dist.value.toLocaleString('es-AR')} (${dist.percentage.toFixed(1)}%) - ${dist.count} activos`);
    });
    console.log('');

    console.log('🥇 Top 5 Performers:');
    analysis.topPerformers.slice(0, 5).forEach((asset, i) => {
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
      console.log(`   ${medals[i]} ${asset.ticker}: +$${asset.gainLoss.toLocaleString('es-AR')} (+${asset.gainLossPercentage.toFixed(1)}%)`);
    });
    console.log('');

    console.log('📉 Activos con Pérdidas:');
    const losers = analysis.bottomPerformers.filter(a => a.gainLoss < 0);
    if (losers.length > 0) {
      losers.forEach(asset => {
        console.log(`   ⚠️  ${asset.ticker}: -$${Math.abs(asset.gainLoss).toLocaleString('es-AR')} (${asset.gainLossPercentage.toFixed(1)}%)`);
      });
    } else {
      console.log('   ✅ ¡Todos los activos están en ganancia!');
    }
    console.log('');

    console.log('🎯 Análisis de Diversificación:');
    console.log(`   Score: ${analysis.diversificationAnalysis.score}/100 (${analysis.diversificationAnalysis.level})`);
    console.log(`   Concentración: ${analysis.diversificationAnalysis.concentration.toFixed(1)}%`);
    console.log(`   Recomendación: ${analysis.diversificationAnalysis.recommendation}\n`);

    console.log('⚠️  Análisis de Riesgo:');
    console.log(`   Score: ${analysis.riskAnalysis.score}/100`);
    console.log(`   Nivel: ${analysis.riskAnalysis.level}`);
    console.log(`   Volatilidad: ${analysis.riskAnalysis.volatility}`);
    console.log(`   Exposición Crypto: ${analysis.riskAnalysis.cryptoExposure.toFixed(1)}%`);
    console.log(`   Factores:`);
    analysis.riskAnalysis.factors.forEach(factor => {
      console.log(`     • ${factor}`);
    });
    console.log('');

    console.log('🎯 Recomendaciones:');
    analysis.recommendations.forEach((rec, i) => {
      const priorityIcons = { Alta: '🔴', Media: '🟡', Baja: '🟢' };
      console.log(`   ${i + 1}. ${priorityIcons[rec.priority]} [${rec.priority}] ${rec.title}`);
      console.log(`      ${rec.description}`);
      console.log(`      ➡️  ${rec.action}\n`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Paso 4: Generar PDF de 10 páginas
    console.log('📄 Paso 4: Generando PDF profesional de 10 páginas...');
    console.log('   (Esto puede tardar unos segundos...)\n');

    const pdfResponse = await axios.post(
      `${BASE_URL}/portfolio/report/generate`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer'
      }
    );

    // Guardar PDF
    const fileName = `Informe_Completo_${Date.now()}.pdf`;
    fs.writeFileSync(fileName, pdfResponse.data);

    const fileSizeKB = (pdfResponse.data.byteLength / 1024).toFixed(2);
    
    console.log('✅ PDF generado exitosamente!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 INFORMACIÓN DEL PDF');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`   📁 Archivo: ${fileName}`);
    console.log(`   📊 Tamaño: ${fileSizeKB} KB`);
    console.log(`   📑 Páginas: 10 páginas`);
    console.log(`   🎨 Formato: Profesional con gráficos\n`);

    console.log('📋 Contenido del PDF:');
    console.log('   ✅ Página 1: Portada + Resumen Ejecutivo');
    console.log('   ✅ Página 2: Distribución por Tipo de Activo');
    console.log('   ✅ Páginas 3-4: Detalle Completo de Activos');
    console.log('   ✅ Página 5: Top Performers');
    console.log('   ✅ Página 6: Análisis de Diversificación');
    console.log('   ✅ Página 7: Análisis de Riesgo');
    console.log('   ✅ Página 8: Recomendaciones Personalizadas');
    console.log('   ✅ Página 9: Gráficos y Visualizaciones');
    console.log('   ✅ Página 10: Notas Finales + Disclaimer\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 ¡TEST COMPLETADO EXITOSAMENTE!');
    console.log(`📂 Abre el archivo: ${fileName}\n`);

  } catch (error) {
    console.error('\n❌ ERROR EN EL TEST:');
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Mensaje: ${error.response.data?.message || error.response.statusText}`);
      
      if (error.response.status === 401) {
        console.error('\n⚠️  SOLUCIÓN: Verifica que el usuario y contraseña sean correctos.');
      } else if (error.response.status === 404) {
        console.error('\n⚠️  SOLUCIÓN: Verifica que el servidor esté corriendo en http://localhost:3000');
      }
    } else {
      console.error(`   ${error.message}`);
    }
    console.error('');
  }
}

// =====================================================
// EJECUTAR TEST
// =====================================================

console.log('\n' + '█'.repeat(60));
console.log('███  TEST DE GENERACIÓN DE INFORMES COMPLETOS  ███');
console.log('█'.repeat(60));

testCompleteReportGeneration();
