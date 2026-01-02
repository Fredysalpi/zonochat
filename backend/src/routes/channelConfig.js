const express = require('express');
const router = express.Router();
const ChannelConfigService = require('../services/channelConfigService');
const { authenticateToken } = require('../middleware/auth');

// Middleware para verificar rol de admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    next();
};

/**
 * GET /api/channel-config
 * Obtener todas las configuraciones de canales del tenant
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;

        if (!tenantId) {
            return res.status(400).json({ error: 'Usuario no asociado a ningún tenant' });
        }

        const configs = await ChannelConfigService.getAllChannelConfigs(tenantId);

        // Ocultar tokens sensibles en la respuesta
        const sanitizedConfigs = configs.map(config => ({
            ...config,
            config: {
                ...config.config,
                page_access_token: config.config.page_access_token ? '***' : '',
                access_token: config.config.access_token ? '***' : '',
                app_secret: config.config.app_secret ? '***' : '',
                bot_token: config.config.bot_token ? '***' : ''
            }
        }));

        res.json({ success: true, configs: sanitizedConfigs });
    } catch (error) {
        console.error('Error obteniendo configuraciones:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/channel-config/:channelType
 * Obtener configuración de un canal específico
 */
router.get('/:channelType', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { channelType } = req.params;
        const tenantId = req.user.tenant_id;

        if (!tenantId) {
            return res.status(400).json({ error: 'Usuario no asociado a ningún tenant' });
        }

        const config = await ChannelConfigService.getChannelConfig(tenantId, channelType);

        if (!config) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }

        // Ocultar tokens sensibles
        const sanitizedConfig = {
            ...config,
            config: {
                ...config.config,
                page_access_token: config.config.page_access_token ? '***' : '',
                access_token: config.config.access_token ? '***' : '',
                app_secret: config.config.app_secret ? '***' : '',
                bot_token: config.config.bot_token ? '***' : ''
            }
        };

        res.json({ success: true, config: sanitizedConfig });
    } catch (error) {
        console.error('Error obteniendo configuración:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/channel-config/:channelType
 * Guardar/Actualizar configuración de un canal
 */
router.post('/:channelType', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { channelType } = req.params;
        const tenantId = req.user.tenant_id;
        const config = req.body;

        if (!tenantId) {
            return res.status(400).json({ error: 'Usuario no asociado a ningún tenant' });
        }

        // Validar tipo de canal
        const validChannels = ['messenger', 'whatsapp', 'instagram', 'telegram', 'webchat'];
        if (!validChannels.includes(channelType)) {
            return res.status(400).json({ error: 'Tipo de canal inválido' });
        }

        const result = await ChannelConfigService.saveChannelConfig(tenantId, channelType, config);
        res.json(result);
    } catch (error) {
        console.error('Error guardando configuración:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * PATCH /api/channel-config/:channelType/toggle
 * Activar/Desactivar un canal
 */
router.patch('/:channelType/toggle', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { channelType } = req.params;
        const { isActive } = req.body;
        const tenantId = req.user.tenant_id;

        if (!tenantId) {
            return res.status(400).json({ error: 'Usuario no asociado a ningún tenant' });
        }

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ error: 'El campo isActive debe ser booleano' });
        }

        const result = await ChannelConfigService.toggleChannel(tenantId, channelType, isActive);
        res.json(result);
    } catch (error) {
        console.error('Error toggling canal:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * DELETE /api/channel-config/:channelType
 * Eliminar configuración de un canal
 */
router.delete('/:channelType', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { channelType } = req.params;
        const tenantId = req.user.tenant_id;

        if (!tenantId) {
            return res.status(400).json({ error: 'Usuario no asociado a ningún tenant' });
        }

        const result = await ChannelConfigService.deleteChannelConfig(tenantId, channelType);
        res.json(result);
    } catch (error) {
        console.error('Error eliminando configuración:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/channel-config/active/list
 * Obtener lista de canales activos
 */
router.get('/active/list', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;

        if (!tenantId) {
            return res.status(400).json({ error: 'Usuario no asociado a ningún tenant' });
        }

        const channels = await ChannelConfigService.getActiveChannels(tenantId);

        // Solo retornar tipos de canales activos (sin tokens)
        const activeChannelTypes = channels.map(ch => ch.channel_type);

        res.json({ success: true, activeChannels: activeChannelTypes });
    } catch (error) {
        console.error('Error obteniendo canales activos:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/channel-config/:channelType/test
 * Probar configuración de un canal
 */
router.post('/:channelType/test', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { channelType } = req.params;
        const tenantId = req.user.tenant_id;

        if (!tenantId) {
            return res.status(400).json({ error: 'Usuario no asociado a ningún tenant' });
        }

        const config = await ChannelConfigService.getChannelConfig(tenantId, channelType);

        if (!config) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }

        // Verificar si la configuración está completa
        const isComplete = ChannelConfigService.isConfigComplete(channelType, config.config);

        if (!isComplete) {
            return res.status(400).json({
                error: 'Configuración incompleta',
                message: 'Por favor complete todos los campos requeridos antes de activar el canal'
            });
        }

        // TODO: Implementar prueba real de conexión con la API del canal
        // Por ahora solo verificamos que los campos estén completos

        res.json({
            success: true,
            message: 'Configuración válida',
            isComplete: true
        });
    } catch (error) {
        console.error('Error probando configuración:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
