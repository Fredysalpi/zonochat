const db = require('../config/database');

// Obtener estadísticas de agentes
const getAgentStats = async (req, res) => {
    try {
        // Obtener total de agentes
        const [totalResult] = await db.query(`
            SELECT COUNT(*) as total
            FROM users
            WHERE role = 'agent'
        `);

        const total = totalResult[0].total;

        // Obtener agentes conectados desde el servidor WebSocket
        const getConnectedAgents = req.app.get('getConnectedAgents');
        const connectedAgentIds = getConnectedAgents ? getConnectedAgents() : [];

        // Filtrar solo los que son agentes (no admins ni supervisors)
        const [connectedAgentsData] = await db.query(`
            SELECT id
            FROM users
            WHERE id IN (?) AND role = 'agent'
        `, [connectedAgentIds.length > 0 ? connectedAgentIds : [0]]);

        const active = connectedAgentsData.length;
        const inactive = total - active;

        res.json({
            total,
            active,
            inactive
        });
    } catch (error) {
        console.error('Error al obtener estadísticas de agentes:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};

// Obtener lista de agentes con sus métricas
const getAgents = async (req, res) => {
    try {
        // Obtener agentes conectados y sus datos desde el servidor WebSocket
        const getConnectedAgents = req.app.get('getConnectedAgents');
        const getConnectedAgentsData = req.app.get('getConnectedAgentsData');
        const connectedAgentIds = getConnectedAgents ? getConnectedAgents() : [];
        const connectedSet = new Set(connectedAgentIds);
        const connectedAgentsData = getConnectedAgentsData ? getConnectedAgentsData() : new Map();

        const [agents] = await db.query(`
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                NOW() as last_activity,
                COUNT(DISTINCT CASE WHEN t.status = 'open' THEN t.id END) as available,
                COUNT(DISTINCT CASE WHEN t.status = 'pending' THEN t.id END) as resolving,
                COUNT(DISTINCT CASE WHEN t.status = 'closed' THEN t.id END) as resolved
            FROM users u
            LEFT JOIN tickets t ON u.id = t.assigned_to
            WHERE u.role = 'agent'
            GROUP BY u.id, u.first_name, u.last_name, u.email
            ORDER BY u.first_name ASC
        `);

        // Marcar agentes como online y usar su estado real del WebSocket
        const agentsWithChannels = agents.map(agent => {
            const isOnline = connectedSet.has(agent.id);
            const agentData = connectedAgentsData.get(agent.id);

            // Usar el estado real del agente si está conectado
            let status = 'offline';
            if (isOnline && agentData) {
                status = agentData.status || 'available';
            }

            return {
                ...agent,
                is_online: isOnline,
                status: status,
                channels: ['whatsapp', 'messenger', 'instagram'] // Esto debería venir de una tabla de relación
            };
        });

        res.json({ agents: agentsWithChannels });
    } catch (error) {
        console.error('Error al obtener agentes:', error);
        res.status(500).json({ error: 'Error al obtener agentes' });
    }
};

// Obtener tickets en holding (sin asignar)
const getHoldingTickets = async (req, res) => {
    try {
        const [tickets] = await db.query(`
            SELECT 
                t.id,
                t.ticket_number,
                t.subject,
                t.status,
                t.priority,
                t.created_at,
                t.updated_at,
                c.id as contact_id,
                c.name as contact_name,
                c.phone as contact_phone,
                c.email as contact_email,
                ch.type as channel_type
            FROM tickets t
            LEFT JOIN contacts c ON t.contact_id = c.id
            LEFT JOIN channels ch ON t.channel_id = ch.id
            WHERE t.assigned_to IS NULL AND t.status = 'open'
            ORDER BY t.created_at ASC
        `);

        res.json({ tickets });
    } catch (error) {
        console.error('Error al obtener tickets en holding:', error);
        res.status(500).json({ error: 'Error al obtener tickets en holding' });
    }
};

// Obtener tickets asignados a un agente específico
const getAgentTickets = async (req, res) => {
    try {
        const { agentId } = req.params;

        const [tickets] = await db.query(`
            SELECT 
                t.id,
                t.ticket_number,
                t.subject,
                t.status,
                t.priority,
                t.created_at,
                t.updated_at,
                t.assigned_at,
                c.id as contact_id,
                c.name as contact_name,
                c.phone as contact_phone,
                c.email as contact_email,
                ch.type as channel_type,
                (SELECT content FROM messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
                (SELECT sender_type FROM messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) as last_sender_type,
                (SELECT COUNT(*) FROM messages WHERE ticket_id = t.id AND is_read = 0 AND sender_type = 'contact') as unread_count
            FROM tickets t
            LEFT JOIN contacts c ON t.contact_id = c.id
            LEFT JOIN channels ch ON t.channel_id = ch.id
            WHERE t.assigned_to = ?
            ORDER BY t.updated_at DESC
        `, [agentId]);

        res.json({ tickets });
    } catch (error) {
        console.error('Error al obtener tickets del agente:', error);
        res.status(500).json({ error: 'Error al obtener tickets del agente' });
    }
};

// Actualizar estado online/offline del agente
const updateAgentStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { is_online } = req.body;

        await db.query(
            'UPDATE users SET is_online = ?, last_activity = NOW() WHERE id = ?',
            [is_online, userId]
        );

        res.json({ message: 'Estado actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar estado del agente:', error);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
};

module.exports = {
    getAgentStats,
    getAgents,
    getHoldingTickets,
    getAgentTickets,
    updateAgentStatus
};
