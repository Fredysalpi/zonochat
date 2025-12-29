-- Actualizar vista v_tickets_full para incluir assigned_to
USE zonochat;

DROP VIEW IF EXISTS v_tickets_full;

CREATE VIEW v_tickets_full AS
SELECT 
    t.id,
    t.ticket_number,
    t.status,
    t.priority,
    t.subject,
    t.assigned_to,
    t.assigned_at,
    t.created_at,
    t.updated_at,
    c.id AS contact_id,
    c.name AS contact_name,
    c.phone AS contact_phone,
    c.email AS contact_email,
    c.avatar AS contact_avatar,
    ch.id AS channel_id,
    ch.name AS channel_name,
    ch.type AS channel_type,
    u.id AS agent_id,
    CONCAT(u.first_name, ' ', u.last_name) AS assigned_agent,
    u.avatar AS agent_avatar,
    (SELECT content FROM messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) AS last_message,
    (SELECT created_at FROM messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
    (SELECT sender_type FROM messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) AS last_sender_type,
    (SELECT COUNT(*) FROM messages WHERE ticket_id = t.id) AS message_count,
    (SELECT COUNT(*) FROM messages WHERE ticket_id = t.id AND is_read = FALSE AND sender_type = 'contact') AS unread_count
FROM tickets t
LEFT JOIN contacts c ON t.contact_id = c.id
LEFT JOIN channels ch ON t.channel_id = ch.id
LEFT JOIN users u ON t.assigned_to = u.id;
