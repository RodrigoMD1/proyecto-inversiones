// Archivo de prueba para verificar que el login devuelve los roles correctamente
// Ejecutar este archivo con: node test-login-roles.js

const axios = require('axios');

async function testLoginRoles() {
    try {
        console.log('🔍 Probando endpoint de login...');
        
        // Credenciales de prueba - ajustar según tu usuario admin
        const loginData = {
            email: 'admin@test.com', // Cambiar por tu email de admin
            password: 'password123'   // Cambiar por tu password
        };

        const response = await axios.post('http://localhost:3000/api/auth/login', loginData);
        
        console.log('✅ Login exitoso!');
        console.log('📋 Datos del usuario:');
        console.log('- ID:', response.data.user.id);
        console.log('- Email:', response.data.user.email);
        console.log('- Nombre:', response.data.user.name);
        console.log('- Activo:', response.data.user.isActive);
        console.log('- Email Verificado:', response.data.user.emailVerified);
        console.log('🔐 Roles:', response.data.user.roles);
        
        // Verificar que devuelve todos los roles
        if (response.data.user.roles && response.data.user.roles.length > 0) {
            console.log('✅ Los roles se están devolviendo correctamente:', response.data.user.roles);
            
            if (response.data.user.roles.includes('admin')) {
                console.log('🎯 Usuario tiene rol de ADMIN - Panel administrativo disponible');
            }
            if (response.data.user.roles.includes('user')) {
                console.log('👤 Usuario tiene rol de USER - Acceso básico disponible');
            }
        } else {
            console.log('❌ No se encontraron roles en la respuesta');
        }

        // Probar endpoint de admin con el token
        console.log('\n🔍 Probando acceso al panel de admin...');
        const token = response.data.token;
        
        const adminResponse = await axios.get('http://localhost:3000/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Acceso al panel de admin exitoso!');
        console.log('📊 Estadísticas:', adminResponse.data);

    } catch (error) {
        console.error('❌ Error en las pruebas:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

console.log('🚀 Iniciando pruebas de login y roles...\n');
testLoginRoles();
