const db = require('../config/database');

class Contact {
    /**
     * Crear nuevo contacto
     */
    static async create(data) {
        const { external_id, phone, name, email, channel } = data;

        const [result] = await db.query(
            `INSERT INTO contacts (external_id, phone, name, email, channel)
             VALUES (?, ?, ?, ?, ?)`,
            [external_id || null, phone || null, name, email || null, channel]
        );

        return this.findById(result.insertId);
    }

    /**
     * Buscar contacto por ID
     */
    static async findById(id) {
        const [rows] = await db.query(
            'SELECT * FROM contacts WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    /**
     * Buscar contacto por external_id y canal
     */
    static async findByExternalId(externalId, channel) {
        const [rows] = await db.query(
            'SELECT * FROM contacts WHERE external_id = ? AND channel = ?',
            [externalId, channel]
        );
        return rows[0] || null;
    }

    /**
     * Buscar contacto por teléfono
     */
    static async findByPhone(phone) {
        const [rows] = await db.query(
            'SELECT * FROM contacts WHERE phone = ?',
            [phone]
        );
        return rows[0] || null;
    }

    /**
     * Actualizar contacto
     */
    static async update(id, data) {
        const { name, email, phone } = data;
        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            params.push(email);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            params.push(phone);
        }

        if (updates.length === 0) return this.findById(id);

        params.push(id);

        await db.query(
            `UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        return this.findById(id);
    }
}

module.exports = Contact;
