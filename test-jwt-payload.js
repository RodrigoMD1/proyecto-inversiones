// Script para probar que el JWT contiene toda la información necesaria
// Ejecutar con: node test-jwt-payload.js

const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3000/api';

// Credenciales de prueba
const TEST_USER = {
    email: 'admin@test.com',
    password: 'AdminPass123!'
};

async function testJWTPayload() {
    console.log('🔍 PROBANDO JWT PAYLOAD COMPLETO\n');
    
    try {
        // 1. HACER LOGIN
        console.log('1️⃣ HACIENDO LOGIN...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
        
        console.log('✅ Login exitoso!');
        console.log('📋 Respuesta completa del login:', {
            id: loginResponse.data.id,
            email: loginResponse.data.email,
            name: loginResponse.data.name,
            roles: loginResponse.data.roles,
            isActive: loginResponse.data.isActive,
            emailVerified: loginResponse.data.emailVerified,
            token: loginResponse.data.token ? 'TOKEN_PRESENTE' : 'NO_TOKEN'
        });
        
        // 2. DECODIFICAR JWT SIN VERIFICAR (solo para ver el payload)
        console.log('\n2️⃣ DECODIFICANDO JWT PAYLOAD...');
        const token = loginResponse.data.token;
        const decodedPayload = jwt.decode(token);
        
        console.log('🔍 Payload del JWT:', decodedPayload);
        
        // 3. VERIFICAR QUE CONTIENE TODA LA INFO NECESARIA
        console.log('\n3️⃣ VERIFICANDO CONTENIDO DEL JWT...');
        
        const requiredFields = ['id', 'userId', 'email', 'role', 'roles', 'name'];
        let allFieldsPresent = true;
        
        requiredFields.forEach(field => {
            if (decodedPayload[field] !== undefined) {
                console.log(`✅ ${field}: ${JSON.stringify(decodedPayload[field])}`);
            } else {
                console.log(`❌ ${field}: FALTANTE`);
                allFieldsPresent = false;
            }
        });
        
        // 4. PROBAR QUE EL TOKEN FUNCIONA CON UN ENDPOINT PROTEGIDO
        console.log('\n4️⃣ PROBANDO TOKEN CON ENDPOINT PROTEGIDO...');
        
        const protectedResponse = await axios.get(`${BASE_URL}/auth/check-status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('✅ Endpoint protegido funciona!');
        console.log('📋 Datos del usuario desde token:', {
            id: protectedResponse.data.id,
            email: protectedResponse.data.email,
            name: protectedResponse.data.name,
            roles: protectedResponse.data.roles
        });
        
        // 5. PROBAR ENDPOINT ADMIN SI ES ADMIN
        if (loginResponse.data.roles && loginResponse.data.roles.includes('admin')) {
            console.log('\n5️⃣ PROBANDO ENDPOINT ADMIN...');
            
            try {
                const adminResponse = await axios.get(`${BASE_URL}/admin/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                console.log('✅ Endpoint admin funciona!');
                console.log('📊 Estadísticas:', adminResponse.data);
            } catch (adminError) {
                console.log('❌ Error en endpoint admin:', adminError.response?.data);
            }
        }
        
        // RESUMEN FINAL
        console.log('\n🎯 RESUMEN FINAL:');
        if (allFieldsPresent) {
            console.log('✅ JWT contiene TODA la información necesaria');
            console.log('✅ El frontend puede extraer roles, email, name del token');
            console.log('✅ Sistema de autenticación completo');
        } else {
            console.log('❌ JWT NO contiene toda la información necesaria');
            console.log('⚠️ Revisar el backend para incluir campos faltantes');
        }
        
    } catch (error) {
        console.error('\n❌ ERROR EN LAS PRUEBAS:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

// Ejecutar las pruebas
testJWTPayload();
