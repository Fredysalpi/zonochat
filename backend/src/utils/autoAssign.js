const db = require('../config/database');

/**
 * Asignar tickets automáticamente a un agente cuando se conecta
 * Máximo 5 tickets por agente
 */
async function autoAssignTicketsToAgent(agentId, io) {
    try {
        console.log(`🤖 Iniciando asignación automática para agente ${agentId}...`);

        // 1. Verificar cuántos tickets tiene actualmente el agente
        const [currentTickets] = await db.query(
            `SELECT COUNT(*) as count 
             FROM tickets 
             WHERE assigned_to = ? AND status IN ('open', 'pending')`,
            [agentId]
        );

        const currentCount = currentTickets[0].count;
        const maxTickets = 5;
        const availableSlots = maxTickets - currentCount;

        console.log(`   📊 Agente ${agentId}: ${currentCount}/${maxTickets} tickets`);
        console.log(`   📦 Espacios disponibles: ${availableSlots}`);

        if (availableSlots <= 0) {
            console.log(`   ⚠️  Agente ${agentId} ya tiene el máximo de tickets (${maxTickets})`);
            return { assigned: 0, reason: 'max_capacity' };
        }

        // 2. Obtener canales asignados al agente
        const [agentData] = await db.query(
            'SELECT assigned_channels FROM users WHERE id = ?',
            [agentId]
        );

        if (agentData.length === 0) {
            console.log(`   ❌ Agente ${agentId} no encontrado`);
            return { assigned: 0, reason: 'agent_not_found' };
        }

        let assignedChannels = [];
        try {
            assignedChannels = JSON.parse(agentData[0].assigned_channels || '[]');
        } catch (e) {
            assignedChannels = [];
        }

        if (assignedChannels.length === 0) {
            console.log(`   ⚠️  Agente ${agentId} no tiene canales asignados`);
            return { assigned: 0, reason: 'no_channels' };
        }

        console.log(`   📱 Canales del agente: ${assignedChannels.join(', ')}`);

        // 3. Obtener tickets en holding de los canales del agente
        const [holdingTickets] = await db.query(
            `SELECT t.id, t.ticket_number, c.name as contact_name, ch.type as channel_type
             FROM tickets t
             JOIN contacts c ON t.contact_id = c.id
             JOIN channels ch ON t.channel_id = ch.id
             WHERE t.assigned_to IS NULL 
             AND t.status = 'open'
             AND ch.type IN (?)
             ORDER BY t.created_at ASC
             LIMIT ?`,
            [assignedChannels, availableSlots]
        );

        if (holdingTickets.length === 0) {
            console.log(`   ℹ️  No hay tickets en holding para los canales del agente`);
            return { assigned: 0, reason: 'no_tickets' };
        }

        console.log(`   📋 Tickets disponibles para asignar: ${holdingTickets.length}`);

        // 4. Asignar tickets
        let assignedCount = 0;
        for (const ticket of holdingTickets) {
            try {
                // Asignar ticket
                await db.query(
                    `UPDATE tickets 
                     SET assigned_to = ?, assigned_at = NOW(), updated_at = NOW()
                     WHERE id = ?`,
                    [agentId, ticket.id]
                );

                console.log(`   ✅ Ticket #${ticket.ticket_number} asignado a agente ${agentId}`);
                console.log(`      - Contacto: ${ticket.contact_name}`);
                console.log(`      - Canal: ${ticket.channel_type}`);

                // Emitir evento de asignación
                if (io) {
                    io.emit('ticket:assigned', {
                        ticketId: ticket.id,
                        agentId: agentId,
                        automatic: true
                    });

                    // Notificar al agente específico
                    io.to(`agent:${agentId}`).emit('ticket:new_assignment', {
                        ticketId: ticket.id,
                        ticketNumber: ticket.ticket_number,
                        contactName: ticket.contact_name,
                        channelType: ticket.channel_type
                    });
                }

                assignedCount++;
            } catch (error) {
                console.error(`   ❌ Error asignando ticket ${ticket.id}:`, error.message);
            }
        }

        console.log(`   🎯 Total asignado: ${assignedCount} ticket(s)`);

        return {
            assigned: assignedCount,
            reason: 'success',
            tickets: holdingTickets.slice(0, assignedCount)
        };

    } catch (error) {
        console.error(`❌ Error en asignación automática para agente ${agentId}:`, error);
        return { assigned: 0, reason: 'error', error: error.message };
    }
}

module.exports = { autoAssignTicketsToAgent };
