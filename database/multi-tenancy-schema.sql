-- ===================================
-- ZONOCHAT - ESQUEMA MULTI-TENANCY
-- ===================================
-- Sistema Multi-Tenant con gestión de empresas y agentes
-- Fecha: 2025-12-31
-- ===================================

-- ===================================
-- TABLA: tenants (Empresas/Organizaciones)
-- ===================================
CREATE TABLE IF NOT EXISTS tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'Nombre de la empresa',
    subdomain VARCHAR(100) UNIQUE NOT NULL COMMENT 'Subdominio único (ej: empresa1)',
    status ENUM('active', 'suspended', 'trial', 'inactive') DEFAULT 'trial',
    plan ENUM('free', 'basic', 'pro', 'enterprise') DEFAULT 'free',
    max_agents INT DEFAULT 5 COMMENT 'Máximo de agentes permitidos',
    max_tickets_per_month INT DEFAULT 100 COMMENT 'Límite de tickets mensuales',
    logo VARCHAR(500) NULL,
    settings JSON COMMENT 'Configuraciones personalizadas',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL COMMENT 'Fecha de expiración del plan',
    INDEX idx_subdomain (subdomain),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- ACTUALIZAR TABLA: users (Agregar tenant_id)
-- ===================================
ALTER TABLE users 
ADD COLUMN tenant_id INT NULL AFTER id,
ADD COLUMN assigned_channels JSON NULL COMMENT 'Canales asignados al agente ["messenger", "whatsapp", "instagram"]',
ADD COLUMN current_tickets_count INT DEFAULT 0 COMMENT 'Contador de tickets activos',
ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
ADD INDEX idx_tenant_id (tenant_id);

-- ===================================
-- ACTUALIZAR TABLA: channels (Agregar tenant_id)
-- ===================================
ALTER TABLE channels 
ADD COLUMN tenant_id INT NULL AFTER id,
ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
ADD INDEX idx_tenant_id (tenant_id);

-- ===================================
-- ACTUALIZAR TABLA: tickets (Agregar queue_position)
-- ===================================
ALTER TABLE tickets 
ADD COLUMN queue_position INT NULL COMMENT 'Posición en la cola de espera',
ADD COLUMN waiting_since TIMESTAMP NULL COMMENT 'Desde cuándo está en espera',
ADD INDEX idx_queue_position (queue_position),
ADD INDEX idx_waiting_since (waiting_since);

-- ===================================
-- TABLA: channel_configs (Configuración de canales por tenant)
-- ===================================
CREATE TABLE IF NOT EXISTS channel_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    channel_type ENUM('messenger', 'whatsapp', 'instagram', 'telegram', 'webchat') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    config JSON NOT NULL COMMENT 'Tokens, IDs y configuración del canal',
    webhook_url VARCHAR(500) NULL COMMENT 'URL del webhook generada',
    last_sync_at TIMESTAMP NULL COMMENT 'Última sincronización con la plataforma',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tenant_channel (tenant_id, channel_type),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_channel_type (channel_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ejemplos de config JSON por tipo de canal:
-- MESSENGER:
-- {
--   "page_access_token": "EAAxxxxx",
--   "verify_token": "mi_token_secreto",
--   "page_id": "123456789",
--   "app_id": "987654321",
--   "app_secret": "abcdef123456"
-- }
--
-- WHATSAPP:
-- {
--   "phone_number_id": "123456789",
--   "business_account_id": "987654321",
--   "access_token": "EAAxxxxx",
--   "verify_token": "mi_token_secreto",
--   "webhook_url": "https://api.zonochat.com/webhook/whatsapp"
-- }
--
-- INSTAGRAM:
-- {
--   "instagram_account_id": "123456789",
--   "page_access_token": "EAAxxxxx",
--   "verify_token": "mi_token_secreto"
-- }

-- ===================================
-- TABLA: ticket_queue (Cola de tickets en espera)
-- ===================================
CREATE TABLE IF NOT EXISTS ticket_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    ticket_id INT NOT NULL,
    channel_type ENUM('messenger', 'whatsapp', 'instagram', 'telegram', 'webchat') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    entered_queue_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attempts INT DEFAULT 0 COMMENT 'Intentos de asignación automática',
    last_attempt_at TIMESTAMP NULL,
    metadata JSON COMMENT 'Información adicional para asignación',
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_channel_type (channel_type),
    INDEX idx_priority (priority),
    INDEX idx_entered_queue_at (entered_queue_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLA: agent_availability (Disponibilidad de agentes)
-- ===================================
CREATE TABLE IF NOT EXISTS agent_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tenant_id INT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    current_load INT DEFAULT 0 COMMENT 'Tickets activos actuales',
    max_load INT DEFAULT 5 COMMENT 'Máximo de tickets simultáneos',
    last_assignment_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_tenant (user_id, tenant_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_is_available (is_available),
    INDEX idx_current_load (current_load)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- VISTA: v_available_agents (Agentes disponibles)
-- ===================================
CREATE OR REPLACE VIEW v_available_agents AS
SELECT 
    u.id AS user_id,
    u.tenant_id,
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) AS full_name,
    u.role,
    u.status,
    u.assigned_channels,
    u.max_concurrent_tickets,
    u.current_tickets_count,
    (u.max_concurrent_tickets - u.current_tickets_count) AS available_slots,
    aa.is_available,
    aa.last_assignment_at
FROM users u
LEFT JOIN agent_availability aa ON u.id = aa.user_id
WHERE 
    u.role IN ('agent', 'supervisor') 
    AND u.is_active = TRUE 
    AND u.status IN ('online', 'away')
    AND u.current_tickets_count < u.max_concurrent_tickets;

-- ===================================
-- VISTA: v_tenant_stats (Estadísticas por tenant)
-- ===================================
CREATE OR REPLACE VIEW v_tenant_stats AS
SELECT 
    t.id AS tenant_id,
    t.name AS tenant_name,
    t.subdomain,
    t.status,
    t.plan,
    COUNT(DISTINCT u.id) AS total_agents,
    COUNT(DISTINCT CASE WHEN u.status = 'online' THEN u.id END) AS online_agents,
    COUNT(DISTINCT tk.id) AS total_tickets,
    COUNT(DISTINCT CASE WHEN tk.status IN ('open', 'in_progress') THEN tk.id END) AS active_tickets,
    COUNT(DISTINCT tq.id) AS queued_tickets,
    COUNT(DISTINCT ch.id) AS active_channels
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = TRUE
LEFT JOIN tickets tk ON t.id = u.tenant_id
LEFT JOIN ticket_queue tq ON t.id = tq.tenant_id
LEFT JOIN channel_configs ch ON t.id = ch.tenant_id AND ch.is_active = TRUE
GROUP BY t.id;

-- ===================================
-- PROCEDIMIENTO: Asignar ticket automáticamente
-- ===================================
DELIMITER $$

CREATE PROCEDURE sp_auto_assign_ticket(
    IN p_ticket_id INT,
    IN p_tenant_id INT,
    IN p_channel_type VARCHAR(50)
)
BEGIN
    DECLARE v_agent_id INT;
    DECLARE v_available_slots INT;
    
    -- Buscar agente disponible con menos carga y que tenga el canal asignado
    SELECT 
        u.id,
        (u.max_concurrent_tickets - u.current_tickets_count) AS slots
    INTO v_agent_id, v_available_slots
    FROM users u
    WHERE 
        u.tenant_id = p_tenant_id
        AND u.role IN ('agent', 'supervisor')
        AND u.is_active = TRUE
        AND u.status IN ('online', 'away')
        AND u.current_tickets_count < u.max_concurrent_tickets
        AND JSON_CONTAINS(u.assigned_channels, CONCAT('"', p_channel_type, '"'))
    ORDER BY u.current_tickets_count ASC, RAND()
    LIMIT 1;
    
    IF v_agent_id IS NOT NULL THEN
        -- Asignar ticket al agente
        UPDATE tickets 
        SET 
            assigned_to = v_agent_id,
            status = 'in_progress',
            assigned_at = NOW(),
            queue_position = NULL,
            waiting_since = NULL
        WHERE id = p_ticket_id;
        
        -- Incrementar contador de tickets del agente
        UPDATE users 
        SET current_tickets_count = current_tickets_count + 1
        WHERE id = v_agent_id;
        
        -- Registrar asignación
        INSERT INTO ticket_assignments (ticket_id, assigned_to, assignment_type)
        VALUES (p_ticket_id, v_agent_id, 'auto');
        
        -- Remover de la cola si estaba
        DELETE FROM ticket_queue WHERE ticket_id = p_ticket_id;
        
        -- Actualizar disponibilidad del agente
        UPDATE agent_availability 
        SET 
            current_load = current_load + 1,
            last_assignment_at = NOW()
        WHERE user_id = v_agent_id;
        
        SELECT 'assigned' AS status, v_agent_id AS agent_id;
    ELSE
        -- No hay agentes disponibles, agregar a cola
        INSERT INTO ticket_queue (tenant_id, ticket_id, channel_type, priority)
        VALUES (
            p_tenant_id, 
            p_ticket_id, 
            p_channel_type,
            (SELECT priority FROM tickets WHERE id = p_ticket_id)
        )
        ON DUPLICATE KEY UPDATE 
            attempts = attempts + 1,
            last_attempt_at = NOW();
        
        -- Actualizar ticket
        UPDATE tickets 
        SET 
            status = 'pending',
            waiting_since = NOW()
        WHERE id = p_ticket_id;
        
        SELECT 'queued' AS status, NULL AS agent_id;
    END IF;
END$$

DELIMITER ;

-- ===================================
-- PROCEDIMIENTO: Liberar slot de agente
-- ===================================
DELIMITER $$

CREATE PROCEDURE sp_release_agent_slot(
    IN p_agent_id INT,
    IN p_tenant_id INT
)
BEGIN
    -- Decrementar contador de tickets del agente
    UPDATE users 
    SET current_tickets_count = GREATEST(current_tickets_count - 1, 0)
    WHERE id = p_agent_id;
    
    -- Actualizar disponibilidad
    UPDATE agent_availability 
    SET current_load = GREATEST(current_load - 1, 0)
    WHERE user_id = p_agent_id;
    
    -- Intentar asignar siguiente ticket de la cola
    CALL sp_process_queue(p_tenant_id);
END$$

DELIMITER ;

-- ===================================
-- PROCEDIMIENTO: Procesar cola de tickets
-- ===================================
DELIMITER $$

CREATE PROCEDURE sp_process_queue(
    IN p_tenant_id INT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_ticket_id INT;
    DECLARE v_channel_type VARCHAR(50);
    
    DECLARE queue_cursor CURSOR FOR
        SELECT ticket_id, channel_type
        FROM ticket_queue
        WHERE tenant_id = p_tenant_id
        ORDER BY priority DESC, entered_queue_at ASC
        LIMIT 10;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN queue_cursor;
    
    read_loop: LOOP
        FETCH queue_cursor INTO v_ticket_id, v_channel_type;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Intentar asignar cada ticket
        CALL sp_auto_assign_ticket(v_ticket_id, p_tenant_id, v_channel_type);
    END LOOP;
    
    CLOSE queue_cursor;
END$$

DELIMITER ;

-- ===================================
-- TRIGGER: Actualizar contador al cerrar ticket
-- ===================================
DELIMITER $$

CREATE TRIGGER after_ticket_close
AFTER UPDATE ON tickets
FOR EACH ROW
BEGIN
    IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') THEN
        IF NEW.assigned_to IS NOT NULL THEN
            -- Decrementar contador del agente
            UPDATE users 
            SET current_tickets_count = GREATEST(current_tickets_count - 1, 0)
            WHERE id = NEW.assigned_to;
            
            -- Actualizar disponibilidad
            UPDATE agent_availability 
            SET current_load = GREATEST(current_load - 1, 0)
            WHERE user_id = NEW.assigned_to;
        END IF;
    END IF;
END$$

DELIMITER ;

-- ===================================
-- DATOS DE EJEMPLO
-- ===================================

-- Crear tenant de ejemplo
INSERT INTO tenants (name, subdomain, status, plan, max_agents, max_tickets_per_month) VALUES
('Empresa Demo', 'demo', 'active', 'pro', 10, 1000),
('Startup Tech', 'startup', 'trial', 'basic', 5, 500);

-- Actualizar usuarios existentes con tenant_id
UPDATE users SET tenant_id = 1 WHERE id IN (1, 2, 3);

-- Asignar canales a agentes
UPDATE users 
SET assigned_channels = '["messenger", "whatsapp", "instagram"]'
WHERE role = 'agent' AND id = 3;

-- Crear configuración de canales para tenant demo
INSERT INTO channel_configs (tenant_id, channel_type, is_active, config) VALUES
(1, 'messenger', TRUE, '{"page_access_token": "", "verify_token": "demo_verify_token", "page_id": "", "app_id": "", "app_secret": ""}'),
(1, 'whatsapp', FALSE, '{"phone_number_id": "", "business_account_id": "", "access_token": "", "verify_token": ""}'),
(1, 'instagram', FALSE, '{"instagram_account_id": "", "page_access_token": "", "verify_token": ""}');

-- Inicializar disponibilidad de agentes
INSERT INTO agent_availability (user_id, tenant_id, is_available, current_load, max_load)
SELECT id, tenant_id, TRUE, current_tickets_count, max_concurrent_tickets
FROM users
WHERE role IN ('agent', 'supervisor') AND is_active = TRUE
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ===================================
-- FIN DEL ESQUEMA MULTI-TENANCY
-- ===================================
