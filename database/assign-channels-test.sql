-- Script para asignar canales a un agente de prueba
-- Ejecutar en MySQL

-- Ver agentes actuales
SELECT id, first_name, last_name, email, assigned_channels 
FROM users 
WHERE role = 'agent' 
LIMIT 5;

-- Asignar canales al primer agente (ajusta el ID según tu caso)
UPDATE users 
SET assigned_channels = '["messenger", "whatsapp"]'
WHERE id = 7 AND role = 'agent';

-- Verificar
SELECT id, first_name, last_name, email, assigned_channels 
FROM users 
WHERE id = 7;
