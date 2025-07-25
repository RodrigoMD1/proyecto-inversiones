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

async function testAPI() {
  try {
    console.log('🔐 1. Haciendo login...');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'test@example.com',
      password: 'TestPassword123!'
    });
    
    console.log('Login Status:', loginResponse.status);
    console.log('Login Response:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.status !== 201 || !loginResponse.data.token) {
      console.log('❌ Login falló');
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso, token obtenido');
    
    // Test subscription endpoints
    console.log('\n📋 2. Probando endpoint de suscripción actual...');
    const currentSubResponse = await makeRequest('GET', '/api/subscriptions/current', {
      'Authorization': `Bearer ${token}`
    });
    
    console.log('Current Subscription Status:', currentSubResponse.status);
    console.log('Current Subscription Response:', JSON.stringify(currentSubResponse.data, null, 2));
    
    console.log('\n📊 3. Probando endpoint de uso...');
    const usageResponse = await makeRequest('GET', '/api/subscriptions/usage', {
      'Authorization': `Bearer ${token}`
    });
    
    console.log('Usage Status:', usageResponse.status);
    console.log('Usage Response:', JSON.stringify(usageResponse.data, null, 2));
    
    console.log('\n💳 4. Probando endpoint de historial de pagos...');
    const paymentsResponse = await makeRequest('GET', '/api/payments/history', {
      'Authorization': `Bearer ${token}`
    });
    
    console.log('Payments History Status:', paymentsResponse.status);
    console.log('Payments History Response:', JSON.stringify(paymentsResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

testAPI();
