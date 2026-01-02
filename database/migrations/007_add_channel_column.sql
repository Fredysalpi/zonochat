-- Migración: Agregar columna 'channel' a contacts y tickets
-- Esto es una solución temporal para compatibilidad con el código actual

USE zonochat;

-- Agregar columna 'channel' a la tabla contacts
ALTER TABLE contacts 
ADD COLUMN channel ENUM('whatsapp', 'messenger', 'instagram', 'webchat') NULL AFTER external_id;

-- Agregar índice para búsquedas rápidas
ALTER TABLE contacts 
ADD INDEX idx_channel (channel);

-- Agregar columna 'channel' a la tabla tickets
ALTER TABLE tickets 
ADD COLUMN channel ENUM('whatsapp', 'messenger', 'instagram', 'webchat') NULL AFTER channel_id;

-- Agregar índice para búsquedas rápidas
ALTER TABLE tickets 
ADD INDEX idx_channel (channel);

-- Actualizar datos existentes (si los hay)
UPDATE contacts c
INNER JOIN channels ch ON c.channel_id = ch.id
SET c.channel = ch.type;

UPDATE tickets t
INNER JOIN channels ch ON t.channel_id = ch.id
SET t.channel = ch.type;

SELECT 'Migración completada exitosamente' AS status;
