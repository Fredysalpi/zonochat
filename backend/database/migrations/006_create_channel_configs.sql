-- ============================================
-- EJECUTAR ESTA MIGRACIÓN MANUALMENTE
-- ============================================
-- 
-- Opción 1: Desde MySQL Workbench
-- 1. Abre MySQL Workbench
-- 2. Conecta a tu base de datos
-- 3. Selecciona la base de datos: USE zonochat_dev;
-- 4. Copia y pega todo este archivo
-- 5. Ejecuta (Ctrl + Shift + Enter)
--
-- Opción 2: Desde línea de comandos
-- mysql -u root -p zonochat_dev
-- Luego copia y pega el contenido
--
-- ============================================

USE zonochat_dev;

-- Crear tabla de configuraciones de canales
CREATE TABLE IF NOT EXISTS channel_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    channel_type ENUM('whatsapp', 'messenger', 'instagram', 'telegram') NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Configuración específica (JSON)
    config JSON NOT NULL,
    
    -- Metadatos
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_channel_name (channel_type, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para búsqueda rápida
CREATE INDEX idx_channel_type ON channel_configs(channel_type);
CREATE INDEX idx_is_active ON channel_configs(is_active);

-- Verificar que se creó correctamente
SELECT 'Tabla channel_configs creada exitosamente' AS status;
DESCRIBE channel_configs;
