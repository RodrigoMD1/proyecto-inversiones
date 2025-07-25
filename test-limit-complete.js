const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testAssetLimitComplete() {
  try {
    console.log('🧪 Test completo de límite de assets...');
    
    // 1. Login con usuario existente
    console.log('📝 1. Login con usuario existente...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'test.portfolio.user@example.com',
      password: 'TestPassword123!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');
    
    // Headers con autenticación
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Verificar uso actual
    console.log('📊 2. Verificando uso actual...');
    let usageResponse = await axios.get(`${API_URL}/subscriptions/usage`, { headers });
    console.log(`Assets actuales: ${usageResponse.data.current_assets}/${usageResponse.data.limit}`);
    console.log('Puede agregar más:', usageResponse.data.can_add_more);

    // 3. Crear assets hasta llegar al límite
    const currentAssets = usageResponse.data.current_assets;
    const limit = usageResponse.data.limit;
    const assetsToCreate = limit - currentAssets;
    
    console.log(`🔄 3. Creando ${assetsToCreate} assets hasta llegar al límite...`);
    
    let createdCount = 0;
    for (let i = 0; i < assetsToCreate; i++) {
      const portfolioData = {
        name: `Asset Límite ${i + 1}`,
        description: `Asset de prueba para límite número ${i + 1}`,
        type: 'stock',
        quantity: 10,
        purchase_price: 100.0,
        purchase_date: '2025-01-01T00:00:00.000Z',
        ticker: `LMT${i + 1}`
      };

      try {
        const response = await axios.post(`${API_URL}/portfolio`, portfolioData, { headers });
        console.log(`✅ Asset ${i + 1} creado (ID: ${response.data.id})`);
        createdCount++;
      } catch (error) {
        console.log(`❌ Error creando asset ${i + 1}:`, error.response?.data?.message || error.message);
        break;
      }
    }

    // 4. Verificar uso después de crear hasta el límite
    console.log('📊 4. Verificando uso después de crear hasta el límite...');
    usageResponse = await axios.get(`${API_URL}/subscriptions/usage`, { headers });
    console.log(`Assets actuales: ${usageResponse.data.current_assets}/${usageResponse.data.limit}`);
    console.log('Puede agregar más:', usageResponse.data.can_add_more);

    // 5. Intentar crear un asset más (debería fallar)
    console.log('🚫 5. Intentando crear asset adicional (debería fallar por límite)...');
    const extraAssetData = {
      name: 'Asset Extra',
      description: 'Este asset debería ser rechazado por límite',
      type: 'stock',
      quantity: 1,
      purchase_price: 50.0,
      purchase_date: '2025-01-01T00:00:00.000Z',
      ticker: 'EXTRA'
    };

    try {
      const response = await axios.post(`${API_URL}/portfolio`, extraAssetData, { headers });
      console.log('❌ ERROR: El asset extra fue creado cuando debería haber sido rechazado:', response.data);
    } catch (error) {
      console.log('✅ Límite de assets funcionando correctamente!');
      console.log('Mensaje:', error.response?.data?.message || error.message);
      console.log('Status:', error.response?.status);
    }

    // 6. Verificar uso final
    console.log('📊 6. Verificando uso final...');
    const finalUsageResponse = await axios.get(`${API_URL}/subscriptions/usage`, { headers });
    console.log(`Assets finales: ${finalUsageResponse.data.current_assets}/${finalUsageResponse.data.limit}`);
    console.log('Puede agregar más:', finalUsageResponse.data.can_add_more);

    console.log('\n🎉 Test completado exitosamente!');
    console.log(`📈 Resumen: Se crearon ${createdCount} assets adicionales antes de llegar al límite`);

  } catch (error) {
    console.error('❌ Error en el test:', error.response?.data || error.message);
  }
}

testAssetLimitComplete();
