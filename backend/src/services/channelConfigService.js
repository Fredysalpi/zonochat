const db = require('../config/database');

class ChannelConfigService {
    /**
     * Obtener todas las configuraciones de canales de un tenant
     */
    static async getAllChannelConfigs(tenantId) {
        try {
            const [configs] = await db.query(
                `SELECT 
                    id,
                    channel_type,
                    is_active,
                    config,
                    webhook_url,
                    last_sync_at,
                    created_at,
                    updated_at
                 FROM channel_configs 
                 WHERE tenant_id = ?
                 ORDER BY channel_type`,
                [tenantId]
            );

            // Parsear JSON config
            return configs.map(config => ({
                ...config,
                config: typeof config.config === 'string' ? JSON.parse(config.config) : config.config
            }));
        } catch (error) {
            console.error('Error obteniendo configuraciones de canales:', error);
            throw error;
        }
    }

    /**
     * Obtener configuración de un canal específico
     */
    static async getChannelConfig(tenantId, channelType) {
        try {
            const [configs] = await db.query(
                'SELECT * FROM channel_configs WHERE tenant_id = ? AND channel_type = ?',
                [tenantId, channelType]
            );

            if (configs.length === 0) {
                return null;
            }

            const config = configs[0];
            return {
                ...config,
                config: typeof config.config === 'string' ? JSON.parse(config.config) : config.config
            };
        } catch (error) {
            console.error(`Error obteniendo config de ${channelType}:`, error);
            throw error;
        }
    }

    /**
     * Guardar/Actualizar configuración de un canal
     */
    static async saveChannelConfig(tenantId, channelType, config) {
        try {
            const configJson = JSON.stringify(config);

            // Verificar si ya existe
            const existing = await this.getChannelConfig(tenantId, channelType);

            if (existing) {
                // Actualizar
                await db.query(
                    `UPDATE channel_configs 
                     SET config = ?, updated_at = NOW()
                     WHERE tenant_id = ? AND channel_type = ?`,
                    [configJson, tenantId, channelType]
                );
            } else {
                // Crear nuevo
                await db.query(
                    `INSERT INTO channel_configs (tenant_id, channel_type, config, is_active)
                     VALUES (?, ?, ?, FALSE)`,
                    [tenantId, channelType, configJson]
                );
            }

            return {
                success: true,
                message: `Configuración de ${channelType} guardada correctamente`
            };
        } catch (error) {
            console.error(`Error guardando config de ${channelType}:`, error);
            throw error;
        }
    }

    /**
     * Activar/Desactivar un canal
     */
    static async toggleChannel(tenantId, channelType, isActive) {
        try {
            // Verificar que la configuración existe y está completa
            const config = await this.getChannelConfig(tenantId, channelType);

            if (!config) {
                throw new Error('Configuración de canal no encontrada');
            }

            if (isActive && !this.isConfigComplete(channelType, config.config)) {
                throw new Error('La configuración del canal está incompleta. Por favor, complete todos los campos requeridos.');
            }

            await db.query(
                'UPDATE channel_configs SET is_active = ?, updated_at = NOW() WHERE tenant_id = ? AND channel_type = ?',
                [isActive, tenantId, channelType]
            );

            // Actualizar también en la tabla channels si existe
            await db.query(
                'UPDATE channels SET is_active = ? WHERE tenant_id = ? AND type = ?',
                [isActive, tenantId, channelType]
            );

            return {
                success: true,
                message: `Canal ${channelType} ${isActive ? 'activado' : 'desactivado'}`
            };
        } catch (error) {
            console.error(`Error toggling ${channelType}:`, error);
            throw error;
        }
    }

    /**
     * Verificar si la configuración está completa
     */
    static isConfigComplete(channelType, config) {
        const requiredFields = {
            messenger: ['page_access_token', 'verify_token', 'page_id'],
            whatsapp: ['phone_number_id', 'access_token', 'verify_token'],
            instagram: ['instagram_account_id', 'page_access_token', 'verify_token'],
            telegram: ['bot_token'],
            webchat: [] // No requiere configuración externa
        };

        const required = requiredFields[channelType] || [];

        return required.every(field => config[field] && config[field].trim() !== '');
    }

    /**
     * Obtener configuración para uso en webhooks (sin exponer tokens completos)
     */
    static async getPublicChannelConfig(tenantId, channelType) {
        try {
            const config = await this.getChannelConfig(tenantId, channelType);

            if (!config || !config.is_active) {
                return null;
            }

            // Retornar solo información pública
            return {
                channel_type: config.channel_type,
                is_active: config.is_active,
                webhook_url: config.webhook_url,
                verify_token: config.config.verify_token // Solo el verify token
            };
        } catch (error) {
            console.error('Error obteniendo config pública:', error);
            throw error;
        }
    }

    /**
     * Actualizar URL del webhook
     */
    static async updateWebhookUrl(tenantId, channelType, webhookUrl) {
        try {
            await db.query(
                'UPDATE channel_configs SET webhook_url = ?, updated_at = NOW() WHERE tenant_id = ? AND channel_type = ?',
                [webhookUrl, tenantId, channelType]
            );

            return { success: true };
        } catch (error) {
            console.error('Error actualizando webhook URL:', error);
            throw error;
        }
    }

    /**
     * Registrar sincronización exitosa
     */
    static async recordSync(tenantId, channelType) {
        try {
            await db.query(
                'UPDATE channel_configs SET last_sync_at = NOW() WHERE tenant_id = ? AND channel_type = ?',
                [tenantId, channelType]
            );

            return { success: true };
        } catch (error) {
            console.error('Error registrando sync:', error);
            throw error;
        }
    }

    /**
     * Validar token de verificación para webhooks
     */
    static async validateVerifyToken(tenantId, channelType, token) {
        try {
            const config = await this.getChannelConfig(tenantId, channelType);

            if (!config || !config.is_active) {
                return false;
            }

            return config.config.verify_token === token;
        } catch (error) {
            console.error('Error validando verify token:', error);
            return false;
        }
    }

    /**
     * Obtener canales activos de un tenant
     */
    static async getActiveChannels(tenantId) {
        try {
            const [channels] = await db.query(
                `SELECT channel_type, config, webhook_url 
                 FROM channel_configs 
                 WHERE tenant_id = ? AND is_active = TRUE`,
                [tenantId]
            );

            return channels.map(ch => ({
                ...ch,
                config: typeof ch.config === 'string' ? JSON.parse(ch.config) : ch.config
            }));
        } catch (error) {
            console.error('Error obteniendo canales activos:', error);
            throw error;
        }
    }

    /**
     * Eliminar configuración de canal
     */
    static async deleteChannelConfig(tenantId, channelType) {
        try {
            await db.query(
                'DELETE FROM channel_configs WHERE tenant_id = ? AND channel_type = ?',
                [tenantId, channelType]
            );

            return {
                success: true,
                message: `Configuración de ${channelType} eliminada`
            };
        } catch (error) {
            console.error('Error eliminando config de canal:', error);
            throw error;
        }
    }
}

module.exports = ChannelConfigService;
