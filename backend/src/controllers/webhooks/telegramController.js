const axios = require('axios');
const Ticket = require('../../models/Ticket');
const Contact = require('../../models/Contact');
const Message = require('../../models/Message');

/**
 * Obtener configuración de Telegram desde channel_configs
 */
async function getTelegramConfig() {
    try {
        const db = require('../../config/database');
        const [configs] = await db.query(
            "SELECT id, config, channel_id FROM channel_configs WHERE channel_type = 'telegram' AND is_active = true LIMIT 1"
        );

        if (configs.length > 0) {
            const config = JSON.parse(configs[0].config);
            console.log('✅ Usando configuración de Telegram desde BD');
            return {
                botToken: config.bot_token,
                source: 'database',
                configId: configs[0].id,
                channelId: configs[0].channel_id
            };
        }
    } catch (error) {
        console.warn('⚠️  Error obteniendo config de Telegram desde BD:', error.message);
    }

    // Fallback a .env
    console.log('📋 Usando configuración de Telegram desde .env');
    return {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        source: 'env'
    };
}

/**
 * Configurar webhook de Telegram
 */
exports.setWebhook = async (req, res) => {
    try {
        const config = await getTelegramConfig();
        const webhookUrl = `${process.env.BACKEND_URL}/api/webhooks/telegram`;

        const url = `https://api.telegram.org/bot${config.botToken}/setWebhook`;
        const response = await axios.post(url, {
            url: webhookUrl,
            allowed_updates: ['message', 'edited_message', 'callback_query']
        });

        console.log('✅ Webhook de Telegram configurado:', webhookUrl);
        res.json({
            success: true,
            message: 'Webhook configurado correctamente',
            data: response.data
        });
    } catch (error) {
        console.error('❌ Error configurando webhook de Telegram:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Recibir webhooks de Telegram
 */
exports.webhook = async (req, res) => {
    try {
        const update = req.body;

        console.log('📨 Webhook de Telegram recibido');

        if (update.message) {
            await processIncomingMessage(update.message);
        } else if (update.edited_message) {
            await processEditedMessage(update.edited_message);
        } else if (update.callback_query) {
            await processCallbackQuery(update.callback_query);
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error en webhook de Telegram:', error);
        res.sendStatus(500);
    }
};

/**
 * Procesar mensaje entrante
 */
async function processIncomingMessage(message) {
    try {
        const senderId = message.from.id.toString();
        const chatId = message.chat.id.toString();
        const messageId = message.message_id;

        console.log('📨 Procesando mensaje de Telegram:', senderId);

        const db = require('../../config/database');

        // Obtener canal activo
        const [channels] = await db.query(
            "SELECT id, channel_id, is_active FROM channel_configs WHERE channel_type = 'telegram' AND is_active = true LIMIT 1"
        );

        if (channels.length === 0) {
            console.log('⚠️  No hay canal de Telegram activo');
            return;
        }

        const channelId = channels[0].channel_id;
        console.log('📡 Canal de Telegram encontrado y activo');

        // Obtener información del usuario
        const userName = message.from.first_name + (message.from.last_name ? ` ${message.from.last_name}` : '');
        const username = message.from.username || null;

        // Obtener avatar del usuario
        let userAvatar = null;
        try {
            const avatarInfo = await getUserAvatar(senderId);
            userAvatar = avatarInfo || null;
        } catch (error) {
            console.log('⚠️  No se pudo obtener avatar de Telegram');
        }

        // Obtener o crear contacto
        let contact = await Contact.findByExternalId(senderId, 'telegram');
        if (!contact) {
            contact = await Contact.create({
                external_id: senderId,
                name: userName,
                channel: 'telegram',
                channel_id: channelId,
                avatar: userAvatar,
                metadata: JSON.stringify({ username, chat_id: chatId })
            });
            console.log('👤 Nuevo contacto creado:', contact.id);
        } else {
            // Actualizar avatar y nombre si cambió
            if ((userAvatar && contact.avatar !== userAvatar) || contact.name !== userName) {
                await Contact.update(contact.id, {
                    avatar: userAvatar,
                    name: userName
                });
                console.log('🖼️  Contacto actualizado');
            }
        }

        // Obtener o crear ticket
        let ticket = await Ticket.findActiveByContact(contact.id);
        if (!ticket) {
            ticket = await Ticket.create({
                contact_id: contact.id,
                channel_id: channelId,
                subject: `Telegram - ${userName}`,
                status: 'open',
                external_id: chatId
            });
            console.log('🎫 Nuevo ticket creado:', ticket.id);

            const io = global.io;
            if (io) {
                io.emit('ticket:created', ticket);
            }
        }

        // Procesar contenido del mensaje
        let messageContent = '';
        let mediaUrl = null;
        let messageType = 'text';

        if (message.text) {
            messageContent = message.text;
            messageType = 'text';
        } else if (message.photo) {
            messageContent = 'Imagen';
            const photo = message.photo[message.photo.length - 1]; // Obtener la foto de mayor calidad
            mediaUrl = await downloadTelegramFile(photo.file_id);
            messageType = 'image';
        } else if (message.video) {
            messageContent = 'Video';
            mediaUrl = await downloadTelegramFile(message.video.file_id);
            messageType = 'video';
        } else if (message.voice) {
            messageContent = 'Nota de voz';
            mediaUrl = await downloadTelegramFile(message.voice.file_id);
            messageType = 'audio';
        } else if (message.audio) {
            messageContent = 'Audio';
            mediaUrl = await downloadTelegramFile(message.audio.file_id);
            messageType = 'audio';
        } else if (message.document) {
            messageContent = message.document.file_name || 'Documento';
            mediaUrl = await downloadTelegramFile(message.document.file_id);
            messageType = 'file';
        } else if (message.sticker) {
            messageContent = 'Sticker';
            messageType = 'text';
        } else if (message.location) {
            messageContent = `Ubicación: ${message.location.latitude}, ${message.location.longitude}`;
            messageType = 'text';
        }

        // Guardar mensaje
        const savedMessage = await Message.create({
            ticket_id: ticket.id,
            content: messageContent,
            sender_type: 'contact',
            message_type: messageType,
            media_url: mediaUrl,
            external_id: messageId.toString()
        });

        console.log('💾 Mensaje guardado:', savedMessage.id);

        // Emitir por WebSocket
        const io = global.io;
        if (io) {
            io.to(`ticket:${ticket.id}`).emit('message:new', savedMessage);

            // Obtener ticket actualizado
            const [updatedTickets] = await db.query(
                'SELECT * FROM v_tickets_full WHERE id = ?',
                [ticket.id]
            );

            if (updatedTickets.length > 0) {
                io.emit('ticket:updated', updatedTickets[0]);
                console.log('📊 Ticket actualizado emitido');
            }
        }

    } catch (error) {
        console.error('❌ Error procesando mensaje de Telegram:', error);
    }
}

/**
 * Procesar mensaje editado
 */
async function processEditedMessage(message) {
    try {
        console.log('✏️  Mensaje editado recibido');
        // Aquí puedes implementar lógica para actualizar mensajes editados
    } catch (error) {
        console.error('❌ Error procesando mensaje editado:', error);
    }
}

/**
 * Procesar callback query (botones inline)
 */
async function processCallbackQuery(query) {
    try {
        console.log('🔘 Callback query recibido:', query.data);
        // Aquí puedes implementar lógica para manejar botones inline
    } catch (error) {
        console.error('❌ Error procesando callback query:', error);
    }
}

/**
 * Obtener avatar del usuario de Telegram
 */
async function getUserAvatar(userId) {
    try {
        const config = await getTelegramConfig();
        const url = `https://api.telegram.org/bot${config.botToken}/getUserProfilePhotos`;

        const response = await axios.get(url, {
            params: {
                user_id: userId,
                limit: 1
            }
        });

        if (response.data.result.total_count > 0) {
            const photo = response.data.result.photos[0][0];
            const fileUrl = await downloadTelegramFile(photo.file_id);
            return fileUrl;
        }

        return null;
    } catch (error) {
        console.error('❌ Error obteniendo avatar:', error.message);
        return null;
    }
}

/**
 * Descargar archivo de Telegram
 */
async function downloadTelegramFile(fileId) {
    try {
        const config = await getTelegramConfig();

        // Obtener información del archivo
        const fileUrl = `https://api.telegram.org/bot${config.botToken}/getFile`;
        const response = await axios.get(fileUrl, {
            params: { file_id: fileId }
        });

        const filePath = response.data.result.file_path;
        const downloadUrl = `https://api.telegram.org/file/bot${config.botToken}/${filePath}`;

        return downloadUrl;
    } catch (error) {
        console.error('❌ Error descargando archivo:', error.message);
        return null;
    }
}

/**
 * Enviar mensaje de Telegram
 */
exports.sendMessage = async (chatId, message, imageUrl = null) => {
    try {
        const config = await getTelegramConfig();
        let url;
        let data;

        if (imageUrl) {
            const fullImageUrl = imageUrl.startsWith('http')
                ? imageUrl
                : `${process.env.BACKEND_URL}${imageUrl}`;

            url = `https://api.telegram.org/bot${config.botToken}/sendPhoto`;
            data = {
                chat_id: chatId,
                photo: fullImageUrl,
                caption: message || ''
            };
        } else {
            url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
            data = {
                chat_id: chatId,
                text: message
            };
        }

        const response = await axios.post(url, data);

        console.log('✅ Mensaje enviado a Telegram');
        return response.data;
    } catch (error) {
        console.error('❌ Error enviando mensaje a Telegram:', error.response?.data || error.message);
        throw error;
    }
};

module.exports = exports;
