-- ===================================
-- ZONOCHAT - ESQUEMA DE BASE DE DATOS
-- ===================================
-- Sistema de gestión de conversaciones omnicanal
-- Fecha: 2025-12-27
-- ===================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS zonochat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE zonochat;

-- ===================================
-- TABLA: users (Usuarios/Agentes)
-- ===================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'supervisor', 'agent') DEFAULT 'agent',
    avatar VARCHAR(255),
    status ENUM('online', 'offline', 'busy', 'away') DEFAULT 'offline',
    is_active BOOLEAN DEFAULT TRUE,
    max_concurrent_tickets INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLA: channels (Canales de comunicación)
-- ===================================
CREATE TABLE channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('whatsapp', 'messenger', 'instagram', 'webchat') NOT NULL,
    identifier VARCHAR(255) NOT NULL COMMENT 'Phone ID, Page ID, Account ID, etc.',
    access_token TEXT,
    webhook_verify_token VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    config JSON COMMENT 'Configuración específica del canal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_channel (type, identifier),
    INDEX idx_type (type),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLA: contacts (Contactos/Clientes)
-- ===================================
CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    channel_id INT NOT NULL,
    external_id VARCHAR(255) NOT NULL COMMENT 'ID del usuario en la plataforma externa',
    name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    avatar VARCHAR(255),
    metadata JSON COMMENT 'Información adicional del contacto',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_contact (channel_id, external_id),
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    INDEX idx_external_id (external_id),
    INDEX idx_phone (phone),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLA: tickets (Conversaciones/Tickets)
-- ===================================
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    contact_id INT NOT NULL,
    channel_id INT NOT NULL,
    assigned_to INT NULL COMMENT 'ID del agente asignado',
    status ENUM('open', 'pending', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    subject VARCHAR(255),
    category VARCHAR(100),
    tags JSON COMMENT 'Etiquetas del ticket',
    first_message_at TIMESTAMP NULL,
    last_message_at TIMESTAMP NULL,
    assigned_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_ticket_number (ticket_number),
    INDEX idx_status (status),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_created_at (created_at),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLA: messages (Mensajes)
-- ===================================
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    external_message_id VARCHAR(255) COMMENT 'ID del mensaje en la plataforma externa',
    sender_type ENUM('contact', 'agent', 'system', 'bot') NOT NULL,
    sender_id INT NULL COMMENT 'ID del usuario si es agente',
    content TEXT NOT NULL,
    message_type ENUM('text', 'image', 'video', 'audio', 'document', 'location', 'sticker') DEFAULT 'text',
    media_url VARCHAR(500),
    media_mime_type VARCHAR(100),
    metadata JSON COMMENT 'Datos adicionales del mensaje',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_created_at (created_at),
    INDEX idx_external_message_id (external_message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLA: ticket_assignments (Historial de asignaciones)
-- ===================================
CREATE TABLE ticket_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    assigned_from INT NULL,
    assigned_to INT NOT NULL,
    assignment_type ENUM('auto', 'manual', 'transfer') DEFAULT 'manual',
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_from) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_assigned_to (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLA: quick_replies (Respuestas rápidas)
-- ===================================
CREATE TABLE quick_replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL COMMENT 'NULL = global, específico = personal',
    shortcut VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_shortcut (shortcut),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLA: notes (Notas internas)
-- ===================================
CREATE TABLE notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ticket_id (ticket_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLA: agent_status_log (Log de estados de agentes)
-- ===================================
CREATE TABLE agent_status_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status ENUM('online', 'offline', 'busy', 'away') NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- INSERTAR DATOS DE EJEMPLO
-- ===================================

-- Usuario administrador por defecto (password: admin123)
INSERT INTO users (email, password, first_name, last_name, role, status) VALUES
('admin@zonochat.com', '$2a$10$YourHashedPasswordHere', 'Admin', 'ZonoChat', 'admin', 'online'),
('supervisor@zonochat.com', '$2a$10$YourHashedPasswordHere', 'Supervisor', 'Demo', 'supervisor', 'online'),
('agente1@zonochat.com', '$2a$10$YourHashedPasswordHere', 'Agente', 'Uno', 'agent', 'online');

-- Canal de ejemplo
INSERT INTO channels (name, type, identifier, is_active) VALUES
('WhatsApp Principal', 'whatsapp', '1234567890', TRUE),
('Facebook Page', 'messenger', 'page_id_123', TRUE),
('Instagram Business', 'instagram', 'ig_account_123', TRUE);

-- ===================================
-- VISTAS ÚTILES
-- ===================================

-- Vista de tickets con información completa
CREATE VIEW v_tickets_full AS
SELECT 
    t.id,
    t.ticket_number,
    t.status,
    t.priority,
    t.subject,
    t.created_at,
    t.updated_at,
    c.name AS contact_name,
    c.phone AS contact_phone,
    c.email AS contact_email,
    ch.name AS channel_name,
    ch.type AS channel_type,
    CONCAT(u.first_name, ' ', u.last_name) AS assigned_agent,
    u.avatar AS agent_avatar,
    (SELECT COUNT(*) FROM messages WHERE ticket_id = t.id) AS message_count,
    (SELECT COUNT(*) FROM messages WHERE ticket_id = t.id AND is_read = FALSE AND sender_type = 'contact') AS unread_count
FROM tickets t
LEFT JOIN contacts c ON t.contact_id = c.id
LEFT JOIN channels ch ON t.channel_id = ch.id
LEFT JOIN users u ON t.assigned_to = u.id;

-- Vista de estadísticas de agentes
CREATE VIEW v_agent_stats AS
SELECT 
    u.id,
    CONCAT(u.first_name, ' ', u.last_name) AS agent_name,
    u.status,
    COUNT(t.id) AS active_tickets,
    u.max_concurrent_tickets,
    (u.max_concurrent_tickets - COUNT(t.id)) AS available_slots
FROM users u
LEFT JOIN tickets t ON u.id = t.assigned_to AND t.status IN ('open', 'in_progress', 'pending')
WHERE u.role = 'agent' AND u.is_active = TRUE
GROUP BY u.id;

-- ===================================
-- TRIGGERS
-- ===================================

-- Generar número de ticket automáticamente
DELIMITER $$
CREATE TRIGGER before_ticket_insert
BEFORE INSERT ON tickets
FOR EACH ROW
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        SET NEW.ticket_number = CONCAT('TKT', LPAD(FLOOR(RAND() * 999999), 6, '0'));
    END IF;
END$$
DELIMITER ;

-- Actualizar last_message_at en tickets
DELIMITER $$
CREATE TRIGGER after_message_insert
AFTER INSERT ON messages
FOR EACH ROW
BEGIN
    UPDATE tickets 
    SET last_message_at = NEW.created_at,
        first_message_at = COALESCE(first_message_at, NEW.created_at)
    WHERE id = NEW.ticket_id;
END$$
DELIMITER ;

-- ===================================
-- FIN DEL ESQUEMA
-- ===================================
