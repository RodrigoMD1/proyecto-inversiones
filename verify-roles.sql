-- Script para verificar y corregir roles de usuarios
-- Ejecutar estas consultas en tu cliente de PostgreSQL

-- 1. Ver todos los usuarios y sus roles actuales
SELECT 
    id,
    email,
    "fullName",
    roles,
    "isActive",
    "emailVerified"
FROM users
ORDER BY email;

-- 2. Buscar usuarios administradores
SELECT 
    id,
    email,
    "fullName",
    roles
FROM users 
WHERE 'admin' = ANY(roles);

-- 3. Ver usuarios que solo tienen rol 'user'
SELECT 
    id,
    email,
    "fullName",
    roles
FROM users 
WHERE roles = ARRAY['user'];

-- 4. EJEMPLO: Convertir un usuario específico en admin
-- Reemplazar 'usuario@ejemplo.com' con el email real
/*
UPDATE users 
SET roles = ARRAY['admin', 'user']
WHERE email = 'usuario@ejemplo.com';
*/

-- 5. EJEMPLO: Crear un usuario admin de prueba (si no existe)
-- Ajustar los datos según necesites
/*
INSERT INTO users (
    email, 
    password, 
    "fullName", 
    roles, 
    "isActive", 
    "emailVerified"
) VALUES (
    'admin@test.com',
    '$2b$10$hash_del_password_aqui', -- Usar bcrypt hash real
    'Administrador de Prueba',
    ARRAY['admin', 'user'],
    true,
    true
) ON CONFLICT (email) DO NOTHING;
*/

-- 6. Verificar estructura de la tabla users
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
