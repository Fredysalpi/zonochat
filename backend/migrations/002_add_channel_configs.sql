-- ============================================
-- MIGRACIÓN 002: Agregar tabla channel_configs
-- ============================================
-- Esta tabla se agrega a CADA base de datos de tenant
-- Almacena los tokens y configuraciones de canales (Messenger, WhatsApp, etc.)

-- NOTA: Este script debe ejecutarse en cada BD de tenant
-- Por ejemplo: zonochat_demo, zonochat_empresa1, etc.

-- Tabla de Configuración de Canales
CREATE TABLE IF NOT EXISTS channel_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    channel_type ENUM('messenger', 'whatsapp', 'instagram', 'telegram', 'webchat') NOT NULL,
    is_active BOOLEAN DEFAULT false COMMENT 'Si el canal está activo',
    config JSON NOT NULL COMMENT 'Configuración del canal (tokens, IDs, etc.)',
    webhook_url VARCHAR(500) NULL COMMENT 'URL del webhook para este canal',
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL COMMENT 'ID del usuario que configuró',
    
    -- Índices
    UNIQUE KEY unique_channel (channel_type),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ejemplos de configuración JSON por canal:

-- MESSENGER:
-- {
--   "page_access_token": "EAAxxxxxxxxxxxxx",
--   "verify_token": "mi_token_secreto_123",
--   "page_id": "123456789012345",
--   "app_id": "987654321098765",
--   "app_secret": "abcdef1234567890abcdef1234567890"
-- }

-- WHATSAPP (Meta Business):
-- {
--   "phone_number_id": "123456789012345",
--   "business_account_id": "987654321098765",
--   "access_token": "EAAxxxxxxxxxxxxx",
--   "verify_token": "mi_token_secreto_123",
--   "webhook_verify_token": "otro_token_secreto"
-- }

-- INSTAGRAM:
-- {
--   "instagram_account_id": "123456789012345",
--   "access_token": "EAAxxxxxxxxxxxxx",
--   "verify_token": "mi_token_secreto_123"
-- }

-- TELEGRAM:
-- {
--   "bot_token": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
--   "webhook_url": "https://api.zonochat.com/webhooks/telegram"
-- }

-- WEBCHAT (Chat en sitio web):
-- {
--   "widget_id": "abc123def456",
--   "allowed_domains": ["example.com", "www.example.com"],
--   "primary_color": "#7c3aed",
--   "welcome_message": "¡Hola! ¿En qué podemos ayudarte?"
-- }

SELECT '✅ Tabla channel_configs creada correctamente' as status;
