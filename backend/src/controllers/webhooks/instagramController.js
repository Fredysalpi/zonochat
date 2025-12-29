const axios = require('axios');
const Ticket = require('../../models/Ticket');
const Contact = require('../../models/Contact');
const Message = require('../../models/Message');

/**
 * Verificar webhook de Instagram
 */
exports.verify = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔍 Verificando webhook de Instagram...');

    if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
        console.log('✅ Webhook de Instagram verificado correctamente');
        res.status(200).send(challenge);
    } else {
        console.error('❌ Verificación fallida');
        res.sendStatus(403);
    }
};

/**
 * Recibir mensajes de Instagram
 */
exports.receiveMessage = async (req, res) => {
    try {
        const body = req.body;

        console.log('📥 Webhook de Instagram recibido:', JSON.stringify(body, null, 2));

        if (body.object !== 'instagram') {
            return res.sendStatus(404);
        }

        // Procesar cada entrada
        for (const entry of body.entry) {
            for (const change of entry.changes) {
                if (change.field === 'messages') {
                    const value = change.value;

                    if (value.messages) {
                        for (const message of value.messages) {
                            await processIncomingMessage(message);
                        }
                    }
                }
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
async function processIncomingMessage(message) {
    try {
        const senderId = message.from.id;
        const messageId = message.id;
        const username = message.from.username;

        console.log('📨 Procesando mensaje de Instagram:', senderId);

        // Obtener o crear contacto
        let contact = await Contact.findByExternalId(senderId, 'instagram');
        if (!contact) {
            contact = await Contact.create({
                external_id: senderId,
                name: username || `Usuario Instagram ${senderId}`,
                channel: 'instagram'
            });
            console.log('👤 Nuevo contacto creado:', contact.id);
        }

        // Obtener o crear ticket
        let ticket = await Ticket.findActiveByContact(contact.id);
        if (!ticket) {
            ticket = await Ticket.create({
                contact_id: contact.id,
                channel: 'instagram',
                status: 'open',
                priority: 'medium',
                subject: `Conversación de Instagram - ${contact.name}`
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
        }

    } catch (error) {
        console.error('❌ Error procesando mensaje de Instagram:', error);
    }
}

/**
 * Enviar mensaje de Instagram
 */
exports.sendMessage = async (recipientId, message) => {
    try {
        const url = 'https://graph.facebook.com/v18.0/me/messages';

        const data = {
            recipient: { id: recipientId },
            message: { text: message }
        };

        const response = await axios.post(url, data, {
            params: {
                access_token: process.env.INSTAGRAM_ACCESS_TOKEN
            }
        });

        console.log('✅ Mensaje de Instagram enviado:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error enviando mensaje de Instagram:', error.response?.data || error.message);
        throw error;
    }
};
