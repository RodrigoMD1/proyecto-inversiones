const https = require('http');

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

async function testWithCorrectData() {
  try {
    console.log('Ì≥ù 1. Creando usuario...');
    const registerResponse = await makeRequest('POST', '/api/auth/registro', {}, {
      email: 'test.portfolio.user@example.com',
      password: 'TestPassword123!',
      name: 'Usuario Portfolio Test'
    });
    
    if (registerResponse.status !== 201) {
      console.log('Email ya existe, continuando con login...');
    }
    
    const loginResponse = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'test.portfolio.user@example.com',
      password: 'TestPassword123!'
    });
    
    if (loginResponse.status !== 201) {
      console.log('‚ùå Login fall√≥');
      return;
    }
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.id;
    console.log('‚úÖ Login exitoso');
    
    console.log('Ì≥à 2. Creando portfolio item...');
    const portfolioResponse = await makeRequest('POST', '/api/portfolio', {
      'Authorization': `Bearer ${token}`
    }, {
      name: 'Apple Stock',
      description: 'Investment in Apple Inc.',
      type: 'stock',
      quantity: 10,
      purchase_price: 150.50,
      user_id: userId,
      purchase_date: '2025-01-01',
      ticker: 'AAPL'
    });
    
    console.log('Portfolio Status:', portfolioResponse.status);
    console.log('Portfolio Response:', JSON.stringify(portfolioResponse.data, null, 2));
    
    if (portfolioResponse.status === 201) {
      console.log('‚úÖ Portfolio creado exitosamente!');
    }
    
  } catch (error) {
    console.error('‚ùå Error:', error.message);
  }
}

testWithCorrectData();
