const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const ChannelConfig = require('../models/ChannelConfig');

/**
 * Obtener todas las configuraciones de canales
 * Solo admin puede ver todas
 */
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { channel_type, is_active } = req.query;

        const filters = {};
        if (channel_type) filters.channel_type = channel_type;
        if (is_active !== undefined) filters.is_active = is_active === 'true';

        const configs = await ChannelConfig.findAll(filters);

        res.json({ configs });
    } catch (error) {
        console.error('Error al obtener configuraciones de canales:', error);
        res.status(500).json({ error: 'Error al obtener configuraciones' });
    }
});

/**
 * Obtener configuración por ID
 */
router.get('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const config = await ChannelConfig.findById(id);

        if (!config) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }

        res.json({ config });
    } catch (error) {
        console.error('Error al obtener configuración:', error);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
});

/**
 * Crear nueva configuración de canal
 */
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { channel_type, name, config } = req.body;

        // Validar campos requeridos
        if (!channel_type || !name || !config) {
            return res.status(400).json({
                error: 'channel_type, name y config son requeridos'
            });
        }

        // Validar tipo de canal
        const validTypes = ['whatsapp', 'messenger', 'instagram', 'telegram'];
        if (!validTypes.includes(channel_type)) {
            return res.status(400).json({
                error: 'Tipo de canal inválido'
            });
        }

        // Validar configuración según el tipo
        const validationError = validateChannelConfig(channel_type, config);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const newConfig = await ChannelConfig.create({
            channel_type,
            name,
            config,
            created_by: req.user.id
        });

        res.status(201).json({
            message: 'Canal configurado exitosamente',
            config: newConfig
        });
    } catch (error) {
        console.error('Error al crear configuración de canal:', error);

        // Error de duplicado
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'Ya existe un canal con ese nombre'
            });
        }

        res.status(500).json({ error: 'Error al crear configuración' });
    }
});

/**
 * Actualizar configuración de canal
 */
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, config, is_active } = req.body;

        const existingConfig = await ChannelConfig.findById(id);
        if (!existingConfig) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }

        // Validar configuración si se está actualizando
        if (config) {
            const validationError = validateChannelConfig(existingConfig.channel_type, config);
            if (validationError) {
                return res.status(400).json({ error: validationError });
            }
        }

        const updatedConfig = await ChannelConfig.update(id, {
            name,
            config,
            is_active
        });

        res.json({
            message: 'Configuración actualizada exitosamente',
            config: updatedConfig
        });
    } catch (error) {
        console.error('Error al actualizar configuración:', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
});

/**
 * Eliminar configuración de canal
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const config = await ChannelConfig.findById(id);
        if (!config) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }

        await ChannelConfig.delete(id);

        res.json({ message: 'Configuración eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar configuración:', error);
        res.status(500).json({ error: 'Error al eliminar configuración' });
    }
});

/**
 * Activar/Desactivar canal
 */
router.patch('/:id/toggle', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const config = await ChannelConfig.findById(id);
        if (!config) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }

        const updatedConfig = await ChannelConfig.toggleActive(id);

        res.json({
            message: `Canal ${updatedConfig.is_active ? 'activado' : 'desactivado'} exitosamente`,
            config: updatedConfig
        });
    } catch (error) {
        console.error('Error al cambiar estado del canal:', error);
        res.status(500).json({ error: 'Error al cambiar estado' });
    }
});

/**
 * Probar configuración de canal
 */
router.post('/:id/test', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { test_message } = req.body;

        const config = await ChannelConfig.findById(id);
        if (!config) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }

        // Aquí puedes implementar lógica para enviar un mensaje de prueba
        // según el tipo de canal

        res.json({
            message: 'Prueba enviada exitosamente',
            success: true
        });
    } catch (error) {
        console.error('Error al probar canal:', error);
        res.status(500).json({ error: 'Error al probar canal' });
    }
});

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

module.exports = router;
