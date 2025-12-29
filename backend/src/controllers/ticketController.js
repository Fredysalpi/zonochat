const Ticket = require('../models/Ticket');

/**
 * Obtener todos los tickets
 */
exports.getAllTickets = async (req, res) => {
    try {
        const { status, channel, agent_id, page = 1, limit = 20 } = req.query;
        const userRole = req.user.role;
        const userId = req.user.id;

        const filters = {};
        if (status) filters.status = status;
        if (channel) filters.channel = channel;

        // Si es agente regular, solo puede ver sus propios tickets
        if (userRole === 'agent') {
            filters.assigned_to = userId;
        } else if (agent_id) {
            // Supervisores y admins pueden filtrar por agente
            filters.assigned_to = agent_id;
        }

        const offset = (page - 1) * limit;
        const tickets = await Ticket.findAll(filters, limit, offset);
        const total = await Ticket.count(filters);

        res.json({
            tickets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error al obtener tickets:', error);
        res.status(500).json({
            error: 'Error al obtener tickets'
        });
    }
};

/**
 * Obtener un ticket por ID
 */
exports.getTicketById = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({
                error: 'Ticket no encontrado'
            });
        }

        res.json({ ticket });
    } catch (error) {
        console.error('Error al obtener ticket:', error);
        res.status(500).json({
            error: 'Error al obtener ticket'
        });
    }
};

/**
 * Crear nuevo ticket
 */
exports.createTicket = async (req, res) => {
    try {
        const { contact_id, channel_id, subject, priority } = req.body;

        if (!contact_id || !channel_id) {
            return res.status(400).json({
                error: 'contact_id y channel_id son requeridos'
            });
        }

        const ticket = await Ticket.create({
            contact_id,
            channel_id,
            subject: subject || 'Nueva conversación',
            priority: priority || 'medium',
            status: 'open'
        });

        // Emitir evento de nuevo ticket
        const io = req.app.get('io');
        io.emit('ticket:created', ticket);

        res.status(201).json({
            message: 'Ticket creado exitosamente',
            ticket
        });
    } catch (error) {
        console.error('Error al crear ticket:', error);
        res.status(500).json({
            error: 'Error al crear ticket'
        });
    }
};

/**
 * Asignar ticket a un agente
 */
exports.assignTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { agent_id } = req.body;

        if (!agent_id) {
            return res.status(400).json({
                error: 'agent_id es requerido'
            });
        }

        const ticket = await Ticket.assign(id, agent_id);

        if (!ticket) {
            return res.status(404).json({
                error: 'Ticket no encontrado'
            });
        }

        // Emitir evento de asignación
        const io = req.app.get('io');
        io.to(`agent:${agent_id}`).emit('ticket:assigned', ticket);
        io.emit('ticket:updated', ticket);

        res.json({
            message: 'Ticket asignado exitosamente',
            ticket
        });
    } catch (error) {
        console.error('Error al asignar ticket:', error);
        res.status(500).json({
            error: 'Error al asignar ticket'
        });
    }
};

/**
 * Transferir ticket a otro agente
 */
exports.transferTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { agent_id, reason } = req.body;
        const currentUserId = req.user.id;

        if (!agent_id) {
            return res.status(400).json({
                error: 'agent_id es requerido'
            });
        }

        // Obtener ticket actual
        const currentTicket = await Ticket.findById(id);

        if (!currentTicket) {
            return res.status(404).json({
                error: 'Ticket no encontrado'
            });
        }

        // Asignar al nuevo agente
        const ticket = await Ticket.assign(id, agent_id);

        // Registrar transferencia en historial (si existe tabla de historial)
        // TODO: Implementar registro en ticket_assignments

        // Emitir eventos
        const io = req.app.get('io');

        // Obtener información del supervisor que está reasignando
        const supervisorName = `${req.user.first_name} ${req.user.last_name}`;

        // Notificar al agente anterior
        if (currentTicket.assigned_to) {
            io.to(`agent:${currentTicket.assigned_to}`).emit('ticket:transferred_out', {
                ticketId: id,
                newAgentId: agent_id,
                reason,
                supervisorName,
                supervisorId: currentUserId
            });
        }

        // Notificar al nuevo agente con información del supervisor
        io.to(`agent:${agent_id}`).emit('ticket:transferred_in', {
            ...ticket,
            transferredBy: supervisorName,
            transferredById: currentUserId,
            reason
        });

        // Emitir mensaje del sistema a la sala del ticket
        setTimeout(() => {
            io.to(`ticket:${id}`).emit('system:message', {
                ticketId: id,
                message: `Ticket fue reasignado por ${supervisorName}`,
                type: 'transfer',
                timestamp: new Date()
            });
        }, 500); // Esperar 500ms para que el agente se una a la sala

        // Notificar a todos sobre la actualización
        io.emit('ticket:updated', ticket);

        res.json({
            message: 'Ticket transferido exitosamente',
            ticket
        });
    } catch (error) {
        console.error('Error al transferir ticket:', error);
        res.status(500).json({
            error: 'Error al transferir ticket'
        });
    }
};

/**
 * Actualizar estado del ticket
 */
exports.updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['open', 'pending', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Estado inválido'
            });
        }

        const ticket = await Ticket.updateStatus(id, status);

        if (!ticket) {
            return res.status(404).json({
                error: 'Ticket no encontrado'
            });
        }

        // Emitir evento de actualización
        const io = req.app.get('io');
        io.to(`ticket:${id}`).emit('ticket:updated', ticket);

        res.json({
            message: 'Estado actualizado exitosamente',
            ticket
        });
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({
            error: 'Error al actualizar estado'
        });
    }
};

/**
 * Actualizar prioridad del ticket
 */
exports.updateTicketPriority = async (req, res) => {
    try {
        const { id } = req.params;
        const { priority } = req.body;

        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        if (!validPriorities.includes(priority)) {
            return res.status(400).json({
                error: 'Prioridad inválida'
            });
        }

        const ticket = await Ticket.updatePriority(id, priority);

        if (!ticket) {
            return res.status(404).json({
                error: 'Ticket no encontrado'
            });
        }

        // Emitir evento de actualización
        const io = req.app.get('io');
        io.to(`ticket:${id}`).emit('ticket:updated', ticket);

        res.json({
            message: 'Prioridad actualizada exitosamente',
            ticket
        });
    } catch (error) {
        console.error('Error al actualizar prioridad:', error);
        res.status(500).json({
            error: 'Error al actualizar prioridad'
        });
    }
};

/**
 * Obtener tickets del agente actual
 */
exports.getMyTickets = async (req, res) => {
    try {
        const agentId = req.user.id;
        const { status } = req.query;

        const filters = { agent_id: agentId };
        if (status) filters.status = status;

        const tickets = await Ticket.findAll(filters);

        res.json({ tickets });
    } catch (error) {
        console.error('Error al obtener mis tickets:', error);
        res.status(500).json({
            error: 'Error al obtener tickets'
        });
    }
};
