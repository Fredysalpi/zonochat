const db = require('../config/database');
const bcrypt = require('bcrypt');

class TenantService {
    /**
     * Crear un nuevo tenant (empresa)
     */
    static async createTenant(tenantData) {
        const { name, subdomain, plan = 'free', maxAgents = 5, adminEmail, adminPassword } = tenantData;

        try {
            // Verificar que el subdomain no exista
            const [existing] = await db.query(
                'SELECT id FROM tenants WHERE subdomain = ?',
                [subdomain]
            );

            if (existing.length > 0) {
                throw new Error('El subdominio ya está en uso');
            }

            // Crear tenant
            const [result] = await db.query(
                `INSERT INTO tenants (name, subdomain, status, plan, max_agents, max_tickets_per_month)
                 VALUES (?, ?, 'active', ?, ?, ?)`,
                [name, subdomain, plan, maxAgents, plan === 'free' ? 100 : 1000]
            );

            const tenantId = result.insertId;

            // Crear usuario administrador del tenant
            if (adminEmail && adminPassword) {
                const hashedPassword = await bcrypt.hash(adminPassword, 10);
                
                await db.query(
                    `INSERT INTO users (tenant_id, email, password, first_name, last_name, role, is_active)
                     VALUES (?, ?, ?, ?, ?, 'admin', TRUE)`,
                    [tenantId, adminEmail, hashedPassword, 'Admin', name]
                );
            }

            // Crear configuraciones de canales vacías
            const channels = ['messenger', 'whatsapp', 'instagram'];
            for (const channel of channels) {
                await db.query(
                    `INSERT INTO channel_configs (tenant_id, channel_type, is_active, config)
                     VALUES (?, ?, FALSE, '{}')`,
                    [tenantId, channel]
                );
            }

            return {
                success: true,
                tenantId,
                subdomain,
                message: 'Tenant creado exitosamente'
            };
        } catch (error) {
            console.error('Error creando tenant:', error);
            throw error;
        }
    }

    /**
     * Obtener todos los tenants
     */
    static async getAllTenants() {
        try {
            const [tenants] = await db.query(`
                SELECT 
                    t.*,
                    COUNT(DISTINCT u.id) as total_agents,
                    COUNT(DISTINCT CASE WHEN u.status = 'online' THEN u.id END) as online_agents
                FROM tenants t
                LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = TRUE
                GROUP BY t.id
                ORDER BY t.created_at DESC
            `);

            return tenants;
        } catch (error) {
            console.error('Error obteniendo tenants:', error);
            throw error;
        }
    }

    /**
     * Obtener tenant por ID
     */
    static async getTenantById(tenantId) {
        try {
            const [tenants] = await db.query(
                'SELECT * FROM tenants WHERE id = ?',
                [tenantId]
            );

            if (tenants.length === 0) {
                throw new Error('Tenant no encontrado');
            }

            return tenants[0];
        } catch (error) {
            console.error('Error obteniendo tenant:', error);
            throw error;
        }
    }

    /**
     * Obtener tenant por subdomain
     */
    static async getTenantBySubdomain(subdomain) {
        try {
            const [tenants] = await db.query(
                'SELECT * FROM tenants WHERE subdomain = ? AND status = "active"',
                [subdomain]
            );

            if (tenants.length === 0) {
                throw new Error('Tenant no encontrado o inactivo');
            }

            return tenants[0];
        } catch (error) {
            console.error('Error obteniendo tenant por subdomain:', error);
            throw error;
        }
    }

    /**
     * Actualizar tenant
     */
    static async updateTenant(tenantId, updates) {
        try {
            const allowedFields = ['name', 'status', 'plan', 'max_agents', 'max_tickets_per_month', 'logo', 'settings'];
            const updateFields = [];
            const values = [];

            for (const [key, value] of Object.entries(updates)) {
                if (allowedFields.includes(key)) {
                    updateFields.push(`${key} = ?`);
                    values.push(typeof value === 'object' ? JSON.stringify(value) : value);
                }
            }

            if (updateFields.length === 0) {
                throw new Error('No hay campos válidos para actualizar');
            }

            values.push(tenantId);

            await db.query(
                `UPDATE tenants SET ${updateFields.join(', ')} WHERE id = ?`,
                values
            );

            return { success: true, message: 'Tenant actualizado' };
        } catch (error) {
            console.error('Error actualizando tenant:', error);
            throw error;
        }
    }

    /**
     * Eliminar tenant (soft delete)
     */
    static async deleteTenant(tenantId) {
        try {
            await db.query(
                'UPDATE tenants SET status = "inactive" WHERE id = ?',
                [tenantId]
            );

            return { success: true, message: 'Tenant desactivado' };
        } catch (error) {
            console.error('Error eliminando tenant:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas del tenant
     */
    static async getTenantStats(tenantId) {
        try {
            const [stats] = await db.query(`
                SELECT 
                    t.id,
                    t.name,
                    t.subdomain,
                    t.status,
                    t.plan,
                    t.max_agents,
                    t.max_tickets_per_month,
                    COUNT(DISTINCT u.id) as total_agents,
                    COUNT(DISTINCT CASE WHEN u.status = 'online' THEN u.id END) as online_agents,
                    COUNT(DISTINCT tk.id) as total_tickets,
                    COUNT(DISTINCT CASE WHEN tk.status IN ('open', 'in_progress') THEN tk.id END) as active_tickets,
                    COUNT(DISTINCT CASE WHEN tk.status = 'resolved' THEN tk.id END) as resolved_tickets,
                    COUNT(DISTINCT tq.id) as queued_tickets,
                    COUNT(DISTINCT ch.id) as total_channels,
                    COUNT(DISTINCT CASE WHEN ch.is_active = TRUE THEN ch.id END) as active_channels
                FROM tenants t
                LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = TRUE
                LEFT JOIN tickets tk ON u.tenant_id = tk.assigned_to
                LEFT JOIN ticket_queue tq ON t.id = tq.tenant_id
                LEFT JOIN channel_configs ch ON t.id = ch.tenant_id
                WHERE t.id = ?
                GROUP BY t.id
            `, [tenantId]);

            return stats[0] || null;
        } catch (error) {
            console.error('Error obteniendo estadísticas del tenant:', error);
            throw error;
        }
    }

    /**
     * Verificar límites del tenant
     */
    static async checkTenantLimits(tenantId) {
        try {
            const tenant = await this.getTenantById(tenantId);
            
            // Contar agentes activos
            const [agentCount] = await db.query(
                'SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND is_active = TRUE',
                [tenantId]
            );

            // Contar tickets del mes actual
            const [ticketCount] = await db.query(
                `SELECT COUNT(*) as count FROM tickets t
                 JOIN users u ON t.assigned_to = u.id
                 WHERE u.tenant_id = ? AND MONTH(t.created_at) = MONTH(NOW())`,
                [tenantId]
            );

            return {
                agents: {
                    current: agentCount[0].count,
                    max: tenant.max_agents,
                    available: tenant.max_agents - agentCount[0].count,
                    exceeded: agentCount[0].count >= tenant.max_agents
                },
                tickets: {
                    current: ticketCount[0].count,
                    max: tenant.max_tickets_per_month,
                    available: tenant.max_tickets_per_month - ticketCount[0].count,
                    exceeded: ticketCount[0].count >= tenant.max_tickets_per_month
                }
            };
        } catch (error) {
            console.error('Error verificando límites del tenant:', error);
            throw error;
        }
    }
}

module.exports = TenantService;
