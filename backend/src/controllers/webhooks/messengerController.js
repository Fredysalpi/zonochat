const axios = require('axios');
const Ticket = require('../../models/Ticket');
const Contact = require('../../models/Contact');
const Message = require('../../models/Message');
// const ChannelConfig = require('../../models/ChannelConfig'); // Temporalmente deshabilitado

/**
 * Obtener configuración de Messenger (solo .env por ahora)
 */
async function getMessengerConfig() {
    // Usar solo variables de entorno por ahora
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

        console.log('📨 Procesando mensaje de Messenger:', senderId);

        // Obtener información del usuario
        const userInfo = await getUserInfo(senderId);
        const userName = `${userInfo.first_name} ${userInfo.last_name}`;

        // Obtener o crear contacto
        let contact = await Contact.findByExternalId(senderId, 'messenger');
        if (!contact) {
            contact = await Contact.create({
                external_id: senderId,
                name: userName,
                channel: 'messenger'
            });
            console.log('👤 Nuevo contacto creado:', contact.id);
        }

        // Obtener o crear ticket
        let ticket = await Ticket.findActiveByContact(contact.id);
        if (!ticket) {
            ticket = await Ticket.create({
                contact_id: contact.id,
                channel: 'messenger',
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
            io.to(`ticket:${ticket.id}`).emit('message:new', savedMessage);
        }

    } catch (error) {
        console.error('❌ Error procesando mensaje de Messenger:', error);
    }
}

/**
 * Procesar confirmación de entrega
 */
async function processDelivery(delivery) {
    console.log('📊 Mensaje entregado:', delivery.mids);
}

/**
 * Procesar confirmación de lectura
 */
async function processRead(read) {
    console.log('📊 Mensaje leído:', read.watermark);
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
exports.sendMessage = async (recipientId, message) => {
    try {
        const config = await getMessengerConfig();
        const url = 'https://graph.facebook.com/v18.0/me/messages';

        const data = {
            recipient: { id: recipientId },
            message: { text: message }
        };

        const response = await axios.post(url, data, {
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
