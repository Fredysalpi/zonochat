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

// GESTIÓN DE CANALES (usando channel_configs)
exports.getAllChannels = async (req, res) => {
    try {
        const [channels] = await db.query(
            'SELECT id, channel_type as type, name, is_active, config, created_at, updated_at FROM channel_configs ORDER BY created_at DESC'
        );

        // Parsear el JSON de config para cada canal
        const channelsWithParsedConfig = channels.map(channel => ({
            ...channel,
            config: typeof channel.config === 'string' ? JSON.parse(channel.config) : channel.config
        }));

        res.json({ success: true, channels: channelsWithParsedConfig });
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

        // Validar que config sea un objeto válido
        let configObj;
        try {
            configObj = typeof config === 'string' ? JSON.parse(config) : config;
        } catch (e) {
            return res.status(400).json({ error: 'Configuración inválida' });
        }

        // Validar campos requeridos según el tipo de canal
        const validationError = validateChannelConfig(type, configObj);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        // PASO 1: Crear en channel_configs (nueva tabla - para tokens)
        const [configResult] = await db.query(
            'INSERT INTO channel_configs (channel_type, name, config, is_active, created_by) VALUES (?, ?, ?, ?, ?)',
            [type, name, JSON.stringify(configObj), is_active !== false, req.user.id]
        );

        // PASO 2: Crear en channels (antigua tabla - para relaciones con tickets/contactos)
        const [channelResult] = await db.query(
            'INSERT INTO channels (name, type, is_active) VALUES (?, ?, ?)',
            [name, type, is_active !== false]
        );

        // PASO 3: Actualizar channel_configs con referencia al channel_id
        await db.query(
            'UPDATE channel_configs SET channel_id = ? WHERE id = ?',
            [channelResult.insertId, configResult.insertId]
        );

        const [newChannel] = await db.query(
            'SELECT id, channel_type as type, name, is_active, config, channel_id, created_at FROM channel_configs WHERE id = ?',
            [configResult.insertId]
        );

        // Parsear config antes de enviar
        newChannel[0].config = JSON.parse(newChannel[0].config);

        console.log(`✅ Canal ${type} creado: ${name}`);
        console.log(`   - Config ID: ${configResult.insertId}`);
        console.log(`   - Channel ID: ${channelResult.insertId}`);

        res.status(201).json({
            success: true,
            message: 'Canal creado exitosamente',
            channel: newChannel[0]
        });
    } catch (error) {
        console.error('Error al crear canal:', error);

        // Error de duplicado
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'Ya existe un canal con ese nombre'
            });
        }

        res.status(500).json({ error: 'Error al crear canal' });
    }
};

exports.updateChannel = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, config, is_active } = req.body;

        const [channel] = await db.query('SELECT * FROM channel_configs WHERE id = ?', [id]);
        if (channel.length === 0) {
            return res.status(404).json({ error: 'Canal no encontrado' });
        }

        const updates = [];
        const params = [];

        if (name) {
            updates.push('name = ?');
            params.push(name);
        }
        if (config) {
            // Validar config
            let configObj;
            try {
                configObj = typeof config === 'string' ? JSON.parse(config) : config;
            } catch (e) {
                return res.status(400).json({ error: 'Configuración inválida' });
            }

            // Validar campos requeridos
            const validationError = validateChannelConfig(channel[0].channel_type, configObj);
            if (validationError) {
                return res.status(400).json({ error: validationError });
            }

            updates.push('config = ?');
            params.push(JSON.stringify(configObj));
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        updates.push('updated_at = NOW()');
        params.push(id);
        await db.query(`UPDATE channel_configs SET ${updates.join(', ')} WHERE id = ?`, params);

        const [updatedChannel] = await db.query(
            'SELECT id, channel_type as type, name, is_active, config, created_at, updated_at FROM channel_configs WHERE id = ?',
            [id]
        );

        // Parsear config antes de enviar
        updatedChannel[0].config = JSON.parse(updatedChannel[0].config);

        console.log(`✅ Canal actualizado: ${updatedChannel[0].name} (ID: ${id})`);

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

        const [channel] = await db.query('SELECT * FROM channel_configs WHERE id = ?', [id]);
        if (channel.length === 0) {
            return res.status(404).json({ error: 'Canal no encontrado' });
        }

        await db.query('DELETE FROM channel_configs WHERE id = ?', [id]);

        console.log(`✅ Canal eliminado: ${channel[0].name} (ID: ${id})`);

        res.json({
            success: true,
            message: 'Canal eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar canal:', error);
        res.status(500).json({ error: 'Error al eliminar canal' });
    }
};

/**
 * Validar configuración según tipo de canal
 */
function validateChannelConfig(channel_type, config) {
    switch (channel_type) {
        case 'messenger':
            if (!config.page_access_token) {
                return 'page_access_token es requerido para Messenger';
            }
            if (!config.verify_token) {
                return 'verify_token es requerido para Messenger';
            }
            break;

        case 'whatsapp':
            if (!config.access_token) {
                return 'access_token es requerido para WhatsApp';
            }
            if (!config.phone_number_id) {
                return 'phone_number_id es requerido para WhatsApp';
            }
            if (!config.verify_token) {
                return 'verify_token es requerido para WhatsApp';
            }
            break;

        case 'instagram':
            if (!config.access_token) {
                return 'access_token es requerido para Instagram';
            }
            if (!config.verify_token) {
                return 'verify_token es requerido para Instagram';
            }
            break;

        case 'telegram':
            if (!config.bot_token) {
                return 'bot_token es requerido para Telegram';
            }
            break;

        default:
            return 'Tipo de canal no soportado';
    }

    return null;
}

module.exports = exports;
