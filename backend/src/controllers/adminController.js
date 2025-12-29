const db = require('../config/database');
const bcrypt = require('bcryptjs');

// GESTIÓN DE USUARIOS/AGENTES
exports.getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        let query = 'SELECT id, email, first_name, last_name, role, is_active, avatar, created_at FROM users';
        const params = [];

        if (role) {
            query += ' WHERE role = ?';
            params.push(role);
        }

        query += ' ORDER BY created_at DESC';
        const [users] = await db.query(query, params);

        res.json({ success: true, users });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { email, password, first_name, last_name, role, is_active } = req.body;

        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        // Verificar si el email ya existe
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO users (email, password, first_name, last_name, role, is_active)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [email, hashedPassword, first_name, last_name, role || 'agent', is_active !== false]
        );

        const [newUser] = await db.query(
            'SELECT id, email, first_name, last_name, role, is_active, created_at FROM users WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            user: newUser[0]
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, password, first_name, last_name, role, is_active } = req.body;

        // Verificar que el usuario existe
        const [user] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (user.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Verificar email único si se está cambiando
        if (email && email !== user[0].email) {
            const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'El email ya está en uso' });
            }
        }

        // Construir query de actualización
        const updates = [];
        const params = [];

        if (email) {
            updates.push('email = ?');
            params.push(email);
        }
        if (password) {
            updates.push('password = ?');
            params.push(await bcrypt.hash(password, 10));
        }
        if (first_name) {
            updates.push('first_name = ?');
            params.push(first_name);
        }
        if (last_name) {
            updates.push('last_name = ?');
            params.push(last_name);
        }
        if (role) {
            updates.push('role = ?');
            params.push(role);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        params.push(id);
        await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

        const [updatedUser] = await db.query(
            'SELECT id, email, first_name, last_name, role, is_active, created_at FROM users WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            user: updatedUser[0]
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // No permitir eliminar al propio usuario
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
        }

        const [user] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (user.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        await db.query('DELETE FROM users WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};

// GESTIÓN DE CANALES
exports.getAllChannels = async (req, res) => {
    try {
        const [channels] = await db.query('SELECT * FROM channels ORDER BY created_at DESC');
        res.json({ success: true, channels });
    } catch (error) {
        console.error('Error al obtener canales:', error);
        res.status(500).json({ error: 'Error al obtener canales' });
    }
};

exports.createChannel = async (req, res) => {
    try {
        const { name, type, config, is_active } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Nombre y tipo son requeridos' });
        }

        const [result] = await db.query(
            'INSERT INTO channels (name, type, config, is_active) VALUES (?, ?, ?, ?)',
            [name, type, config || '{}', is_active !== false]
        );

        const [newChannel] = await db.query('SELECT * FROM channels WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Canal creado exitosamente',
            channel: newChannel[0]
        });
    } catch (error) {
        console.error('Error al crear canal:', error);
        res.status(500).json({ error: 'Error al crear canal' });
    }
};

exports.updateChannel = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, config, is_active } = req.body;

        const [channel] = await db.query('SELECT * FROM channels WHERE id = ?', [id]);
        if (channel.length === 0) {
            return res.status(404).json({ error: 'Canal no encontrado' });
        }

        const updates = [];
        const params = [];

        if (name) {
            updates.push('name = ?');
            params.push(name);
        }
        if (type) {
            updates.push('type = ?');
            params.push(type);
        }
        if (config) {
            updates.push('config = ?');
            params.push(config);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        params.push(id);
        await db.query(`UPDATE channels SET ${updates.join(', ')} WHERE id = ?`, params);

        const [updatedChannel] = await db.query('SELECT * FROM channels WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Canal actualizado exitosamente',
            channel: updatedChannel[0]
        });
    } catch (error) {
        console.error('Error al actualizar canal:', error);
        res.status(500).json({ error: 'Error al actualizar canal' });
    }
};

exports.deleteChannel = async (req, res) => {
    try {
        const { id } = req.params;

        const [channel] = await db.query('SELECT * FROM channels WHERE id = ?', [id]);
        if (channel.length === 0) {
            return res.status(404).json({ error: 'Canal no encontrado' });
        }

        await db.query('DELETE FROM channels WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Canal eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar canal:', error);
        res.status(500).json({ error: 'Error al eliminar canal' });
    }
};

module.exports = exports;
