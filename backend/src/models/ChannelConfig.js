const db = require('../config/database');

class ChannelConfig {
    /**
     * Crear nueva configuración de canal
     */
    static async create(data) {
        const { channel_type, name, config, created_by } = data;

        const [result] = await db.query(
            `INSERT INTO channel_configs (channel_type, name, config, created_by)
             VALUES (?, ?, ?, ?)`,
            [channel_type, name, JSON.stringify(config), created_by]
        );

        return this.findById(result.insertId);
    }

    /**
     * Obtener configuración por ID
     */
    static async findById(id) {
        const [rows] = await db.query(
            `SELECT id, channel_type, name, is_active, config, created_at, updated_at
             FROM channel_configs
             WHERE id = ?`,
            [id]
        );

        if (rows.length === 0) return null;

        // Parsear JSON
        const config = rows[0];
        config.config = JSON.parse(config.config);
        return config;
    }

    /**
     * Obtener todas las configuraciones
     */
    static async findAll(filters = {}) {
        let query = `SELECT id, channel_type, name, is_active, config, created_at, updated_at
                     FROM channel_configs WHERE 1=1`;
        const params = [];

        if (filters.channel_type) {
            query += ` AND channel_type = ?`;
            params.push(filters.channel_type);
        }

        if (filters.is_active !== undefined) {
            query += ` AND is_active = ?`;
            params.push(filters.is_active);
        }

        query += ` ORDER BY created_at DESC`;

        const [rows] = await db.query(query, params);

        // Parsear JSON en cada row
        return rows.map(row => ({
            ...row,
            config: JSON.parse(row.config)
        }));
    }

    /**
     * Obtener configuración activa por tipo de canal
     */
    static async findActiveByType(channel_type) {
        const [rows] = await db.query(
            `SELECT id, channel_type, name, is_active, config, created_at, updated_at
             FROM channel_configs
             WHERE channel_type = ? AND is_active = true
             LIMIT 1`,
            [channel_type]
        );

        if (rows.length === 0) return null;

        const config = rows[0];
        config.config = JSON.parse(config.config);
        return config;
    }

    /**
     * Actualizar configuración
     */
    static async update(id, data) {
        const { name, config, is_active } = data;
        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }

        if (config !== undefined) {
            updates.push('config = ?');
            params.push(JSON.stringify(config));
        }

        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active);
        }

        if (updates.length === 0) return this.findById(id);

        params.push(id);

        await db.query(
            `UPDATE channel_configs SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        return this.findById(id);
    }

    /**
     * Eliminar configuración
     */
    static async delete(id) {
        await db.query('DELETE FROM channel_configs WHERE id = ?', [id]);
        return true;
    }

    /**
     * Activar/Desactivar canal
     */
    static async toggleActive(id) {
        await db.query(
            `UPDATE channel_configs SET is_active = NOT is_active WHERE id = ?`,
            [id]
        );
        return this.findById(id);
    }

    /**
     * Verificar si un canal está configurado y activo
     */
    static async isChannelActive(channel_type) {
        const config = await this.findActiveByType(channel_type);
        return config !== null;
    }
}

module.exports = ChannelConfig;
