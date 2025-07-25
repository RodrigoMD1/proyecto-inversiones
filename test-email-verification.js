const axios = require('axios');

async function testEmailVerification() {
  console.log('🧪 Probando verificación de email...\n');

  try {
    // 1. Login del usuario de prueba
    console.log('1. Haciendo login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'rodrigo@test.com',
      password: '123456'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso\n');

    // 2. Primero, vamos a verificar el estado actual del usuario
    console.log('2. Verificando estado del usuario...');
    const statusResponse = await axios.get('http://localhost:3000/api/auth/check-status', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Estado del usuario:', {
      id: statusResponse.data.id,
      email: statusResponse.data.email,
      emailVerified: statusResponse.data.emailVerified
    });

    // 3. Intentar crear un asset (debería fallar si email no está verificado)
    console.log('\n3. Intentando crear asset...');
    try {
      const createResponse = await axios.post('http://localhost:3000/api/portfolio', 
        {
          name: 'Test Asset Email Verification',
          description: 'Asset para probar verificación',
          type: 'stock',
          quantity: 10,
          purchase_price: 100,
          purchase_date: '2025-01-25',
          ticker: 'TEST'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Asset creado (email verificado):', createResponse.data);
      
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('❌ Creación bloqueada:', error.response.data.message);
        
        // Si el error es por email no verificado, mostrar cómo reenviar verificación
        if (error.response.data.message.includes('verificar tu email')) {
          console.log('\n4. Email no verificado. Probando reenvío de verificación...');
          
          try {
            const resendResponse = await axios.post(
              `http://localhost:3000/api/users/resend-verification/${statusResponse.data.id}`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('✅ Reenvío exitoso:', resendResponse.data.message);
          } catch (resendError) {
            console.log('❌ Error al reenviar:', resendError.response?.data || resendError.message);
          }
        }
      } else {
        console.log('❌ Error inesperado:', error.response?.data || error.message);
      }
    }

    // 5. Verificar uso de suscripción
    console.log('\n5. Verificando estado de suscripción...');
    const usageResponse = await axios.get('http://localhost:3000/api/subscriptions/usage', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Estado de suscripción:', usageResponse.data);

  } catch (error) {
    console.log('❌ Error general:', error.response?.data || error.message);
  }
}

testEmailVerification();
