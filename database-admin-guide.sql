-- 📋 GUÍA: Cómo convertir un usuario normal en ADMINISTRADOR
-- =====================================================

-- 1️⃣ OPCIÓN A: Convertir usuario existente en administrador
-- Reemplaza 'tu-email@ejemplo.com' con el email del usuario que quieres hacer admin

UPDATE users 
SET roles = '{admin,user}', "emailVerified" = true 
WHERE email = 'tu-email@ejemplo.com';

-- Verificar que se aplicó correctamente:
SELECT id, email, name, roles, "emailVerified", "isActive" 
FROM users 
WHERE email = 'tu-email@ejemplo.com';

-- 2️⃣ OPCIÓN B: Ver todos los usuarios para encontrar el ID correcto
SELECT id, email, name, roles, "emailVerified", "isActive" 
FROM users 
ORDER BY name;

-- 3️⃣ OPCIÓN C: Cambiar por ID de usuario (si conoces el ID)
UPDATE users 
SET roles = '{admin,user}', "emailVerified" = true 
WHERE id = 'uuid-del-usuario-aqui';

-- 4️⃣ VERIFICACIONES ÚTILES:

-- Ver todos los administradores:
SELECT id, email, name, roles 
FROM users 
WHERE 'admin' = ANY(roles);

-- Ver usuarios por roles:
SELECT 
    email, 
    name, 
    roles, 
    "emailVerified", 
    "isActive"
FROM users 
ORDER BY roles, name;

-- Estadísticas de roles:
SELECT 
    CASE 
        WHEN 'admin' = ANY(roles) THEN 'Administrador'
        ELSE 'Usuario Normal'
    END as tipo_usuario,
    COUNT(*) as cantidad
FROM users 
GROUP BY (CASE WHEN 'admin' = ANY(roles) THEN 'Administrador' ELSE 'Usuario Normal' END);

-- 5️⃣ OPERACIONES ADICIONALES:

-- Remover rol de admin (convertir admin en usuario normal):
UPDATE users 
SET roles = '{user}' 
WHERE email = 'admin-a-convertir@ejemplo.com';

-- Activar usuario desactivado:
UPDATE users 
SET "isActive" = true 
WHERE email = 'usuario@ejemplo.com';

-- Verificar email manualmente:
UPDATE users 
SET "emailVerified" = true, "emailVerificationToken" = null 
WHERE email = 'usuario@ejemplo.com';

-- 6️⃣ CONSULTAS DE MONITOREO:

-- Ver actividad reciente de usuarios:
SELECT 
    u.email, 
    u.name, 
    u.roles,
    COUNT(p.id) as total_assets,
    MAX(p.purchase_date) as ultima_actividad
FROM users u
LEFT JOIN portfolio_items p ON u.id = p.user_id
GROUP BY u.id, u.email, u.name, u.roles
ORDER BY ultima_actividad DESC NULLS LAST;

-- Ver suscripciones activas:
SELECT 
    u.email,
    u.name,
    s.plan,
    s.status,
    s.asset_limit,
    s.expires_at
FROM users u
INNER JOIN subscriptions s ON u.id = s.user_id
WHERE s.status = 'active'
ORDER BY s.created_at DESC;

/*
📝 NOTAS IMPORTANTES:

1. 🔐 SEGURIDAD: Solo ejecuta estos comandos si tienes acceso a la base de datos
2. 🧪 PRUEBAS: Siempre haz una copia de seguridad antes de modificar datos
3. 📧 EMAIL: Asegúrate de verificar el email del admin para que pueda usar todas las funciones
4. 🚨 ROLES: Los roles se almacenan como array PostgreSQL: '{admin,user}' o '{user}'
5. 💾 BACKUP: Haz backup antes de eliminar usuarios

🎯 PROCESO RECOMENDADO:
1. Crea un usuario normal desde la aplicación
2. Ejecuta la query UPDATE para hacer admin
3. Verifica con SELECT que se aplicó correctamente  
4. Inicia sesión en el panel admin
5. Desde el panel ya puedes gestionar otros usuarios
*/
