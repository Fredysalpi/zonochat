const axios = require('axios');
const Ticket = require('../../models/Ticket');
const Contact = require('../../models/Contact');
const Message = require('../../models/Message');

/**
 * Obtener configuración de WhatsApp desde channel_configs
 */
async function getWhatsAppConfig() {
    try {
        const db = require('../../config/database');
        const [configs] = await db.query(
            "SELECT id, config, channel_id FROM channel_configs WHERE channel_type = 'whatsapp' AND is_active = true LIMIT 1"
        );

        if (configs.length > 0) {
            const config = JSON.parse(configs[0].config);
            console.log('✅ Usando configuración de WhatsApp desde BD');
            return {
                accessToken: config.access_token,
                phoneNumberId: config.phone_number_id,
                verifyToken: config.verify_token || process.env.WHATSAPP_VERIFY_TOKEN,
                source: 'database',
                configId: configs[0].id,
                channelId: configs[0].channel_id
            };
        }
    } catch (error) {
        console.warn('⚠️  Error obteniendo config de WhatsApp desde BD:', error.message);
    }

    // Fallback a .env
    console.log('📋 Usando configuración de WhatsApp desde .env');
    return {
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
        source: 'env'
    };
}

/**
 * Verificar webhook
 */
exports.verify = async (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔍 Verificando webhook de WhatsApp...');

    const config = await getWhatsAppConfig();

    if (mode === 'subscribe' && token === config.verifyToken) {
        console.log('✅ Webhook de WhatsApp verificado');
        res.status(200).send(challenge);
    } else {
        console.error('❌ Verificación de webhook fallida');
        res.sendStatus(403);
    }
};

/**
 * Recibir webhooks de WhatsApp
 */
exports.webhook = async (req, res) => {
    try {
        const body = req.body;

        if (body.object !== 'whatsapp_business_account') {
            return res.sendStatus(404);
        }

        console.log('📨 Webhook de WhatsApp recibido');

        // Procesar cada entrada
        for (const entry of body.entry) {
            for (const change of entry.changes) {
                if (change.field === 'messages') {
                    const value = change.value;

                    if (value.messages) {
                        for (const message of value.messages) {
                            await processIncomingMessage(message, value);
                        }
                    }

                    if (value.statuses) {
                        for (const status of value.statuses) {
                            await processStatus(status);
                        }
                    }
                }
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error en webhook de WhatsApp:', error);
        res.sendStatus(500);
    }
};

/**
 * Procesar mensaje entrante
 */
async function processIncomingMessage(message, value) {
    try {
        const senderId = message.from;
        const messageId = message.id;
        const messageType = message.type;

        console.log('📨 Procesando mensaje de WhatsApp:', senderId);

        const db = require('../../config/database');

        // Obtener canal activo
        const [channels] = await db.query(
            "SELECT id, channel_id, is_active FROM channel_configs WHERE channel_type = 'whatsapp' AND is_active = true LIMIT 1"
        );

        if (channels.length === 0) {
            console.log('⚠️  No hay canal de WhatsApp activo');
            return;
        }

        const channelId = channels[0].channel_id;
        console.log('📡 Canal de WhatsApp encontrado y activo');

        // Obtener información del contacto desde el webhook
        const contactInfo = value.contacts?.[0] || {};
        const userName = contactInfo.profile?.name || senderId;

        // WhatsApp no proporciona avatar en el webhook, pero podemos usar la API
        let userAvatar = null;
        try {
            const avatarInfo = await getUserAvatar(senderId);
            userAvatar = avatarInfo?.url || null;
        } catch (error) {
            console.log('⚠️  No se pudo obtener avatar de WhatsApp');
        }

        // Obtener o crear contacto
        let contact = await Contact.findByExternalId(senderId, 'whatsapp');
        if (!contact) {
            contact = await Contact.create({
                external_id: senderId,
                name: userName,
                phone: senderId,
                channel: 'whatsapp',
                channel_id: channelId,
                avatar: userAvatar
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
                subject: `WhatsApp - ${userName}`,
                status: 'open',
                external_id: senderId
            });
            console.log('🎫 Nuevo ticket creado:', ticket.id);

            const io = global.io;
            if (io) {
                io.emit('ticket:created', ticket);
            }
        }

        // Procesar contenido del mensaje según el tipo
        let messageContent = '';
        let mediaUrl = null;
        let finalMessageType = 'text';

        switch (messageType) {
            case 'text':
                messageContent = message.text.body;
                finalMessageType = 'text';
                break;
            case 'image':
                messageContent = 'Imagen';
                mediaUrl = await downloadWhatsAppMedia(message.image.id);
                finalMessageType = 'image';
                break;
            case 'video':
                messageContent = 'Video';
                mediaUrl = await downloadWhatsAppMedia(message.video.id);
                finalMessageType = 'video';
                break;
            case 'audio':
                messageContent = 'Audio';
                mediaUrl = await downloadWhatsAppMedia(message.audio.id);
                finalMessageType = 'audio';
                break;
            case 'document':
                messageContent = message.document.filename || 'Documento';
                mediaUrl = await downloadWhatsAppMedia(message.document.id);
                finalMessageType = 'file';
                break;
            case 'location':
                messageContent = `Ubicación: ${message.location.latitude}, ${message.location.longitude}`;
                finalMessageType = 'text';
                break;
            default:
                messageContent = `Mensaje de tipo: ${messageType}`;
                finalMessageType = 'text';
        }

        // Guardar mensaje
        const savedMessage = await Message.create({
            ticket_id: ticket.id,
            content: messageContent,
            sender_type: 'contact',
            message_type: finalMessageType,
            media_url: mediaUrl,
            external_id: messageId
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
        console.error('❌ Error procesando mensaje de WhatsApp:', error);
    }
}

/**
 * Procesar estado del mensaje
 */
async function processStatus(status) {
    try {
        console.log('📊 Estado del mensaje:', status.status);
        // Aquí puedes actualizar el estado del mensaje en la BD
    } catch (error) {
        console.error('❌ Error procesando status:', error);
    }
}

/**
 * Obtener avatar del usuario de WhatsApp
 */
async function getUserAvatar(phoneNumber) {
    try {
        const config = await getWhatsAppConfig();
        const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/contacts`;

        const response = await axios.get(url, {
            params: {
                blocking: 'wait',
                contacts: JSON.stringify([phoneNumber]),
                access_token: config.accessToken
            }
        });

        return response.data.contacts?.[0]?.profile_picture || null;
    } catch (error) {
        console.error('❌ Error obteniendo avatar:', error.message);
        return null;
    }
}

/**
 * Descargar media de WhatsApp
 */
async function downloadWhatsAppMedia(mediaId) {
    try {
        const config = await getWhatsAppConfig();

        // Obtener URL del media
        const mediaUrl = `https://graph.facebook.com/v18.0/${mediaId}`;
        const response = await axios.get(mediaUrl, {
            params: { access_token: config.accessToken }
        });

        return response.data.url;
    } catch (error) {
        console.error('❌ Error descargando media:', error.message);
        return null;
    }
}

/**
 * Enviar mensaje de WhatsApp
 */
exports.sendMessage = async (recipientId, message, imageUrl = null) => {
    try {
        const config = await getWhatsAppConfig();
        const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`;

        let messageData;

        if (imageUrl) {
            const fullImageUrl = imageUrl.startsWith('http')
                ? imageUrl
                : `${process.env.BACKEND_URL}${imageUrl}`;

            messageData = {
                messaging_product: 'whatsapp',
                to: recipientId,
                type: 'image',
                image: {
                    link: fullImageUrl
                }
            };
        } else {
            messageData = {
                messaging_product: 'whatsapp',
                to: recipientId,
                type: 'text',
                text: {
                    body: message
                }
            };
        }

        const response = await axios.post(url, messageData, {
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Mensaje enviado a WhatsApp');
        return response.data;
    } catch (error) {
        console.error('❌ Error enviando mensaje a WhatsApp:', error.response?.data || error.message);
        throw error;
    }
};

module.exports = exports;
