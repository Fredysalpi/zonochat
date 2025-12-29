const db = require('../config/database');

class User {
    /**
     * Buscar usuario por email
     */
    static async findByEmail(email) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    }

    /**
     * Buscar usuario por ID
     */
    static async findById(id) {
        const [rows] = await db.query(
            'SELECT id, email, first_name, last_name, role, avatar, status, is_active, max_concurrent_tickets, created_at, last_login FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    /**
     * Crear nuevo usuario
     */
    static async create(userData) {
        const { email, password, first_name, last_name, role = 'agent', max_concurrent_tickets = 5 } = userData;

        const [result] = await db.query(
            'INSERT INTO users (email, password, first_name, last_name, role, max_concurrent_tickets) VALUES (?, ?, ?, ?, ?, ?)',
            [email, password, first_name, last_name, role, max_concurrent_tickets]
        );

        return this.findById(result.insertId);
    }

    /**
     * Actualizar usuario
     */
    static async update(id, userData) {
        const fields = [];
        const values = [];

        Object.keys(userData).forEach(key => {
            if (userData[key] !== undefined && key !== 'id' && key !== 'password') {
                fields.push(`${key} = ?`);
                values.push(userData[key]);
            }
        });

        if (fields.length === 0) {
            return this.findById(id);
        }

        values.push(id);

        await db.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return this.findById(id);
    }

    /**
     * Actualizar estado del usuario
     */
    static async updateStatus(id, status) {
        await db.query(
            'UPDATE users SET status = ? WHERE id = ?',
            [status, id]
        );

        // Registrar en log de estados
        await db.query(
            'INSERT INTO agent_status_log (user_id, status) VALUES (?, ?)',
            [id, status]
        );

        return this.findById(id);
    }

    /**
     * Actualizar último login
     */
    static async updateLastLogin(id) {
        await db.query(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [id]
        );
    }

    /**
     * Obtener todos los usuarios
     */
    static async getAll(filters = {}) {
        let query = 'SELECT id, email, first_name, last_name, role, avatar, status, is_active, max_concurrent_tickets, created_at, last_login FROM users WHERE 1=1';
        const params = [];

        if (filters.role) {
            query += ' AND role = ?';
            params.push(filters.role);
        }

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.is_active !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.is_active);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await db.query(query, params);
        return rows;
    }

    /**
     * Obtener agentes disponibles
     */
    static async getAvailableAgents() {
        const [rows] = await db.query(`
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.status,
                u.max_concurrent_tickets,
                COUNT(t.id) as active_tickets,
                (u.max_concurrent_tickets - COUNT(t.id)) as available_slots
            FROM users u
            LEFT JOIN tickets t ON u.id = t.assigned_to 
                AND t.status IN ('open', 'in_progress', 'pending')
            WHERE u.role = 'agent' 
                AND u.is_active = TRUE 
                AND u.status IN ('online', 'away')
            GROUP BY u.id
            HAVING available_slots > 0
            ORDER BY available_slots DESC, active_tickets ASC
        `);
        return rows;
    }

    /**
     * Eliminar usuario (soft delete)
     */
    static async delete(id) {
        await db.query(
            'UPDATE users SET is_active = FALSE WHERE id = ?',
            [id]
        );
        return true;
    }
}

module.exports = User;
