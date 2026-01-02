const axios = require('axios');
const Ticket = require('../../models/Ticket');
const Contact = require('../../models/Contact');
const Message = require('../../models/Message');
const ChannelConfig = require('../../models/ChannelConfig');

/**
 * Obtener configuración de Messenger
 * Prioridad: 1) Base de datos (panel), 2) Variables de entorno (.env)
 */
async function getMessengerConfig() {
    try {
        // Intentar obtener configuración activa desde la base de datos
        const dbConfig = await ChannelConfig.findActiveByType('messenger');

        if (dbConfig && dbConfig.config) {
            console.log('✅ Usando configuración de Messenger desde el panel de ZonoChat');
            return {
                pageAccessToken: dbConfig.config.page_access_token,
                verifyToken: dbConfig.config.verify_token,
                source: 'database',
                configId: dbConfig.id
            };
        }
    } catch (error) {
        console.warn('⚠️ No se pudo obtener configuración de Messenger desde BD:', error.message);
    }

    // Fallback a variables de entorno
    console.log('📋 Usando configuración de Messenger desde variables de entorno (.env)');
    return {
        pageAccessToken: process.env.MESSENGER_PAGE_ACCESS_TOKEN,
        verifyToken: process.env.MESSENGER_VERIFY_TOKEN,
        source: 'env'
    };
}

/**
 * Verificar webhook de Messenger
 */
exports.verify = async (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔍 Verificando webhook de Messenger...');

    const config = await getMessengerConfig();

    if (mode === 'subscribe' && token === config.verifyToken) {
        console.log(`✅ Webhook de Messenger verificado correctamente (config: ${config.source})`);
        res.status(200).send(challenge);
    } else {
        console.error('❌ Verificación fallida');
        res.sendStatus(403);
    }
};

/**
 * Recibir mensajes de Messenger
 */
exports.receiveMessage = async (req, res) => {
    try {
        const body = req.body;

        console.log('📥 Webhook de Messenger recibido:', JSON.stringify(body, null, 2));

        if (body.object !== 'page') {
            return res.sendStatus(404);
        }

        // Procesar cada entrada
        for (const entry of body.entry) {
            for (const event of entry.messaging) {
                if (event.message) {
                    await processIncomingMessage(event);
                } else if (event.delivery) {
                    await processDelivery(event.delivery);
                } else if (event.read) {
                    await processRead(event.read);
                } else if (event.messaging_typing) {
                    await processTyping(event);
                }
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error en webhook de Messenger:', error);
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

        // ⚠️ IMPORTANTE: Ignorar mensajes de eco (cuando nosotros enviamos)
        if (message.is_echo) {
            console.log('🔇 Mensaje de eco ignorado (enviado por nosotros):', messageId);
            return;
        }

        console.log('📨 Procesando mensaje de Messenger:', senderId);

        // Obtener el canal de Messenger de la base de datos
        const db = require('../../config/database');
        const [channels] = await db.query(
            "SELECT id, channel_id, is_active FROM channel_configs WHERE channel_type = 'messenger' AND is_active = true LIMIT 1"
        );

        if (channels.length === 0) {
            console.error('❌ No se encontró un canal de Messenger ACTIVO en la base de datos');
            console.log('💡 Tip: Verifica que tengas un canal de Messenger configurado y activo en el panel');
            return;
        }

        const channelId = channels[0].channel_id; // Usar channel_id para relaciones
        console.log('📡 Canal de Messenger encontrado y activo');
        console.log(`   - Config ID: ${channels[0].id}`);
        console.log(`   - Channel ID: ${channelId}`);



        // Obtener información del usuario
        const userInfo = await getUserInfo(senderId);
        const userName = `${userInfo.first_name} ${userInfo.last_name}`;
        const userAvatar = userInfo.profile_pic || null;

        // Obtener o crear contacto
        let contact = await Contact.findByExternalId(senderId, 'messenger');
        if (!contact) {
            contact = await Contact.create({
                external_id: senderId,
                name: userName,
                channel: 'messenger',
                channel_id: channelId,
                avatar: userAvatar
            });
            console.log('👤 Nuevo contacto creado:', contact.id);
        } else {
            // Actualizar avatar si cambió
            if (userAvatar && contact.avatar !== userAvatar) {
                await Contact.update(contact.id, {
                    avatar: userAvatar,
                    name: userName // También actualizar el nombre por si cambió
                });
                console.log('🖼️ Avatar del contacto actualizado');
            }
        }


        // Obtener o crear ticket
        let ticket = await Ticket.findActiveByContact(contact.id);
        if (!ticket) {
            ticket = await Ticket.create({
                contact_id: contact.id,
                channel: 'messenger',
                channel_id: channelId,
                status: 'open',
                priority: 'medium',
                subject: `Conversación de Messenger - ${contact.name}`
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
            messageType = attachment.type; // image, video, audio, file
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
            console.log('📡 Emitiendo mensaje por Socket.IO a sala:', `ticket:${ticket.id}`);
            console.log('📨 Datos del mensaje:', JSON.stringify(savedMessage, null, 2));
            io.to(`ticket:${ticket.id}`).emit('message:new', savedMessage);
            console.log('✅ Mensaje emitido correctamente');

            // Obtener ticket actualizado con unread_count
            const db = require('../../config/database');
            const [updatedTickets] = await db.query(
                'SELECT * FROM v_tickets_full WHERE id = ?',
                [ticket.id]
            );

            if (updatedTickets.length > 0) {
                // Emitir ticket actualizado para que se actualice el contador
                io.emit('ticket:updated', updatedTickets[0]);
                console.log('📊 Ticket actualizado emitido con unread_count:', updatedTickets[0].unread_count);
            }
        } else {
            console.error('❌ Socket.IO no está disponible');
        }


    } catch (error) {
        console.error('❌ Error procesando mensaje de Messenger:', error);
    }
}

/**
 * Procesar confirmación de entrega
 */
async function processDelivery(delivery) {
    try {
        console.log('📊 Mensaje entregado:', delivery.mids);

        if (!delivery.mids || delivery.mids.length === 0) {
            return;
        }

        // Actualizar todos los mensajes entregados
        for (const mid of delivery.mids) {
            // El mensaje ya tiene external_message_id cuando se envía
            // No necesitamos hacer nada adicional aquí
            // El doble check gris se mostrará automáticamente porque el mensaje tiene external_message_id
            console.log(`✅ Mensaje ${mid} marcado como entregado`);
        }
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

        const db = require('../../config/database');

        // Actualizar todos los mensajes hasta el watermark como leídos
        // El watermark es un timestamp, todos los mensajes antes de ese tiempo están leídos
        await db.query(
            `UPDATE messages 
             SET is_read = 1, read_at = NOW() 
             WHERE external_message_id IS NOT NULL 
             AND created_at <= FROM_UNIXTIME(?)
             AND sender_type = 'agent'`,
            [read.watermark / 1000] // Convertir de milisegundos a segundos
        );

        console.log(`✅ Mensajes marcados como leídos hasta watermark: ${read.watermark}`);

        // Emitir evento de Socket.IO para actualizar el frontend
        const io = global.io;
        if (io) {
            // Obtener los mensajes actualizados
            const [messages] = await db.query(
                `SELECT m.*, t.id as ticket_id
                 FROM messages m
                 JOIN tickets t ON m.ticket_id = t.id
                 WHERE m.external_message_id IS NOT NULL 
                 AND m.created_at <= FROM_UNIXTIME(?)
                 AND m.sender_type = 'agent'`,
                [read.watermark / 1000]
            );

            console.log(`📊 Mensajes afectados: ${messages.length}`);

            // Emitir actualización para cada ticket afectado
            const ticketIds = [...new Set(messages.map(m => m.ticket_id))];
            console.log(`🎫 Tickets afectados: ${ticketIds.join(', ')}`);

            for (const ticketId of ticketIds) {
                console.log(`📡 Emitiendo messages:read para ticket ${ticketId}`);
                // Emitir a la sala del ticket
                io.to(`ticket:${ticketId}`).emit('messages:read', {
                    ticketId,
                    watermark: read.watermark
                });
                // También emitir globalmente para asegurarnos
                io.emit('messages:read', {
                    ticketId,
                    watermark: read.watermark
                });
            }
        } else {
            console.error('❌ Socket.IO no está disponible');
        }
    } catch (error) {
        console.error('❌ Error procesando read:', error);
    }
}

/**
 * Procesar evento de typing (escribiendo)
 */
async function processTyping(event) {
    try {
        const senderId = event.sender.id;
        const typing = event.messaging_typing;

        console.log(`⌨️  Usuario ${senderId} está ${typing.action === 'typing_on' ? 'escribiendo' : 'dejó de escribir'}...`);

        // Buscar el ticket activo del contacto
        const db = require('../../config/database');
        const Contact = require('../../models/Contact');
        const Ticket = require('../../models/Ticket');

        const contact = await Contact.findByExternalId(senderId, 'messenger');
        if (!contact) {
            console.log('⚠️  Contacto no encontrado para typing event');
            return;
        }

        const ticket = await Ticket.findActiveByContact(contact.id);
        if (!ticket) {
            console.log('⚠️  Ticket no encontrado para typing event');
            return;
        }

        // Emitir evento de typing por WebSocket
        const io = global.io;
        if (io) {
            io.to(`ticket:${ticket.id}`).emit('contact:typing', {
                ticketId: ticket.id,
                contactId: contact.id,
                contactName: contact.name,
                isTyping: typing.action === 'typing_on'
            });
            console.log(`📡 Evento de typing emitido para ticket ${ticket.id}`);
        }
    } catch (error) {
        console.error('❌ Error procesando typing:', error);
    }
}

/**
 * Obtener información del usuario de Facebook
 */
async function getUserInfo(userId) {
    try {
        const config = await getMessengerConfig();
        const url = `https://graph.facebook.com/${userId}`;
        const response = await axios.get(url, {
            params: {
                fields: 'first_name,last_name,profile_pic',
                access_token: config.pageAccessToken
            }
        });
        return response.data;
    } catch (error) {
        console.error('❌ Error obteniendo info de usuario:', error.message);
        return { first_name: 'Usuario', last_name: 'Messenger' };
    }
}

/**
 * Enviar mensaje de Messenger
 */
exports.sendMessage = async (recipientId, message, imageUrl = null) => {
    try {
        const config = await getMessengerConfig();
        const url = 'https://graph.facebook.com/v18.0/me/messages';

        let messageData;

        if (imageUrl) {
            // Enviar imagen
            // Si la URL es relativa, convertirla a absoluta
            const fullImageUrl = imageUrl.startsWith('http')
                ? imageUrl
                : `${process.env.BACKEND_URL || 'http://localhost:3000'}${imageUrl}`;

            messageData = {
                recipient: { id: recipientId },
                message: {
                    attachment: {
                        type: 'image',
                        payload: {
                            url: fullImageUrl,
                            is_reusable: true
                        }
                    }
                }
            };
        } else {
            // Enviar texto
            messageData = {
                recipient: { id: recipientId },
                message: { text: message }
            };
        }

        const response = await axios.post(url, messageData, {
            params: {
                access_token: config.pageAccessToken
            }
        });

        console.log('✅ Mensaje de Messenger enviado:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error enviando mensaje de Messenger:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Enviar confirmación de lectura a Messenger
 */
exports.sendReadReceipt = async (senderId) => {
    try {
        const config = await getMessengerConfig();
        const url = 'https://graph.facebook.com/v18.0/me/messages';

        const response = await axios.post(url, {
            recipient: { id: senderId },
            sender_action: 'mark_seen'
        }, {
            params: {
                access_token: config.pageAccessToken
            }
        });

        console.log('✅ Confirmación de lectura enviada a Messenger');
        return response.data;
    } catch (error) {
        console.error('❌ Error enviando confirmación de lectura:', error.response?.data || error.message);
        throw error;
    }
};

// Alias para mantener compatibilidad
exports.webhook = exports.receiveMessage;
