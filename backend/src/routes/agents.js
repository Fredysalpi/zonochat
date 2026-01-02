const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const { authenticateToken } = require('../middleware/auth');

// Middleware para verificar rol de admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    next();
};

/**
 * GET /api/agents
 * Obtener todos los agentes del tenant
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;

        if (!tenantId) {
            return res.status(400).json({ error: 'Usuario no asociado a ningún tenant' });
        }

        const [agents] = await db.query(`
            SELECT 
                u.id,
                u.email,
                u.first_name,
                u.last_name,
                u.role,
                u.status,
                u.avatar,
                u.is_active,
                u.assigned_channels,
                u.max_concurrent_tickets,
                u.current_tickets_count,
                (u.max_concurrent_tickets - u.current_tickets_count) AS available_slots,
                u.last_login,
                u.created_at,
                COUNT(DISTINCT t.id) AS total_tickets_handled
            FROM users u
            LEFT JOIN tickets t ON u.id = t.assigned_to
            WHERE u.tenant_id = ? AND u.role IN ('agent', 'supervisor')
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `, [tenantId]);

        // Parsear assigned_channels de JSON string a array
        const agentsWithParsedChannels = agents.map(agent => ({
            ...agent,
            assigned_channels: agent.assigned_channels
                ? (typeof agent.assigned_channels === 'string'
                    ? JSON.parse(agent.assigned_channels)
                    : agent.assigned_channels)
                : []
        }));

        res.json({ success: true, agents: agentsWithParsedChannels });
    } catch (error) {
        console.error('Error obteniendo agentes:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/agents/:id
 * Obtener un agente específico
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenant_id;

        const [agents] = await db.query(`
            SELECT 
                u.*,
                COUNT(DISTINCT t.id) AS total_tickets_handled,
                COUNT(DISTINCT CASE WHEN t.status IN ('open', 'in_progress') THEN t.id END) AS active_tickets
            FROM users u
            LEFT JOIN tickets t ON u.id = t.assigned_to
            WHERE u.id = ? AND u.tenant_id = ?
            GROUP BY u.id
        `, [id, tenantId]);

        if (agents.length === 0) {
            return res.status(404).json({ error: 'Agente no encontrado' });
        }

        const agent = agents[0];
        agent.assigned_channels = agent.assigned_channels
            ? (typeof agent.assigned_channels === 'string'
                ? JSON.parse(agent.assigned_channels)
                : agent.assigned_channels)
            : [];

        // No enviar password
        delete agent.password;

        res.json({ success: true, agent });
    } catch (error) {
        console.error('Error obteniendo agente:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/agents
 * Crear un nuevo agente
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {
            email,
            password,
            firstName,
            lastName,
            role = 'agent',
            assignedChannels = [],
            maxConcurrentTickets = 5
        } = req.body;

        const tenantId = req.user.tenant_id;

        if (!tenantId) {
            return res.status(400).json({ error: 'Usuario no asociado a ningún tenant' });
        }

        // Validaciones
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                error: 'Email, contraseña, nombre y apellido son requeridos'
            });
        }

        // Verificar límites del tenant
        const TenantService = require('../services/tenantService');
        const limits = await TenantService.checkTenantLimits(tenantId);

        if (limits.agents.exceeded) {
            return res.status(403).json({
                error: 'Límite de agentes alcanzado',
                message: `Su plan permite un máximo de ${limits.agents.max} agentes`
            });
        }

        // Verificar que el email no exista
        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear agente
        const [result] = await db.query(`
            INSERT INTO users (
                tenant_id,
                email,
                password,
                first_name,
                last_name,
                role,
                assigned_channels,
                max_concurrent_tickets,
                is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        `, [
            tenantId,
            email,
            hashedPassword,
            firstName,
            lastName,
            role,
            JSON.stringify(assignedChannels),
            maxConcurrentTickets
        ]);

        const agentId = result.insertId;

        // Crear registro de disponibilidad
        await db.query(`
            INSERT INTO agent_availability (user_id, tenant_id, is_available, current_load, max_load)
            VALUES (?, ?, TRUE, 0, ?)
        `, [agentId, tenantId, maxConcurrentTickets]);

        res.status(201).json({
            success: true,
            message: 'Agente creado exitosamente',
            agentId
        });
    } catch (error) {
        console.error('Error creando agente:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/agents/:id
 * Actualizar un agente
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenant_id;
        const updates = req.body;

        // Verificar que el agente pertenece al tenant
        const [agents] = await db.query(
            'SELECT id FROM users WHERE id = ? AND tenant_id = ?',
            [id, tenantId]
        );

        if (agents.length === 0) {
            return res.status(404).json({ error: 'Agente no encontrado' });
        }

        const allowedFields = [
            'first_name',
            'last_name',
            'role',
            'assigned_channels',
            'max_concurrent_tickets',
            'is_active',
            'status'
        ];

        const updateFields = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = ?`);

                // Convertir assigned_channels a JSON string si es array
                if (key === 'assigned_channels' && Array.isArray(value)) {
                    values.push(JSON.stringify(value));
                } else {
                    values.push(value);
                }
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
        }

        values.push(id);

        await db.query(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            values
        );

        // Si se actualizó max_concurrent_tickets, actualizar también en agent_availability
        if (updates.max_concurrent_tickets) {
            await db.query(
                'UPDATE agent_availability SET max_load = ? WHERE user_id = ?',
                [updates.max_concurrent_tickets, id]
            );
        }

        res.json({ success: true, message: 'Agente actualizado correctamente' });
    } catch (error) {
        console.error('Error actualizando agente:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/agents/:id
 * Eliminar (desactivar) un agente
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenant_id;

        // Verificar que el agente pertenece al tenant
        const [agents] = await db.query(
            'SELECT id FROM users WHERE id = ? AND tenant_id = ?',
            [id, tenantId]
        );

        if (agents.length === 0) {
            return res.status(404).json({ error: 'Agente no encontrado' });
        }

        // Soft delete
        await db.query(
            'UPDATE users SET is_active = FALSE WHERE id = ?',
            [id]
        );

        res.json({ success: true, message: 'Agente desactivado correctamente' });
    } catch (error) {
        console.error('Error eliminando agente:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/agents/:id/stats
 * Obtener estadísticas de un agente
 */
router.get('/:id/stats', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenant_id;

        const [stats] = await db.query(`
            SELECT 
                COUNT(DISTINCT t.id) AS total_tickets,
                COUNT(DISTINCT CASE WHEN t.status = 'resolved' THEN t.id END) AS resolved_tickets,
                COUNT(DISTINCT CASE WHEN t.status IN ('open', 'in_progress') THEN t.id END) AS active_tickets,
                AVG(TIMESTAMPDIFF(MINUTE, t.created_at, t.resolved_at)) AS avg_resolution_time_minutes,
                COUNT(DISTINCT CASE WHEN DATE(t.created_at) = CURDATE() THEN t.id END) AS tickets_today
            FROM users u
            LEFT JOIN tickets t ON u.id = t.assigned_to
            WHERE u.id = ? AND u.tenant_id = ?
        `, [id, tenantId]);

        res.json({ success: true, stats: stats[0] });
    } catch (error) {
        console.error('Error obteniendo estadísticas del agente:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/agents/available/:channelType
 * Obtener agentes disponibles para un canal específico
 */
router.get('/available/:channelType', authenticateToken, async (req, res) => {
    try {
        const { channelType } = req.params;
        const tenantId = req.user.tenant_id;

        const [agents] = await db.query(`
            SELECT 
                u.id,
                CONCAT(u.first_name, ' ', u.last_name) AS full_name,
                u.status,
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
            ORDER BY u.current_tickets_count ASC
        `, [tenantId, JSON.stringify(channelType)]);

        res.json({ success: true, agents });
    } catch (error) {
        console.error('Error obteniendo agentes disponibles:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
