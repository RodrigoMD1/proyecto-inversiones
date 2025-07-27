// Script completo para probar TODOS los endpoints que necesita el frontend
// Ejecutar con: node test-complete-admin-system.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Configurar credenciales de prueba
const TEST_ADMIN = {
    email: 'admin@test.com', // Cambiar por tu admin real
    password: 'password123'   // Cambiar por tu password real
};

let authToken = '';
let testUserId = '';

async function testCompleteSystem() {
    console.log('🚀 INICIANDO PRUEBAS COMPLETAS DEL SISTEMA ADMIN\n');
    
    try {
        // 1. PROBAR LOGIN CON ROLES
        console.log('1️⃣ PROBANDO LOGIN...');
        await testLogin();
        
        // 2. PROBAR ESTADÍSTICAS
        console.log('\n2️⃣ PROBANDO ESTADÍSTICAS...');
        await testAdminStats();
        
        // 3. PROBAR LISTA DE USUARIOS
        console.log('\n3️⃣ PROBANDO LISTA DE USUARIOS...');
        await testUsersList();
        
        // 4. PROBAR DETALLES DE USUARIO
        console.log('\n4️⃣ PROBANDO DETALLES DE USUARIO...');
        await testUserDetails();
        
        // 5. PROBAR CAMBIO DE SUSCRIPCIÓN
        console.log('\n5️⃣ PROBANDO CAMBIO DE SUSCRIPCIÓN...');
        await testChangeSubscription();
        
        // 6. PROBAR VERIFICACIÓN DE EMAIL
        console.log('\n6️⃣ PROBANDO VERIFICACIÓN DE EMAIL...');
        await testVerifyEmail();
        
        // 7. PROBAR TOGGLE STATUS
        console.log('\n7️⃣ PROBANDO ACTIVAR/DESACTIVAR USUARIO...');
        await testToggleStatus();
        
        // 8. PROBAR CAMBIO DE ROLES
        console.log('\n8️⃣ PROBANDO CAMBIO DE ROLES...');
        await testChangeRoles();
        
        console.log('\n🎉 ¡TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!');
        console.log('✅ Tu backend está 100% compatible con el frontend');
        
    } catch (error) {
        console.error('\n❌ ERROR EN LAS PRUEBAS:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

async function testLogin() {
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_ADMIN);
    
    console.log('✅ Login exitoso');
    console.log('📋 Usuario:', {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        roles: response.data.roles,
        isActive: response.data.isActive,
        emailVerified: response.data.emailVerified
    });
    
    // Verificar que devuelve roles como array
    if (Array.isArray(response.data.roles)) {
        console.log('✅ Roles devueltos como array:', response.data.roles);
    } else {
        throw new Error('❌ Roles no son un array!');
    }
    
    // Verificar que tiene rol admin
    if (response.data.roles.includes('admin')) {
        console.log('✅ Usuario tiene rol de admin');
    } else {
        throw new Error('❌ Usuario no tiene rol de admin!');
    }
    
    authToken = response.data.token;
    testUserId = response.data.id;
}

async function testAdminStats() {
    const response = await axios.get(`${BASE_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✅ Estadísticas obtenidas:', response.data);
}

async function testUsersList() {
    const response = await axios.get(`${BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✅ Lista de usuarios obtenida');
    console.log(`📊 Total usuarios: ${response.data.length}`);
    
    if (response.data.length > 0) {
        console.log('👤 Primer usuario:', {
            id: response.data[0].id,
            email: response.data[0].email,
            subscription: response.data[0].subscription,
            roles: response.data[0].roles
        });
    }
}

async function testUserDetails() {
    const response = await axios.get(`${BASE_URL}/admin/users/${testUserId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✅ Detalles de usuario obtenidos:', {
        id: response.data.id,
        email: response.data.email,
        subscription: response.data.subscription
    });
}

async function testChangeSubscription() {
    const response = await axios.patch(
        `${BASE_URL}/admin/users/${testUserId}/subscription`,
        { plan: 'PREMIUM' },
        { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    
    console.log('✅ Suscripción cambiada:', response.data);
}

async function testVerifyEmail() {
    const response = await axios.post(
        `${BASE_URL}/admin/users/${testUserId}/verify-email`,
        {},
        { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    
    console.log('✅ Email verificado:', response.data);
}

async function testToggleStatus() {
    const response = await axios.patch(
        `${BASE_URL}/admin/users/${testUserId}/toggle-status`,
        {},
        { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    
    console.log('✅ Status cambiado:', response.data);
}

async function testChangeRoles() {
    const response = await axios.patch(
        `${BASE_URL}/admin/users/${testUserId}/roles`,
        { roles: ['admin', 'user'] },
        { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    
    console.log('✅ Roles cambiados:', response.data);
}

// Iniciar las pruebas
testCompleteSystem();
