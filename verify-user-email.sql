-- Script para verificar email de usuario manualmente
-- Usar SOLO en desarrollo/pruebas

-- Ver usuario con problema
SELECT id, email, name, "emailVerified", "isActive", roles
FROM "user"
WHERE id = 'bcfd8ec6-9051-4cf6-ba0d-8dbe5b327d40';

-- Verificar el email manualmente
UPDATE "user"
SET "emailVerified" = true
WHERE id = 'bcfd8ec6-9051-4cf6-ba0d-8dbe5b327d40';

-- Verificar que se actualizó correctamente
SELECT id, email, name, "emailVerified", "isActive", roles
FROM "user"
WHERE id = 'bcfd8ec6-9051-4cf6-ba0d-8dbe5b327d40';

-- Si quieres verificar TODOS los usuarios (usar con precaución):
-- UPDATE "user" SET "emailVerified" = true WHERE "emailVerified" = false;

-- Ver todos los usuarios y su estado de verificación:
SELECT id, email, "emailVerified", "isActive", roles, "createdAt"
FROM "user"
ORDER BY "createdAt" DESC
LIMIT 10;
