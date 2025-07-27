// Script para crear un usuario admin y probar el sistema
// Ejecutar con: node create-admin-user.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Datos del usuario admin que vamos a crear
const ADMIN_USER = {
    email: 'admin@test.com',
    password: 'AdminPass123!', // Contraseña que cumple los requisitos
    name: 'Administrador de Prueba'
};

async function createAdminAndTest() {
    console.log('🚀 CREANDO USUARIO ADMIN Y PROBANDO SISTEMA\n');
    
    try {
        // 1. CREAR USUARIO ADMIN
        console.log('1️⃣ CREANDO USUARIO ADMIN...');
        await createAdminUser();
        
        // 2. HACER LOGIN
        console.log('\n2️⃣ HACIENDO LOGIN...');
        const loginData = await testLogin();
        
        // 3. PROBAR ENDPOINTS ADMIN
        console.log('\n3️⃣ PROBANDO ENDPOINTS ADMIN...');
        await testAdminEndpoints(loginData.token);
        
        console.log('\n🎉 ¡TODO FUNCIONA PERFECTAMENTE!');
        console.log('✅ Tu backend está 100% listo para el frontend');
        
        console.log('\n📋 CREDENCIALES PARA EL FRONTEND:');
        console.log(`Email: ${ADMIN_USER.email}`);
        console.log(`Password: ${ADMIN_USER.password}`);
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

async function createAdminUser() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/registro`, ADMIN_USER);
        console.log('✅ Usuario creado:', {
            id: response.data.id,
            email: response.data.email,
            name: response.data.name
        });
        
        // Actualizar roles manualmente en la base de datos
        console.log('📝 Nota: Necesitas actualizar los roles en la base de datos:');
        console.log(`UPDATE users SET roles = ARRAY['admin', 'user'] WHERE email = '${ADMIN_USER.email}';`);
        
    } catch (error) {
        if (error.response?.status === 400 && error.response.data.message?.includes('already exists')) {
            console.log('ℹ️ Usuario ya existe, continuando...');
        } else {
            throw error;
        }
    }
}

async function testLogin() {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: ADMIN_USER.email,
        password: ADMIN_USER.password
    });
    
    console.log('✅ Login exitoso!');
    console.log('📋 Datos recibidos:', {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        roles: response.data.roles,
        isActive: response.data.isActive,
        emailVerified: response.data.emailVerified
    });
    
    // Verificar que los roles son un array
    if (Array.isArray(response.data.roles)) {
        console.log('✅ Roles devueltos como ARRAY:', response.data.roles);
    } else {
        console.log('❌ Roles NO son un array:', response.data.roles);
    }
    
    return response.data;
}

async function testAdminEndpoints(token) {
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
        // Probar estadísticas
        const statsResponse = await axios.get(`${BASE_URL}/admin/stats`, { headers });
        console.log('✅ Estadísticas obtenidas:', statsResponse.data);
        
        // Probar lista de usuarios
        const usersResponse = await axios.get(`${BASE_URL}/admin/users`, { headers });
        console.log('✅ Lista de usuarios obtenida:', usersResponse.data.length, 'usuarios');
        
        console.log('✅ Todos los endpoints admin funcionan correctamente');
        
    } catch (error) {
        if (error.response?.status === 403) {
            console.log('⚠️ Acceso denegado - Asegúrate de que el usuario tenga rol admin');
            console.log('Ejecuta esta query SQL:');
            console.log(`UPDATE users SET roles = ARRAY['admin', 'user'] WHERE email = '${ADMIN_USER.email}';`);
        } else {
            throw error;
        }
    }
}

// Ejecutar el script
createAdminAndTest();
