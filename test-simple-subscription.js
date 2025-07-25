const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testSimple() {
  try {
    console.log('🧪 Test simple de suscripciones...');
    
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

    // 2. Verificar suscripción actual
    console.log('📊 2. Verificando suscripción actual...');
    const subscriptionResponse = await axios.get(`${API_URL}/subscriptions/current`, { headers });
    console.log('Plan:', subscriptionResponse.data.plan);
    console.log('Asset Limit:', subscriptionResponse.data.asset_limit);

    // 3. Verificar uso actual
    console.log('📊 3. Verificando uso actual...');
    const usageResponse = await axios.get(`${API_URL}/subscriptions/usage`, { headers });
    console.log('Assets actuales:', usageResponse.data.current_assets);
    console.log('Límite:', usageResponse.data.limit);
    console.log('Puede agregar más:', usageResponse.data.can_add_more);

    // 4. Intentar crear un portfolio item
    console.log('🔄 4. Intentando crear portfolio item...');
    const portfolioData = {
      name: 'Test Limit Asset',
      description: 'Asset para probar límite',
      type: 'stock',
      quantity: 10,
      purchase_price: 100.0,
      purchase_date: '2025-01-01T00:00:00.000Z',
      ticker: 'TESTLIMIT'
    };

    try {
      const response = await axios.post(`${API_URL}/portfolio`, portfolioData, { headers });
      console.log('✅ Asset creado:', response.data.id);
      
      // Verificar uso después de crear
      const finalUsageResponse = await axios.get(`${API_URL}/subscriptions/usage`, { headers });
      console.log('Assets después de crear:', finalUsageResponse.data.current_assets);
      console.log('Puede agregar más:', finalUsageResponse.data.can_add_more);
      
    } catch (error) {
      console.log('❌ Error creando asset:', error.response?.data?.message || error.message);
      console.log('Status:', error.response?.status);
    }

  } catch (error) {
    console.error('❌ Error en el test:', error.response?.data || error.message);
  }
}

testSimple();
