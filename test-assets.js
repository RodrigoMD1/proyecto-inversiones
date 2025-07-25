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

async function testAssetLimit() {
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
    const userId = loginResponse.data.id;
    console.log('✅ Login exitoso');
    
    // Primero verificamos el límite actual
    console.log('\n📊 2. Verificando límite actual...');
    const usageResponse = await makeRequest('GET', '/api/subscriptions/usage', {
      'Authorization': `Bearer ${token}`
    });
    
    console.log('Usage:', JSON.stringify(usageResponse.data, null, 2));
    
    // Vamos a crear algunos portfolio items
    console.log('\n📈 3. Creando portfolio items para probar el límite...');
    
    for (let i = 1; i <= 6; i++) {
      console.log(`\n   Creando portfolio item ${i}...`);
      const createPortfolioResponse = await makeRequest('POST', '/api/portfolio', {
        'Authorization': `Bearer ${token}`
      }, {
        name: `Asset Portfolio ${i}`,
        description: `Descripción del portfolio ${i}`,
        type: 'stock',
        quantity: 10,
        purchase_price: 100.50,
        current_price: 105.75,
        ticker: `TEST${i}`
      });
      
      console.log(`   Portfolio Item ${i} Status:`, createPortfolioResponse.status);
      if (createPortfolioResponse.status !== 201) {
        console.log(`   Portfolio Item ${i} Error:`, JSON.stringify(createPortfolioResponse.data, null, 2));
        break;
      } else {
        console.log(`   ✅ Portfolio Item ${i} creado: ${createPortfolioResponse.data.name || 'Sin nombre'}`);
      }
    }
    
    // Verificamos el uso después de crear portfolio items
    console.log('\n📊 4. Verificando uso después de crear portfolio items...');
    const finalUsageResponse = await makeRequest('GET', '/api/subscriptions/usage', {
      'Authorization': `Bearer ${token}`
    });
    
    console.log('Final Usage:', JSON.stringify(finalUsageResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

testAssetLimit();
