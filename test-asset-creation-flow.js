const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';

async function testAssetCreationFlow() {
  console.log('=== TEST: Flujo Completo de Creación de Assets ===\n');

  try {
    // 1. Login
    console.log('1. Login...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rodrigo@gmail.com',
        password: 'Rodrigo123'
      })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.access_token;
    console.log('✓ Login exitoso\n');

    // 2. Listar assets existentes
    console.log('2. Verificando assets existentes...');
    const assetsRes = await fetch(`${API_URL}/assets`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const existingAssets = await assetsRes.json();
    console.log('Assets actuales:', JSON.stringify(existingAssets, null, 2));
    console.log('');

    // 3. Crear un asset de Apple correctamente
    console.log('3. Creando asset de Apple...');
    const createAssetRes = await fetch(`${API_URL}/assets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: 'stock',
        description: 'Technology company - iPhone, Mac, iPad'
      })
    });
    
    const newAsset = await createAssetRes.json();
    console.log('Nuevo asset creado:', JSON.stringify(newAsset, null, 2));
    console.log('');

    // 4. Crear portfolio item usando el assetId
    console.log('4. Creando portfolio item con assetId...');
    const portfolioRes = await fetch(`${API_URL}/portfolio`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        assetId: newAsset.id,
        quantity: 10,
        purchasePrice: 150.50,
        purchaseDate: '2025-01-15T00:00:00.000Z'
      })
    });
    
    const portfolioItem = await portfolioRes.json();
    console.log('Portfolio item creado:', JSON.stringify(portfolioItem, null, 2));
    console.log('');

    // 5. Verificar que se guardó correctamente
    console.log('5. Verificando portfolio...');
    const myPortfolioRes = await fetch(`${API_URL}/portfolio/my-portfolio`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const myPortfolio = await myPortfolioRes.json();
    console.log('Mi portfolio:', JSON.stringify(myPortfolio, null, 2));

    // 6. Análisis
    console.log('\n=== ANÁLISIS ===');
    const lastItem = myPortfolio[myPortfolio.length - 1];
    if (lastItem.name === 'Apple Inc.' && lastItem.ticker === 'AAPL') {
      console.log('✅ SUCCESS: El asset se guardó correctamente con nombre "Apple Inc." y ticker "AAPL"');
    } else {
      console.log('❌ ERROR: El asset se guardó con:');
      console.log(`   - Nombre: ${lastItem.name} (esperado: "Apple Inc.")`);
      console.log(`   - Ticker: ${lastItem.ticker} (esperado: "AAPL")`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar test
testAssetCreationFlow();
