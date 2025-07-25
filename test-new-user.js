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

async function testAssetLimitWithNewUser() {
  try {
    console.log('👤 1. Creando nuevo usuario...');
    const registerResponse = await makeRequest('POST', '/api/auth/registro', {}, {
      email: 'very.fresh.user@example.com',
      password: 'TestPassword123!',
      name: 'Usuario Super Fresco'
    });
    
    console.log('Register Status:', registerResponse.status);
    if (registerResponse.status !== 201 || !registerResponse.data.token) {
      console.log('❌ Registro falló:', JSON.stringify(registerResponse.data, null, 2));
      return;
    }
    
    const token = registerResponse.data.token;
    console.log('✅ Usuario creado exitosamente');
    
    // Verificamos el límite inicial
    console.log('\n📊 2. Verificando límite inicial...');
    const usageResponse = await makeRequest('GET', '/api/subscriptions/usage', {
      'Authorization': `Bearer ${token}`
    });
    
    console.log('Usage inicial:', JSON.stringify(usageResponse.data, null, 2));
    
    // Intentamos crear un portfolio item
    console.log('\n📈 3. Intentando crear primer portfolio item...');
    const createPortfolioResponse = await makeRequest('POST', '/api/portfolio', {
      'Authorization': `Bearer ${token}`
    }, {
      name: `Asset Portfolio 1`,
      description: `Descripción del portfolio 1`,
      type: 'stock',
      quantity: 10,
      purchase_price: 100.50,
      current_price: 105.75,
      ticker: `NEWTEST1`
    });
    
    console.log('Create Portfolio Status:', createPortfolioResponse.status);
    console.log('Create Portfolio Response:', JSON.stringify(createPortfolioResponse.data, null, 2));
    
    if (createPortfolioResponse.status === 201) {
      console.log('✅ Portfolio item creado exitosamente');
      
      // Verificamos el uso actualizado
      console.log('\n📊 4. Verificando uso después de crear item...');
      const updatedUsageResponse = await makeRequest('GET', '/api/subscriptions/usage', {
        'Authorization': `Bearer ${token}`
      });
      
      console.log('Usage actualizado:', JSON.stringify(updatedUsageResponse.data, null, 2));
    } else {
      console.log('❌ No se pudo crear el portfolio item');
    }
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

testAssetLimitWithNewUser();
