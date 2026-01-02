const db = require('../config/database');

class Ticket {
    /**
     * Crear nuevo ticket
     */
    static async create(ticketData) {
        const { contact_id, channel_id, assigned_to, priority = 'medium', subject, category } = ticketData;

        const [result] = await db.query(
            `INSERT INTO tickets (contact_id, channel_id, assigned_to, priority, subject, category, first_message_at) 
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [contact_id, channel_id, assigned_to, priority, subject, category]
        );

        // Registrar asignación si hay agente asignado
        if (assigned_to) {
            await db.query(
                'INSERT INTO ticket_assignments (ticket_id, assigned_to, assignment_type) VALUES (?, ?, ?)',
                [result.insertId, assigned_to, 'auto']
            );
        }

        return this.findById(result.insertId);
    }

    /**
     * Buscar ticket por ID
     */
    static async findById(id) {
        const [rows] = await db.query(
            'SELECT * FROM v_tickets_full WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    /**
     * Buscar ticket por número
     */
    static async findByNumber(ticketNumber) {
        const [rows] = await db.query(
            'SELECT * FROM v_tickets_full WHERE ticket_number = ?',
            [ticketNumber]
        );
        return rows[0];
    }

    /**
     * Obtener todos los tickets con filtros
     */
    static async getAll(filters = {}, pagination = {}) {
        let query = 'SELECT * FROM v_tickets_full WHERE 1=1';
        const params = [];

        // Filtros
        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.assigned_to) {
            query += ' AND assigned_to = ?';
            params.push(filters.assigned_to);
        }

        if (filters.channel_type) {
            query += ' AND channel_type = ?';
            params.push(filters.channel_type);
        }

        if (filters.priority) {
            query += ' AND priority = ?';
            params.push(filters.priority);
        }

        if (filters.search) {
            query += ' AND (ticket_number LIKE ? OR contact_name LIKE ? OR subject LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Ordenamiento
        query += ' ORDER BY created_at DESC';

        // Paginación
        if (pagination.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(pagination.limit));

            if (pagination.offset) {
                query += ' OFFSET ?';
                params.push(parseInt(pagination.offset));
            }
        }

        const [rows] = await db.query(query, params);
        return rows;
    }

    /**
     * Obtener tickets por agente
     */
    static async getByAgent(agentId, status = null) {
        let query = 'SELECT * FROM v_tickets_full WHERE assigned_to = ?';
        const params = [agentId];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await db.query(query, params);
        return rows;
    }

    /**
     * Actualizar ticket
     */
    static async update(id, updateData) {
        const fields = [];
        const values = [];

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(updateData[key]);
            }
        });

        if (fields.length === 0) {
            return this.findById(id);
        }

        values.push(id);

        await db.query(
            `UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return this.findById(id);
    }

    /**
     * Asignar ticket a agente
     */
    static async assign(ticketId, agentId, assignedBy = null, assignmentType = 'manual') {
        const ticket = await this.findById(ticketId);

        await db.query(
            'UPDATE tickets SET assigned_to = ?, assigned_at = NOW() WHERE id = ?',
            [agentId, ticketId]
        );

        // Registrar asignación
        await db.query(
            'INSERT INTO ticket_assignments (ticket_id, assigned_from, assigned_to, assignment_type) VALUES (?, ?, ?, ?)',
            [ticketId, ticket.assigned_to, agentId, assignmentType]
        );

        return this.findById(ticketId);
    }

    /**
     * Cambiar estado del ticket
     */
    static async updateStatus(id, status) {
        const updateData = { status };

        if (status === 'resolved') {
            updateData.resolved_at = new Date();
        } else if (status === 'closed') {
            updateData.closed_at = new Date();
        }

        return this.update(id, updateData);
    }

    /**
     * Obtener estadísticas de tickets
     */
    static async getStats(filters = {}) {
        let query = 'SELECT status, COUNT(*) as count FROM tickets WHERE 1=1';
        const params = [];

        if (filters.assigned_to) {
            query += ' AND assigned_to = ?';
            params.push(filters.assigned_to);
        }

        if (filters.channel_id) {
            query += ' AND channel_id = ?';
            params.push(filters.channel_id);
        }

        query += ' GROUP BY status';

        const [rows] = await db.query(query, params);
        return rows;
    }

    /**
     * Buscar o crear ticket para un contacto
     */
    static async findOrCreateForContact(contactId, channelId) {
        // Buscar ticket abierto existente
        const [existing] = await db.query(
            `SELECT * FROM tickets 
             WHERE contact_id = ? 
             AND channel_id = ? 
             AND status IN ('open', 'in_progress', 'pending')
             ORDER BY created_at DESC 
             LIMIT 1`,
            [contactId, channelId]
        );

        if (existing.length > 0) {
            return this.findById(existing[0].id);
        }

        // Crear nuevo ticket
        return this.create({
            contact_id: contactId,
            channel_id: channelId,
            subject: 'Nueva conversación'
        });
    }

    /**
     * Buscar ticket activo por contacto
     */
    static async findActiveByContact(contactId) {
        const [rows] = await db.query(
            `SELECT * FROM tickets 
             WHERE contact_id = ? 
             AND status IN ('open', 'in_progress', 'pending')
             ORDER BY created_at DESC 
             LIMIT 1`,
            [contactId]
        );
        return rows[0] || null;
    }

    /**
     * Alias para getAll (usado por el controller)
     */
    static async findAll(filters = {}, limit = 20, offset = 0) {
        return this.getAll(filters, { limit, offset });
    }

    /**
     * Contar tickets con filtros
     */
    static async count(filters = {}) {
        let query = 'SELECT COUNT(*) as total FROM tickets WHERE 1=1';
        const params = [];

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.agent_id) {
            query += ' AND assigned_to = ?';
            params.push(filters.agent_id);
        }

        if (filters.channel) {
            query += ' AND channel_id IN (SELECT id FROM channels WHERE name = ?)';
            params.push(filters.channel);
        }

        const [[result]] = await db.query(query, params);
        return result.total;
    }

    /**
     * Actualizar prioridad del ticket
     */
    static async updatePriority(id, priority) {
        return this.update(id, { priority });
    }
}

module.exports = Ticket;
