const https = require('http');

// Función para hacer peticiones HTTP
function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testMoreEndpoints() {
  try {
    console.log('🔐 1. Haciendo login...');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'test@example.com',
      password: 'TestPassword123!'
    });
    
    if (loginResponse.status !== 201 || !loginResponse.data.token) {
      console.log('❌ Login falló');
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');
    
    console.log('\n💳 2. Probando crear preferencia de pago...');
    const createPaymentResponse = await makeRequest('POST', '/api/payments/create', {
      'Authorization': `Bearer ${token}`
    });
    
    console.log('Create Payment Status:', createPaymentResponse.status);
    console.log('Create Payment Response:', JSON.stringify(createPaymentResponse.data, null, 2));
    
    console.log('\n❌ 3. Probando cancelar suscripción...');
    const cancelResponse = await makeRequest('POST', '/api/subscriptions/cancel', {
      'Authorization': `Bearer ${token}`
    });
    
    console.log('Cancel Subscription Status:', cancelResponse.status);
    console.log('Cancel Subscription Response:', JSON.stringify(cancelResponse.data, null, 2));
    
    console.log('\n📋 4. Verificando estado después de cancelación...');
    const currentSubResponse = await makeRequest('GET', '/api/subscriptions/current', {
      'Authorization': `Bearer ${token}`
    });
    
    console.log('Current Subscription Status after cancel:', currentSubResponse.status);
    console.log('Current Subscription Response after cancel:', JSON.stringify(currentSubResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

testMoreEndpoints();
