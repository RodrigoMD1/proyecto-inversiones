-- Script para actualizar el usuario a admin
-- Ejecutar en tu cliente de PostgreSQL

-- Actualizar roles del usuario admin@test.com
UPDATE users 
SET roles = ARRAY['admin', 'user'] 
WHERE email = 'admin@test.com';

-- Verificar que se actualizó correctamente
SELECT id, email, name, roles, "isActive", "emailVerified"
FROM users 
WHERE email = 'admin@test.com';
