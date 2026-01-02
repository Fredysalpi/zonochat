-- ============================================
-- MIGRACIÓN 001: Crear Base de Datos Master
-- ============================================
-- Esta BD contendrá la información de todos los tenants (empresas)

CREATE DATABASE IF NOT EXISTS zonochat_master;
USE zonochat_master;

-- Tabla de Tenants (Empresas/Clientes)
CREATE TABLE IF NOT EXISTS tenants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL COMMENT 'Nombre de la empresa',
    subdomain VARCHAR(100) UNIQUE NOT NULL COMMENT 'Subdominio único (ej: empresa1)',
    database_name VARCHAR(100) UNIQUE NOT NULL COMMENT 'Nombre de la BD del tenant',
    status ENUM('active', 'suspended', 'trial', 'inactive') DEFAULT 'trial',
    plan ENUM('free', 'basic', 'pro', 'enterprise') DEFAULT 'free',
    
    -- Límites del plan
    max_agents INT DEFAULT 5 COMMENT 'Máximo de agentes permitidos',
    max_tickets_per_month INT DEFAULT 100 COMMENT 'Máximo de tickets por mes',
    max_channels INT DEFAULT 2 COMMENT 'Máximo de canales activos',
    
    -- Fechas
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trial_ends_at TIMESTAMP NULL COMMENT 'Fin del periodo de prueba',
    subscription_ends_at TIMESTAMP NULL COMMENT 'Fin de la suscripción',
    last_payment_at TIMESTAMP NULL,
    
    -- Configuración adicional
    settings JSON COMMENT 'Configuraciones personalizadas del tenant',
    
    -- Índices
    INDEX idx_status (status),
    INDEX idx_subdomain (subdomain),
    UNIQUE KEY unique_subdomain (subdomain),
    UNIQUE KEY unique_database (database_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Usuarios Master (para login inicial)
CREATE TABLE IF NOT EXISTS master_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'tenant_admin') DEFAULT 'tenant_admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_email (email),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Logs de Actividad (opcional pero recomendado)
CREATE TABLE IF NOT EXISTS tenant_activity_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    user_id INT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant_date (tenant_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar tenant de demostración
INSERT INTO tenants (name, subdomain, database_name, status, plan) 
VALUES ('Demo Company', 'demo', 'zonochat_demo', 'active', 'pro')
ON DUPLICATE KEY UPDATE name = name;

-- Crear usuario admin para el tenant demo
-- Contraseña: admin123 (cambiar en producción)
INSERT INTO master_users (tenant_id, email, password_hash, role)
VALUES (
    1, 
    'admin@demo.com', 
    '$2b$10$rQ3qYZ9vXZxKxXxKxXxKxOxXxKxXxKxXxKxXxKxXxKxXxKxXxKx',
    'tenant_admin'
) ON DUPLICATE KEY UPDATE email = email;

SELECT '✅ Base de datos master creada correctamente' as status;
