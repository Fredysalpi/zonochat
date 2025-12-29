const axios = require('axios');
const Ticket = require('../../models/Ticket');
const Contact = require('../../models/Contact');
const Message = require('../../models/Message');

/**
 * Verificar webhook de WhatsApp
 */
exports.verify = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔍 Verificando webhook de WhatsApp...');
    console.log('Mode:', mode);
    console.log('Token recibido:', token);

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('✅ Webhook de WhatsApp verificado correctamente');
        res.status(200).send(challenge);
    } else {
        console.error('❌ Verificación fallida');
        res.sendStatus(403);
    }
};

/**
 * Recibir mensajes de WhatsApp
 */
exports.receiveMessage = async (req, res) => {
    try {
        const body = req.body;

        console.log('📥 Webhook de WhatsApp recibido:', JSON.stringify(body, null, 2));

        // Verificar que es de WhatsApp Business
        if (body.object !== 'whatsapp_business_account') {
            return res.sendStatus(404);
        }

        // Procesar cada entrada
        for (const entry of body.entry) {
            for (const change of entry.changes) {
                if (change.field === 'messages') {
                    const value = change.value;

                    // Procesar mensajes
                    if (value.messages) {
                        for (const message of value.messages) {
                            await processIncomingMessage(message, value.metadata);
                        }
                    }

                    // Procesar estados de mensajes (entregado, leído, etc.)
                    if (value.statuses) {
                        for (const status of value.statuses) {
                            await processMessageStatus(status);
                        }
                    }
                }
            }
        }

        // Responder rápidamente a WhatsApp
        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error en webhook de WhatsApp:', error);
        res.sendStatus(500);
    }
};

/**
 * Procesar mensaje entrante
 */
async function processIncomingMessage(message, metadata) {
    try {
        const from = message.from; // Número del usuario
        const messageId = message.id;
        const timestamp = message.timestamp;

        console.log('📨 Procesando mensaje de:', from);

        // Obtener o crear contacto
        let contact = await Contact.findByPhone(from);
        if (!contact) {
            // Crear nuevo contacto
            contact = await Contact.create({
                phone: from,
                name: from, // Se actualizará con el nombre real si está disponible
                channel: 'whatsapp'
            });
            console.log('👤 Nuevo contacto creado:', contact.id);
        }

        // Obtener o crear ticket
        let ticket = await Ticket.findActiveByContact(contact.id);
        if (!ticket) {
            // Crear nuevo ticket
            ticket = await Ticket.create({
                contact_id: contact.id,
                channel: 'whatsapp',
                status: 'open',
                priority: 'medium',
                subject: `Conversación de WhatsApp - ${contact.name}`
            });
            console.log('🎫 Nuevo ticket creado:', ticket.id);

            // Emitir evento de nuevo ticket
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
            messageContent = message.text.body;
        } else if (message.image) {
            messageType = 'image';
            messageContent = message.image.caption || 'Imagen';
            mediaUrl = await downloadWhatsAppMedia(message.image.id);
        } else if (message.video) {
            messageType = 'video';
            messageContent = message.video.caption || 'Video';
            mediaUrl = await downloadWhatsAppMedia(message.video.id);
        } else if (message.audio) {
            messageType = 'audio';
            messageContent = 'Audio';
            mediaUrl = await downloadWhatsAppMedia(message.audio.id);
        } else if (message.document) {
            messageType = 'document';
            messageContent = message.document.filename || 'Documento';
            mediaUrl = await downloadWhatsAppMedia(message.document.id);
        }

        // Guardar mensaje en base de datos
        const savedMessage = await Message.create({
            ticket_id: ticket.id,
            content: messageContent,
            sender_type: 'contact',
            message_type: messageType,
            media_url: mediaUrl,
            external_id: messageId
        });

        console.log('💾 Mensaje guardado:', savedMessage.id);

        // Emitir mensaje por WebSocket
        const io = global.io;
        if (io) {
            io.to(`ticket:${ticket.id}`).emit('message:new', savedMessage);
        }

        // Marcar mensaje como leído en WhatsApp
        await markAsRead(messageId);

    } catch (error) {
        console.error('❌ Error procesando mensaje:', error);
    }
}

/**
 * Procesar estado de mensaje (entregado, leído, etc.)
 */
async function processMessageStatus(status) {
    try {
        const messageId = status.id;
        const statusType = status.status; // sent, delivered, read, failed

        console.log(`📊 Estado de mensaje ${messageId}: ${statusType}`);

        // Actualizar estado en base de datos
        if (statusType === 'read') {
            await Message.updateByExternalId(messageId, { is_read: true });
        }
    } catch (error) {
        console.error('❌ Error procesando estado:', error);
    }
}

/**
 * Enviar mensaje de WhatsApp
 */
exports.sendMessage = async (to, message, type = 'text') => {
    try {
        const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

        let data = {
            messaging_product: 'whatsapp',
            to: to,
            type: type
        };

        if (type === 'text') {
            data.text = { body: message };
        }

        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Mensaje de WhatsApp enviado:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error enviando mensaje de WhatsApp:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Marcar mensaje como leído
 */
async function markAsRead(messageId) {
    try {
        const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

        await axios.post(url, {
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('❌ Error marcando como leído:', error.message);
    }
}

/**
 * Descargar media de WhatsApp
 */
async function downloadWhatsAppMedia(mediaId) {
    try {
        // Obtener URL del media
        const mediaUrl = `https://graph.facebook.com/v18.0/${mediaId}`;
        const response = await axios.get(mediaUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
            }
        });

        const downloadUrl = response.data.url;

        // Descargar el archivo
        // TODO: Implementar descarga y almacenamiento local
        // Por ahora, retornar la URL temporal
        return downloadUrl;
    } catch (error) {
        console.error('❌ Error descargando media:', error.message);
        return null;
    }
}
