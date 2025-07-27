// Script para probar que el JWT funciona exactamente como lo espera el frontend
// Ejecutar con: node test-jwt-frontend-compatibility.js

const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3000/api';

// Credenciales de prueba
const TEST_USER = {
    email: 'admin@test.com',
    password: 'AdminPass123!'
};

async function testJWTFrontendCompatibility() {
    console.log('🔍 PROBANDO COMPATIBILIDAD JWT CON FRONTEND\n');
    
    try {
        // 1. HACER LOGIN
        console.log('1️⃣ HACIENDO LOGIN...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
        
        console.log('✅ Login exitoso!');
        console.log('📋 Respuesta del backend:', {
            id: loginResponse.data.id,
            email: loginResponse.data.email,
            name: loginResponse.data.name,
            roles: loginResponse.data.roles,
            token: loginResponse.data.token ? 'PRESENTE' : 'AUSENTE'
        });
        
        // 2. DECODIFICAR JWT Y VERIFICAR CAMPOS EXACTOS
        console.log('\n2️⃣ VERIFICANDO PAYLOAD JWT...');
        const token = loginResponse.data.token;
        const decodedPayload = jwt.decode(token);
        
        console.log('🔍 Payload completo del JWT:', decodedPayload);
        
        // 3. VERIFICAR CAMPOS ESPECÍFICOS QUE ESPERA EL FRONTEND
        console.log('\n3️⃣ VERIFICANDO CAMPOS PARA EL FRONTEND...');
        
        // Estos son los campos que tu frontend está intentando leer
        const frontendFields = {
            'userId': decodedPayload.userId,
            'email': decodedPayload.email,
            'role': decodedPayload.role,
            'name': decodedPayload.name
        };
        
        let allFieldsValid = true;
        
        Object.entries(frontendFields).forEach(([field, value]) => {
            if (value !== undefined && value !== null) {
                console.log(`✅ ${field}: "${value}"`);
            } else {
                console.log(`❌ ${field}: ${value} (PROBLEMÁTICO)`);
                allFieldsValid = false;
            }
        });
        
        // 4. SIMULAR LO QUE HACE EL FRONTEND
        console.log('\n4️⃣ SIMULANDO FRONTEND...');
        
        // Simular jwt_decode en el frontend
        const frontendRoleExtraction = decodedPayload.role;
        const frontendEmailExtraction = decodedPayload.email;
        const frontendNameExtraction = decodedPayload.name;
        
        console.log('🎯 Lo que vería el frontend:');
        console.log(`  Role from token: ${frontendRoleExtraction}`);
        console.log(`  Email from token: ${frontendEmailExtraction}`);
        console.log(`  Name from token: ${frontendNameExtraction}`);
        
        // 5. PROBAR ENDPOINT PROTEGIDO
        console.log('\n5️⃣ PROBANDO ENDPOINT PROTEGIDO...');
        
        const protectedResponse = await axios.get(`${BASE_URL}/auth/check-status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('✅ Endpoint protegido funciona!');
        console.log('📋 Usuario desde JWT Strategy:', {
            id: protectedResponse.data.id,
            email: protectedResponse.data.email,
            name: protectedResponse.data.name,
            roles: protectedResponse.data.roles
        });
        
        // RESUMEN FINAL
        console.log('\n🎯 RESUMEN FINAL:');
        if (allFieldsValid) {
            console.log('✅ JWT contiene TODOS los campos que espera el frontend');
            console.log('✅ Ya NO debería haber "undefined" en el frontend');
            console.log('✅ Los valores son:');
            console.log(`   - Role from token: "${frontendRoleExtraction}"`);
            console.log(`   - Email from token: "${frontendEmailExtraction}"`);
            console.log(`   - Name from token: "${frontendNameExtraction}"`);
        } else {
            console.log('❌ Aún faltan campos en el JWT');
            console.log('⚠️ El frontend seguirá viendo "undefined"');
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
testJWTFrontendCompatibility();
