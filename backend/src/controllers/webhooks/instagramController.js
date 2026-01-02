const axios = require('axios');
const Ticket = require('../../models/Ticket');
const Contact = require('../../models/Contact');
const Message = require('../../models/Message');

/**
 * Obtener configuración de Instagram desde channel_configs
 */
async function getInstagramConfig() {
    try {
        const db = require('../../config/database');
        const [configs] = await db.query(
            "SELECT id, config, channel_id FROM channel_configs WHERE channel_type = 'instagram' AND is_active = true LIMIT 1"
        );

        if (configs.length > 0) {
            const config = JSON.parse(configs[0].config);
            console.log('✅ Usando configuración de Instagram desde BD');
            return {
                accessToken: config.access_token,
                verifyToken: config.verify_token || process.env.INSTAGRAM_VERIFY_TOKEN,
                source: 'database',
                configId: configs[0].id,
                channelId: configs[0].channel_id
            };
        }
    } catch (error) {
        console.warn('⚠️  Error obteniendo config de Instagram desde BD:', error.message);
    }

    // Fallback a .env
    console.log('📋 Usando configuración de Instagram desde .env');
    return {
        accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
        verifyToken: process.env.INSTAGRAM_VERIFY_TOKEN,
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

    console.log('🔍 Verificando webhook de Instagram...');
    console.log('   Mode recibido:', mode);
    console.log('   Token recibido:', token);
    console.log('   Challenge:', challenge);

    // Si no hay parámetros, es una petición de health check de Meta
    if (!mode && !token && !challenge) {
        console.log('✅ Health check de Instagram - respondiendo 200 OK');
        return res.status(200).send('OK');
    }

    const config = await getInstagramConfig();
    console.log('   Token esperado:', config.verifyToken);
    console.log('   ¿Coinciden?:', token === config.verifyToken);

    if (mode === 'subscribe' && token === config.verifyToken) {
        console.log('✅ Webhook de Instagram verificado');
        res.status(200).send(challenge);
    } else {
        console.error('❌ Verificación de webhook fallida');
        console.error('   Razón: mode=' + mode + ', token match=' + (token === config.verifyToken));
        res.sendStatus(403);
    }
};

/**
 * Recibir webhooks de Instagram
 */
exports.webhook = async (req, res) => {
    try {
        const body = req.body;

        console.log('📨 Webhook de Instagram recibido');
        console.log('📦 Body completo:', JSON.stringify(body, null, 2));

        if (body.object !== 'instagram') {
            console.log('⚠️  Object no es instagram:', body.object);
            return res.sendStatus(404);
        }

        console.log('✅ Object es instagram, procesando entries...');

        // Procesar cada entrada
        for (const entry of body.entry) {
            console.log('📋 Procesando entry:', entry.id);

            // Instagram puede enviar eventos en dos formatos diferentes:
            // 1. entry.messaging (mensajes, delivery, read, typing)
            // 2. entry.changes (message_edit y otros eventos)

            if (entry.messaging) {
                // Formato estándar de mensajes
                for (const event of entry.messaging) {
                    console.log('📬 Procesando event:', JSON.stringify(event, null, 2));

                    if (event.message) {
                        console.log('💬 Es un mensaje, procesando...');
                        await processIncomingMessage(event);
                    } else if (event.delivery) {
                        console.log('📊 Es delivery');
                        await processDelivery(event.delivery);
                    } else if (event.read) {
                        console.log('👁️  Es read');
                        await processRead(event.read);
                    } else if (event.messaging_typing) {
                        console.log('⌨️  Es typing');
                        await processTyping(event);
                    } else if (event.message_edit) {
                        console.log('✏️  Mensaje editado - ignorando (no soportado aún)');
                    } else {
                        console.log('❓ Tipo de evento desconocido:', Object.keys(event));
                    }
                }
            } else if (entry.changes) {
                // Formato de cambios (ediciones, etc.)
                console.log('📝 Entry tiene changes en lugar de messaging');
                for (const change of entry.changes) {
                    console.log('🔄 Change field:', change.field);
                    if (change.field === 'message_edit') {
                        console.log('✏️  Mensaje editado - ignorando (no soportado aún)');
                    } else if (change.field === 'messages') {
                        console.log('💬 Es un mensaje en formato changes, procesando...');
                        // Convertir el formato de change.value al formato esperado por processIncomingMessage
                        const event = {
                            sender: change.value.sender,
                            recipient: change.value.recipient,
                            timestamp: change.value.timestamp,
                            message: change.value.message
                        };
                        console.log('📬 Event convertido:', JSON.stringify(event, null, 2));
                        await processIncomingMessage(event);
                    } else {
                        console.log('❓ Tipo de change desconocido:', change.field);
                    }
                }
            } else {
                console.log('⚠️  Entry no tiene ni messaging ni changes');
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error en webhook de Instagram:', error);
        res.sendStatus(500);
    }
};

/**
 * Procesar mensaje entrante
 */
async function processIncomingMessage(event) {
    try {
        const senderId = event.sender.id;
        const message = event.message;
        const messageId = message.mid;

        // Ignorar mensajes de eco
        if (message.is_echo) {
            console.log('🔇 Mensaje de eco ignorado (enviado por nosotros):', messageId);
            return;
        }

        console.log('📨 Procesando mensaje de Instagram:', senderId);

        const db = require('../../config/database');

        // Obtener canal activo
        const [channels] = await db.query(
            "SELECT id, channel_id, is_active FROM channel_configs WHERE channel_type = 'instagram' AND is_active = true LIMIT 1"
        );

        if (channels.length === 0) {
            console.log('⚠️  No hay canal de Instagram activo');
            return;
        }

        const channelId = channels[0].channel_id;
        console.log('📡 Canal de Instagram encontrado y activo');

        // Obtener información del usuario
        const userInfo = await getUserInfo(senderId);
        const userName = `${userInfo.name || 'Usuario Instagram'}`;
        const userAvatar = userInfo.profile_picture_url || null;

        // Obtener o crear contacto
        let contact = await Contact.findByExternalId(senderId, 'instagram');
        if (!contact) {
            contact = await Contact.create({
                external_id: senderId,
                name: userName,
                channel: 'instagram',
                channel_id: channelId,
                avatar: userAvatar
            });
            console.log('👤 Nuevo contacto creado:', contact.id);
        } else {
            // Actualizar avatar si cambió
            if (userAvatar && contact.avatar !== userAvatar) {
                await Contact.update(contact.id, {
                    avatar: userAvatar,
                    name: userName
                });
                console.log('🖼️  Avatar del contacto actualizado');
            }
        }

        // Obtener o crear ticket
        let ticket = await Ticket.findActiveByContact(contact.id);
        if (!ticket) {
            ticket = await Ticket.create({
                contact_id: contact.id,
                channel_id: channelId,
                subject: `Instagram - ${userName}`,
                status: 'open',
                external_id: senderId
            });
            console.log('🎫 Nuevo ticket creado:', ticket.id);

            const io = global.io;
            if (io) {
                io.emit('ticket:created', ticket);
            }
        }

        // Determinar tipo de mensaje
        let messageType = 'text';
        let messageContent = '';
        let mediaUrl = null;

        if (message.text) {
            messageType = 'text';
            messageContent = message.text;
        } else if (message.attachments) {
            const attachment = message.attachments[0];
            messageType = attachment.type;
            messageContent = attachment.type === 'image' ? 'Imagen' :
                attachment.type === 'video' ? 'Video' :
                    attachment.type === 'audio' ? 'Audio' : 'Archivo';
            mediaUrl = attachment.payload.url;
        }

        // Guardar mensaje
        const savedMessage = await Message.create({
            ticket_id: ticket.id,
            content: messageContent,
            sender_type: 'contact',
            message_type: messageType,
            media_url: mediaUrl,
            external_id: messageId
        });

        console.log('💾 Mensaje guardado:', savedMessage.id);

        // Emitir por WebSocket
        const io = global.io;
        if (io) {
            io.to(`ticket:${ticket.id}`).emit('message:new', savedMessage);

            // Obtener ticket actualizado con unread_count
            const [updatedTickets] = await db.query(
                'SELECT * FROM v_tickets_full WHERE id = ?',
                [ticket.id]
            );

            if (updatedTickets.length > 0) {
                io.emit('ticket:updated', updatedTickets[0]);
                console.log('📊 Ticket actualizado emitido con unread_count:', updatedTickets[0].unread_count);
            }
        }

    } catch (error) {
        console.error('❌ Error procesando mensaje de Instagram:', error);
    }
}

/**
 * Procesar confirmación de entrega
 */
async function processDelivery(delivery) {
    try {
        console.log('📊 Mensaje entregado:', delivery.mids);
    } catch (error) {
        console.error('❌ Error procesando delivery:', error);
    }
}

/**
 * Procesar confirmación de lectura
 */
async function processRead(read) {
    try {
        console.log('📊 Mensaje leído, watermark:', read.watermark);

        const io = global.io;
        if (io) {
            io.emit('messages:read', { watermark: read.watermark });
        }
    } catch (error) {
        console.error('❌ Error procesando read:', error);
    }
}

/**
 * Procesar evento de typing
 */
async function processTyping(event) {
    try {
        const senderId = event.sender.id;
        const typing = event.messaging_typing;

        console.log(`⌨️  Usuario ${senderId} está ${typing.action === 'typing_on' ? 'escribiendo' : 'dejó de escribir'}...`);

        const db = require('../../config/database');
        const Contact = require('../../models/Contact');
        const Ticket = require('../../models/Ticket');

        const contact = await Contact.findByExternalId(senderId, 'instagram');
        if (!contact) return;

        const ticket = await Ticket.findActiveByContact(contact.id);
        if (!ticket) return;

        const io = global.io;
        if (io) {
            io.to(`ticket:${ticket.id}`).emit('contact:typing', {
                ticketId: ticket.id,
                contactId: contact.id,
                contactName: contact.name,
                isTyping: typing.action === 'typing_on'
            });
        }
    } catch (error) {
        console.error('❌ Error procesando typing:', error);
    }
}

/**
 * Obtener información del usuario de Instagram
 */
async function getUserInfo(userId) {
    try {
        const config = await getInstagramConfig();
        const url = `https://graph.instagram.com/${userId}`;
        const response = await axios.get(url, {
            params: {
                fields: 'name,profile_picture_url',
                access_token: config.accessToken
            }
        });
        return response.data;
    } catch (error) {
        console.error('❌ Error obteniendo info de usuario:', error.message);
        return { name: 'Usuario Instagram' };
    }
}

/**
 * Enviar mensaje de Instagram
 */
exports.sendMessage = async (recipientId, message, imageUrl = null) => {
    try {
        const config = await getInstagramConfig();
        const url = 'https://graph.instagram.com/v18.0/me/messages';

        let messageData;

        if (imageUrl) {
            const fullImageUrl = imageUrl.startsWith('http')
                ? imageUrl
                : `${process.env.BACKEND_URL}${imageUrl}`;

            messageData = {
                recipient: { id: recipientId },
                message: {
                    attachment: {
                        type: 'image',
                        payload: { url: fullImageUrl }
                    }
                }
            };
        } else {
            messageData = {
                recipient: { id: recipientId },
                message: { text: message }
            };
        }

        const response = await axios.post(url, messageData, {
            params: { access_token: config.accessToken }
        });

        console.log('✅ Mensaje enviado a Instagram');
        return response.data;
    } catch (error) {
        console.error('❌ Error enviando mensaje a Instagram:', error.response?.data || error.message);
        throw error;
    }
};

module.exports = exports;
