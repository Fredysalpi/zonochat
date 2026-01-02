const db = require('../config/database');

class TicketAssignmentService {
    /**
     * Asignar ticket automáticamente a un agente disponible
     */
    static async autoAssignTicket(ticketId, tenantId, channelType) {
        try {
            console.log(`[Auto-Assign] Intentando asignar ticket ${ticketId} del tenant ${tenantId}, canal: ${channelType}`);

            // Buscar agente disponible
            const agent = await this.findAvailableAgent(tenantId, channelType);

            if (agent) {
                // Asignar ticket al agente
                await this.assignTicketToAgent(ticketId, agent.id);

                console.log(`[Auto-Assign] ✅ Ticket ${ticketId} asignado al agente ${agent.id} (${agent.full_name})`);

                return {
                    success: true,
                    status: 'assigned',
                    agentId: agent.id,
                    agentName: agent.full_name
                };
            } else {
                // No hay agentes disponibles, agregar a cola
                await this.addToQueue(ticketId, tenantId, channelType);

                console.log(`[Auto-Assign] ⏳ Ticket ${ticketId} agregado a la cola (sin agentes disponibles)`);

                return {
                    success: true,
                    status: 'queued',
                    message: 'Ticket en espera, será asignado cuando haya un agente disponible'
                };
            }
        } catch (error) {
            console.error('[Auto-Assign] Error:', error);
            throw error;
        }
    }

    /**
     * Buscar agente disponible con menos carga
     */
    static async findAvailableAgent(tenantId, channelType) {
        try {
            const [agents] = await db.query(`
                SELECT 
                    u.id,
                    CONCAT(u.first_name, ' ', u.last_name) AS full_name,
                    u.current_tickets_count,
                    u.max_concurrent_tickets,
                    (u.max_concurrent_tickets - u.current_tickets_count) AS available_slots
                FROM users u
                WHERE 
                    u.tenant_id = ?
                    AND u.role IN ('agent', 'supervisor')
                    AND u.is_active = TRUE
                    AND u.status IN ('online', 'away')
                    AND u.current_tickets_count < u.max_concurrent_tickets
                    AND JSON_CONTAINS(u.assigned_channels, ?)
                ORDER BY u.current_tickets_count ASC, RAND()
                LIMIT 1
            `, [tenantId, JSON.stringify(channelType)]);

            return agents.length > 0 ? agents[0] : null;
        } catch (error) {
            console.error('Error buscando agente disponible:', error);
            throw error;
        }
    }

    /**
     * Asignar ticket a un agente específico
     */
    static async assignTicketToAgent(ticketId, agentId) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Actualizar ticket
            await connection.query(
                `UPDATE tickets 
                 SET assigned_to = ?, 
                     status = 'in_progress', 
                     assigned_at = NOW(),
                     queue_position = NULL,
                     waiting_since = NULL
                 WHERE id = ?`,
                [agentId, ticketId]
            );

            // Incrementar contador del agente
            await connection.query(
                'UPDATE users SET current_tickets_count = current_tickets_count + 1 WHERE id = ?',
                [agentId]
            );

            // Registrar asignación
            await connection.query(
                'INSERT INTO ticket_assignments (ticket_id, assigned_to, assignment_type) VALUES (?, ?, ?)',
                [ticketId, agentId, 'auto']
            );

            // Remover de la cola si estaba
            await connection.query(
                'DELETE FROM ticket_queue WHERE ticket_id = ?',
                [ticketId]
            );

            // Actualizar disponibilidad del agente
            await connection.query(
                `UPDATE agent_availability 
                 SET current_load = current_load + 1, last_assignment_at = NOW()
                 WHERE user_id = ?`,
                [agentId]
            );

            await connection.commit();

            return { success: true };
        } catch (error) {
            await connection.rollback();
            console.error('Error asignando ticket:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Agregar ticket a la cola de espera
     */
    static async addToQueue(ticketId, tenantId, channelType) {
        try {
            // Obtener prioridad del ticket
            const [tickets] = await db.query(
                'SELECT priority FROM tickets WHERE id = ?',
                [ticketId]
            );

            const priority = tickets[0]?.priority || 'medium';

            // Insertar en cola
            await db.query(
                `INSERT INTO ticket_queue (tenant_id, ticket_id, channel_type, priority)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                    attempts = attempts + 1,
                    last_attempt_at = NOW()`,
                [tenantId, ticketId, channelType, priority]
            );

            // Actualizar estado del ticket
            await db.query(
                'UPDATE tickets SET status = ?, waiting_since = NOW() WHERE id = ?',
                ['pending', ticketId]
            );

            return { success: true };
        } catch (error) {
            console.error('Error agregando ticket a la cola:', error);
            throw error;
        }
    }

    /**
     * Liberar slot de agente cuando cierra un ticket
     */
    static async releaseAgentSlot(agentId, tenantId) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Decrementar contador del agente
            await connection.query(
                'UPDATE users SET current_tickets_count = GREATEST(current_tickets_count - 1, 0) WHERE id = ?',
                [agentId]
            );

            // Actualizar disponibilidad
            await connection.query(
                'UPDATE agent_availability SET current_load = GREATEST(current_load - 1, 0) WHERE user_id = ?',
                [agentId]
            );

            await connection.commit();

            // Procesar cola para asignar siguiente ticket
            await this.processQueue(tenantId);

            return { success: true };
        } catch (error) {
            await connection.rollback();
            console.error('Error liberando slot del agente:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Procesar cola de tickets pendientes
     */
    static async processQueue(tenantId) {
        try {
            console.log(`[Queue] Procesando cola del tenant ${tenantId}`);

            // Obtener tickets en cola ordenados por prioridad y tiempo
            const [queuedTickets] = await db.query(`
                SELECT tq.ticket_id, tq.channel_type, tq.priority
                FROM ticket_queue tq
                WHERE tq.tenant_id = ?
                ORDER BY 
                    FIELD(tq.priority, 'urgent', 'high', 'medium', 'low'),
                    tq.entered_queue_at ASC
                LIMIT 10
            `, [tenantId]);

            console.log(`[Queue] Encontrados ${queuedTickets.length} tickets en cola`);

            let assigned = 0;

            for (const ticket of queuedTickets) {
                const result = await this.autoAssignTicket(
                    ticket.ticket_id,
                    tenantId,
                    ticket.channel_type
                );

                if (result.status === 'assigned') {
                    assigned++;
                }
            }

            console.log(`[Queue] ✅ ${assigned} tickets asignados de la cola`);

            return {
                success: true,
                processed: queuedTickets.length,
                assigned
            };
        } catch (error) {
            console.error('[Queue] Error procesando cola:', error);
            throw error;
        }
    }

    /**
     * Obtener tickets en cola
     */
    static async getQueuedTickets(tenantId) {
        try {
            const [tickets] = await db.query(`
                SELECT 
                    tq.*,
                    t.ticket_number,
                    t.subject,
                    c.name AS contact_name,
                    TIMESTAMPDIFF(MINUTE, tq.entered_queue_at, NOW()) AS waiting_minutes
                FROM ticket_queue tq
                JOIN tickets t ON tq.ticket_id = t.id
                JOIN contacts c ON t.contact_id = c.id
                WHERE tq.tenant_id = ?
                ORDER BY 
                    FIELD(tq.priority, 'urgent', 'high', 'medium', 'low'),
                    tq.entered_queue_at ASC
            `, [tenantId]);

            return tickets;
        } catch (error) {
            console.error('Error obteniendo tickets en cola:', error);
            throw error;
        }
    }

    /**
     * Reasignar ticket manualmente
     */
    static async reassignTicket(ticketId, newAgentId, currentUserId, reason = '') {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Obtener ticket actual
            const [tickets] = await connection.query(
                'SELECT assigned_to FROM tickets WHERE id = ?',
                [ticketId]
            );

            const oldAgentId = tickets[0]?.assigned_to;

            // Si tenía agente anterior, decrementar su contador
            if (oldAgentId) {
                await connection.query(
                    'UPDATE users SET current_tickets_count = GREATEST(current_tickets_count - 1, 0) WHERE id = ?',
                    [oldAgentId]
                );

                await connection.query(
                    'UPDATE agent_availability SET current_load = GREATEST(current_load - 1, 0) WHERE user_id = ?',
                    [oldAgentId]
                );
            }

            // Asignar al nuevo agente
            await connection.query(
                'UPDATE tickets SET assigned_to = ?, assigned_at = NOW() WHERE id = ?',
                [newAgentId, ticketId]
            );

            // Incrementar contador del nuevo agente
            await connection.query(
                'UPDATE users SET current_tickets_count = current_tickets_count + 1 WHERE id = ?',
                [newAgentId]
            );

            await connection.query(
                `UPDATE agent_availability 
                 SET current_load = current_load + 1, last_assignment_at = NOW()
                 WHERE user_id = ?`,
                [newAgentId]
            );

            // Registrar reasignación
            await connection.query(
                `INSERT INTO ticket_assignments (ticket_id, assigned_from, assigned_to, assignment_type, reason)
                 VALUES (?, ?, ?, 'manual', ?)`,
                [ticketId, oldAgentId, newAgentId, reason]
            );

            await connection.commit();

            return { success: true, message: 'Ticket reasignado correctamente' };
        } catch (error) {
            await connection.rollback();
            console.error('Error reasignando ticket:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Obtener estadísticas de asignación
     */
    static async getAssignmentStats(tenantId) {
        try {
            const [stats] = await db.query(`
                SELECT 
                    COUNT(DISTINCT CASE WHEN t.status IN ('open', 'in_progress') THEN t.id END) AS active_tickets,
                    COUNT(DISTINCT CASE WHEN t.status = 'pending' THEN t.id END) AS pending_tickets,
                    COUNT(DISTINCT tq.id) AS queued_tickets,
                    AVG(TIMESTAMPDIFF(MINUTE, tq.entered_queue_at, NOW())) AS avg_wait_time_minutes,
                    COUNT(DISTINCT CASE WHEN u.status = 'online' AND u.current_tickets_count < u.max_concurrent_tickets THEN u.id END) AS available_agents
                FROM users u
                LEFT JOIN tickets t ON u.id = t.assigned_to
                LEFT JOIN ticket_queue tq ON tq.tenant_id = u.tenant_id
                WHERE u.tenant_id = ? AND u.is_active = TRUE
            `, [tenantId]);

            return stats[0];
        } catch (error) {
            console.error('Error obteniendo estadísticas de asignación:', error);
            throw error;
        }
    }
}

module.exports = TicketAssignmentService;
