/* eslint-disable @typescript-eslint/no-var-requires */
const axios = require('axios');

async function testCompleteEmailFlow() {
  console.log('🧪 Probando flujo completo de verificación de email...\n');
  
  const uniqueEmail = `test${Date.now()}@verification.com`;

  try {
    // 1. Crear usuario
    console.log('1. Creando usuario de prueba...');
    const registerResponse = await axios.post('http://localhost:3000/api/auth/registro', {
      name: 'Test Email User',
      email: uniqueEmail,
      password: 'TestPass123'
    });

    console.log('✅ Usuario creado:', {
      id: registerResponse.data.id,
      email: registerResponse.data.email,
      emailVerified: registerResponse.data.emailVerified
    });

    const token = registerResponse.data.token;
    const userId = registerResponse.data.id;

    // 2. Intentar crear asset sin verificar email
    console.log('\n2. Intentando crear asset SIN verificar email...');
    try {
      await axios.post('http://localhost:3000/api/portfolio', 
        {
          name: 'Test Asset',
          description: 'Asset de prueba',
          type: 'stock',
          quantity: 10,
          purchase_price: 100,
          purchase_date: '2025-01-25',
          ticker: 'TEST'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('❌ PROBLEMA: Asset creado sin verificar email');
    } catch (error) {
      if (error.response?.status === 403 && error.response.data.message.includes('verificar tu email')) {
        console.log('✅ CORRECTO: Bloqueado por email no verificado');
        console.log('   Mensaje:', error.response.data.message);
      } else {
        console.log('❌ Error inesperado:', error.response?.data || error.message);
      }
    }

    // 3. Reenviar verificación
    console.log('\n3. Solicitando reenvío de verificación...');
    const resendResponse = await axios.post(
      `http://localhost:3000/api/users/resend-verification/${userId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Reenvío exitoso:', resendResponse.data.message);
    
    let verificationToken = null;
    if (resendResponse.data.verificationToken) {
      verificationToken = resendResponse.data.verificationToken;
      console.log('🔑 Token de verificación (para prueba):', verificationToken);
    }

    // 4. Verificar email usando el token
    if (verificationToken) {
      console.log('\n4. Verificando email con el token...');
      const verifyResponse = await axios.get(`http://localhost:3000/api/users/verify-email?token=${verificationToken}`);
      console.log('✅ Email verificado:', verifyResponse.data.message);

      // 5. Ahora intentar crear asset CON email verificado
      console.log('\n5. Intentando crear asset CON email verificado...');
      try {
        const createResponse = await axios.post('http://localhost:3000/api/portfolio', 
          {
            name: 'Test Asset Verificado',
            description: 'Asset después de verificar email',
            type: 'stock',
            quantity: 5,
            purchase_price: 50,
            purchase_date: '2025-01-25',
            ticker: 'VERIFIED'
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('✅ ÉXITO: Asset creado después de verificar email:', {
          id: createResponse.data.id,
          name: createResponse.data.name,
          ticker: createResponse.data.ticker
        });

        // 6. Verificar estado de suscripción actualizado
        console.log('\n6. Verificando uso actualizado de suscripción...');
        const usageResponse = await axios.get('http://localhost:3000/api/subscriptions/usage', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Estado actualizado:', usageResponse.data);

      } catch (error) {
        console.log('❌ Error al crear asset verificado:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.log('❌ Error general:', error.response?.data || error.message);
  }
}

testCompleteEmailFlow();
