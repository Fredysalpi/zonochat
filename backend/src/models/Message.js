const db = require('../config/database');

class Message {
    /**
     * Crear nuevo mensaje
     */
    static async create(data) {
        const { ticket_id, content, sender_type, sender_id, message_type, media_url, external_id } = data;

        const [result] = await db.query(
            `INSERT INTO messages (ticket_id, content, sender_type, sender_id, message_type, media_url, external_message_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [ticket_id, content, sender_type, sender_id || null, message_type || 'text', media_url || null, external_id || null]
        );

        return this.findById(result.insertId);
    }

    /**
     * Buscar mensaje por ID
     */
    static async findById(id) {
        const [rows] = await db.query(
            'SELECT * FROM messages WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    /**
     * Buscar mensajes por ticket
     */
    static async findByTicket(ticketId, limit = 50) {
        const [rows] = await db.query(
            `SELECT * FROM messages 
             WHERE ticket_id = ? 
             ORDER BY created_at ASC 
             LIMIT ?`,
            [ticketId, limit]
        );
        return rows;
    }

    /**
     * Actualizar mensaje por external_id
     */
    static async updateByExternalId(externalId, data) {
        const { is_read } = data;

        await db.query(
            'UPDATE messages SET is_read = ? WHERE external_message_id = ?',
            [is_read, externalId]
        );

        return true;
    }

    /**
     * Marcar mensajes como leídos
     */
    static async markAsRead(ticketId) {
        await db.query(
            'UPDATE messages SET is_read = true WHERE ticket_id = ? AND sender_type = ?',
            [ticketId, 'contact']
        );
        return true;
    }
}

module.exports = Message;
