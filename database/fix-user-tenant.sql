-- Script para asignar tenant_id a usuarios existentes
-- Ejecutar este script en tu cliente MySQL (phpMyAdmin, MySQL Workbench, etc.)

USE zonochat;

-- Ver usuarios sin tenant_id
SELECT id, email, role, tenant_id FROM users WHERE tenant_id IS NULL;

-- Asignar todos los usuarios sin tenant_id al tenant 'demo' (ID = 1)
UPDATE users 
SET tenant_id = 1 
WHERE tenant_id IS NULL;

-- Verificar que se asignaron correctamente
SELECT id, email, role, tenant_id FROM users;

-- Ver el tenant demo
SELECT * FROM tenants WHERE id = 1;
