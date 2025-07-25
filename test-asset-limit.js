const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Datos del usuario de prueba
const testUser = {
  email: 'test.limit.user@example.com',
  password: 'TestPassword123!',
  name: 'Usuario Límite Test'
};

async function testAssetLimit() {
  try {
    console.log('🧪 Probando límite de assets...');
    
    // 1. Crear usuario
    console.log('📝 1. Creando usuario...');
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/registro`, testUser);
      console.log('✅ Usuario creado');
    } catch (error) {
      if (error.response?.data?.message === 'El usuario ya existe') {
        console.log('Email ya existe, continuando con login...');
      } else {
        throw error;
      }
    }

    // 2. Login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');
    
    // Headers con autenticación
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 3. Verificar suscripción actual
    console.log('📊 3. Verificando suscripción actual...');
    const subscriptionResponse = await axios.get(`${API_URL}/subscriptions/current`, { headers });
    console.log('Plan:', subscriptionResponse.data.plan);
    console.log('Asset Limit:', subscriptionResponse.data.asset_limit);

    // 4. Verificar uso actual
    const usageResponse = await axios.get(`${API_URL}/subscriptions/usage`, { headers });
    console.log('Assets actuales:', usageResponse.data.current_assets);
    console.log('Límite:', usageResponse.data.limit);
    console.log('Puede agregar más:', usageResponse.data.can_add_more);

    // 5. Crear assets hasta el límite
    const currentAssets = usageResponse.data.current_assets;
    const limit = usageResponse.data.limit;
    const assetsToCreate = limit - currentAssets;
    
    console.log(`🔄 4. Creando ${assetsToCreate} assets adicionales hasta llegar al límite...`);
    
    for (let i = 0; i < assetsToCreate; i++) {
      const portfolioData = {
        name: `Test Asset ${i + 1}`,
        description: `Asset de prueba número ${i + 1}`,
        type: 'stock',
        quantity: 10,
        purchase_price: 100.0,
        purchase_date: '2025-01-01T00:00:00.000Z',
        ticker: `TEST${i + 1}`
      };

      try {
        const response = await axios.post(`${API_URL}/portfolio`, portfolioData, { headers });
        console.log(`✅ Asset ${i + 1} creado (ID: ${response.data.id})`);
      } catch (error) {
        console.log(`❌ Error creando asset ${i + 1}:`, error.response?.data?.message || error.message);
        break;
      }
    }

    // 6. Intentar crear un asset más (debería fallar)
    console.log('🚫 5. Intentando crear asset adicional (debería fallar)...');
    const extraAssetData = {
      name: 'Asset Extra',
      description: 'Este asset debería ser rechazado',
      type: 'stock',
      quantity: 1,
      purchase_price: 50.0,
      purchase_date: '2025-01-01T00:00:00.000Z',
      ticker: 'EXTRA'
    };

    try {
      const response = await axios.post(`${API_URL}/portfolio`, extraAssetData, { headers });
      console.log('❌ ERROR: El asset extra fue creado cuando no debería:', response.data);
    } catch (error) {
      console.log('✅ Límite de assets funcionando correctamente!');
      console.log('Mensaje:', error.response?.data?.message || error.message);
      console.log('Status:', error.response?.status);
    }

    // 7. Verificar uso final
    console.log('📊 6. Verificando uso final...');
    const finalUsageResponse = await axios.get(`${API_URL}/subscriptions/usage`, { headers });
    console.log('Assets finales:', finalUsageResponse.data.current_assets);
    console.log('Límite:', finalUsageResponse.data.limit);
    console.log('Puede agregar más:', finalUsageResponse.data.can_add_more);

  } catch (error) {
    console.error('❌ Error en el test:', error.response?.data || error.message);
  }
}

testAssetLimit();
