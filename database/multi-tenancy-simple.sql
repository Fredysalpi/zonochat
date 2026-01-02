-- ===================================
-- ZONOCHAT - MIGRACIÓN MULTI-TENANCY
-- ===================================

-- 1. Crear tabla de tenants
CREATE TABLE IF NOT EXISTS tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    status ENUM('active', 'suspended', 'trial', 'inactive') DEFAULT 'trial',
    plan ENUM('free', 'basic', 'pro', 'enterprise') DEFAULT 'free',
    max_agents INT DEFAULT 5,
    max_tickets_per_month INT DEFAULT 100,
    logo VARCHAR(500) NULL,
    settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    INDEX idx_subdomain (subdomain),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Crear tabla channel_configs
CREATE TABLE IF NOT EXISTS channel_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    channel_type ENUM('messenger', 'whatsapp', 'instagram', 'telegram', 'webchat') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    config JSON NOT NULL,
    webhook_url VARCHAR(500) NULL,
    last_sync_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_tenant_channel (tenant_id, channel_type),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_channel_type (channel_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Crear tabla ticket_queue
CREATE TABLE IF NOT EXISTS ticket_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    ticket_id INT NOT NULL,
    channel_type ENUM('messenger', 'whatsapp', 'instagram', 'telegram', 'webchat') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    entered_queue_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attempts INT DEFAULT 0,
    last_attempt_at TIMESTAMP NULL,
    metadata JSON,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_channel_type (channel_type),
    INDEX idx_priority (priority),
    INDEX idx_entered_queue_at (entered_queue_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Crear tabla agent_availability
CREATE TABLE IF NOT EXISTS agent_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tenant_id INT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    current_load INT DEFAULT 0,
    max_load INT DEFAULT 5,
    last_assignment_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_tenant (user_id, tenant_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_user_id (user_id),
    INDEX idx_is_available (is_available),
    INDEX idx_current_load (current_load)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
