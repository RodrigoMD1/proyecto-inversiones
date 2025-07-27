// Test para verificar el flujo correcto de verificación de email
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000/api';

async function testEmailVerificationFlow() {
  console.log('🚀 Iniciando test del flujo de verificación de email...\n');
  
  // Generar email único para prueba
  const uniqueEmail = `test${Date.now()}@example.com`;
  
  try {
    console.log('1️⃣ Registrando nuevo usuario...');
    const registerResponse = await fetch(`${API_URL}/auth/registro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: 'Test User Email Flow',
        email: uniqueEmail,
        password: 'testpassword123'
      })
    });

    const registerData = await registerResponse.json();
    console.log('✅ Usuario registrado:', {
      id: registerData.id,
      email: registerData.email,
      emailVerified: registerData.emailVerified
    });

    const userToken = registerData.token;
    const userId = registerData.id;

    // Verificar estado inicial del usuario en BD
    console.log('\n2️⃣ Verificando estado inicial del usuario...');
    const checkUserResponse = await fetch(`${API_URL}/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    const userData = await checkUserResponse.json();
    console.log('📊 Estado del usuario recién creado:');
    console.log(`   - Email: ${userData.email}`);
    console.log(`   - Email Verificado: ${userData.emailVerified}`);
    console.log(`   - Token de Verificación: ${userData.emailVerificationToken ? 'PRESENTE' : 'NULL'}`);

    if (userData.emailVerificationToken && !userData.emailVerified) {
      console.log('✅ CORRECTO: Token generado al enviar email, usuario no verificado');
    } else if (!userData.emailVerificationToken && !userData.emailVerified) {
      console.log('❌ PROBLEMA: No hay token pero tampoco se envió email');
    } else {
      console.log('⚠️ ESTADO INESPERADO del usuario');
    }

    // Probar reenvío de verificación
    console.log('\n3️⃣ Probando reenvío de verificación...');
    const resendResponse = await fetch(`${API_URL}/users/resend-verification/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    const resendData = await resendResponse.json();
    console.log('📧 Resultado del reenvío:', resendData);

    // Verificar que se puede crear assets (debería fallar por email no verificado)
    console.log('\n4️⃣ Intentando crear asset sin email verificado...');
    const assetResponse = await fetch(`${API_URL}/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        name: 'Test Asset',
        symbol: 'TEST',
        type: 'STOCK'
      })
    });

    const assetData = await assetResponse.json();
    if (assetResponse.status === 403) {
      console.log('✅ CORRECTO: Asset creation blocked - email not verified');
      console.log('   Mensaje:', assetData.message);
    } else {
      console.log('❌ PROBLEMA: Asset creation should be blocked');
      console.log('   Status:', assetResponse.status);
      console.log('   Data:', assetData);
    }

  } catch (error) {
    console.error('❌ Error en el test:', error.message);
  }
}

// Ejecutar el test
testEmailVerificationFlow();
