const axios = require('axios');

async function setupTestEmailVerification() {
  console.log('🧪 Configurando prueba de verificación de email...\n');

  try {
    // 1. Crear un usuario nuevo para la prueba
    console.log('1. Creando usuario de prueba...');
    const registerResponse = await axios.post('http://localhost:3000/api/auth/registro', {
      name: 'Test Email User',
      email: 'newemail@verification.com',
      password: 'TestPass123'
    });

    console.log('✅ Usuario creado:', {
      id: registerResponse.data.id,
      email: registerResponse.data.email,
      emailVerified: registerResponse.data.emailVerified
    });

    const token = registerResponse.data.token;

    // 2. Intentar crear un asset (debería fallar por email no verificado)
    console.log('\n2. Intentando crear asset con email no verificado...');
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
      
      console.log('❌ PROBLEMA: Asset creado sin verificar email:', createResponse.data);
      
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ CORRECTO: Creación bloqueada por email no verificado');
        console.log('   Mensaje:', error.response.data.message);
        
        // 3. Probar reenvío de verificación
        console.log('\n3. Probando reenvío de verificación...');
        try {
          const resendResponse = await axios.post(
            `http://localhost:3000/api/users/resend-verification/${registerResponse.data.id}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log('✅ Reenvío exitoso:', resendResponse.data.message);
        } catch (resendError) {
          console.log('❌ Error al reenviar:', resendError.response?.data || resendError.message);
        }
        
      } else {
        console.log('❌ Error inesperado:', error.response?.data || error.message);
      }
    }

    // 4. Verificar estado de suscripción
    console.log('\n4. Verificando estado de suscripción...');
    const usageResponse = await axios.get('http://localhost:3000/api/subscriptions/usage', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Estado de suscripción:', usageResponse.data);

    // 5. Simular verificación de email (para testing)
    console.log('\n5. Para continuar, necesitarías verificar el email desde el enlace enviado.');
    console.log('   El token de verificación se encuentra en la base de datos.');

  } catch (error) {
    console.log('❌ Error general:', error.response?.data || error.message);
  }
}

setupTestEmailVerification();
