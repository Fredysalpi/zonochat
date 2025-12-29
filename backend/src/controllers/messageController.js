const db = require('../config/database');

exports.getMessagesByTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const [messages] = await db.query(
            `SELECT m.*, CONCAT(u.first_name, ' ', u.last_name) AS sender_name, u.avatar AS sender_avatar
             FROM messages m LEFT JOIN users u ON m.sender_id = u.id
             WHERE m.ticket_id = ? ORDER BY m.created_at ASC`,
            [ticketId]
        );
        res.json({ success: true, messages });
    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        res.status(500).json({ error: 'Error al obtener mensajes' });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        console.log('📨 Recibiendo mensaje...');
        console.log('Body:', req.body);
        console.log('File:', req.file);

        const ticketId = req.params.ticketId || req.body.ticket_id;
        const { content, sender_type } = req.body;
        const userId = req.user.id;

        if (!ticketId) return res.status(400).json({ error: 'ticket_id es requerido' });
        if (!content && !req.file) return res.status(400).json({ error: 'content o archivo es requerido' });

        let messageType = 'text';
        let mediaUrl = null;
        let mediaMimeType = null;

        // Si hay archivo adjunto
        if (req.file) {
            messageType = 'image';
            mediaUrl = `/uploads/attachments/${req.file.filename}`;
            mediaMimeType = req.file.mimetype;
            console.log('✅ Archivo guardado:', {
                filename: req.file.filename,
                path: req.file.path,
                mediaUrl: mediaUrl
            });
        }

        const [result] = await db.query(
            'INSERT INTO messages (ticket_id, sender_type, sender_id, content, message_type, media_url, media_mime_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [ticketId, sender_type || 'agent', userId, content || 'Imagen', messageType, mediaUrl, mediaMimeType]
        );

        const [messageRows] = await db.query(
            `SELECT m.*, CONCAT(u.first_name, ' ', u.last_name) AS sender_name, u.avatar AS sender_avatar
             FROM messages m LEFT JOIN users u ON m.sender_id = u.id WHERE m.id = ?`,
            [result.insertId]
        );

        console.log('📤 Mensaje guardado:', messageRows[0]);

        await db.query('UPDATE tickets SET updated_at = NOW() WHERE id = ?', [ticketId]);

        const io = req.app.get('io');
        io.to(`ticket:${ticketId}`).emit('message:new', messageRows[0]);

        res.status(201).json({ message: 'Mensaje enviado exitosamente', data: messageRows[0] });
    } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
        res.status(500).json({ error: 'Error al enviar mensaje' });
    }
};

exports.sendFileMessage = async (req, res) => {
    try {
        const { ticket_id } = req.body;
        const userId = req.user.id;
        if (!ticket_id) return res.status(400).json({ error: 'ticket_id es requerido' });
        if (!req.file) return res.status(400).json({ error: 'No se ha subido ningún archivo' });
        let messageType = 'document';
        if (req.file.mimetype.startsWith('image/')) messageType = 'image';
        else if (req.file.mimetype === 'application/pdf') messageType = 'document';
        else if (req.file.mimetype.includes('video')) messageType = 'video';
        else if (req.file.mimetype.includes('audio')) messageType = 'audio';
        const fileUrl = `/uploads/messages/${req.file.filename}`;
        const [result] = await db.query(
            'INSERT INTO messages (ticket_id, sender_type, sender_id, content, message_type, media_url, media_mime_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [ticket_id, 'agent', userId, req.file.originalname, messageType, fileUrl, req.file.mimetype]
        );
        const [messageRows] = await db.query('SELECT * FROM messages WHERE id = ?', [result.insertId]);
        await db.query('UPDATE tickets SET updated_at = NOW(), last_message_at = NOW() WHERE id = ?', [ticket_id]);
        const io = req.app.get('io');
        io.to(`ticket:${ticket_id}`).emit('message:new', messageRows[0]);
        res.status(201).json({ message: 'Archivo enviado exitosamente', data: messageRows[0] });
    } catch (error) {
        console.error('Error al enviar archivo:', error);
        res.status(500).json({ error: 'Error al enviar archivo' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await db.query('UPDATE messages SET is_read = TRUE WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Mensaje marcado como leído' });
    } catch (error) {
        console.error('Error al marcar mensaje:', error);
        res.status(500).json({ error: 'Error al marcar mensaje como leído' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await db.query('UPDATE messages SET is_read = TRUE WHERE ticket_id = ? AND is_read = FALSE', [req.params.ticketId]);
        res.json({ success: true, message: 'Todos los mensajes marcados como leídos' });
    } catch (error) {
        console.error('Error al marcar mensajes:', error);
        res.status(500).json({ error: 'Error al marcar mensajes como leídos' });
    }
};

exports.receiveWebhook = async (req, res) => {
    try {
        const { from, message, channel_id } = req.body;
        let [contacts] = await db.query('SELECT * FROM contacts WHERE phone = ?', [from]);
        let contact;
        if (contacts.length === 0) {
            const [result] = await db.query('INSERT INTO contacts (phone, name) VALUES (?, ?)', [from, from]);
            [contacts] = await db.query('SELECT * FROM contacts WHERE id = ?', [result.insertId]);
        }
        contact = contacts[0];
        let [tickets] = await db.query(
            'SELECT * FROM tickets WHERE contact_id = ? AND status IN (?, ?) ORDER BY created_at DESC LIMIT 1',
            [contact.id, 'open', 'pending']
        );
        let ticket;
        if (tickets.length === 0) {
            const [result] = await db.query(
                'INSERT INTO tickets (contact_id, channel_id, status, subject) VALUES (?, ?, ?, ?)',
                [contact.id, channel_id, 'open', 'Nuevo mensaje']
            );
            [tickets] = await db.query('SELECT * FROM tickets WHERE id = ?', [result.insertId]);
        }
        ticket = tickets[0];
        const [messageResult] = await db.query(
            'INSERT INTO messages (ticket_id, sender_type, content) VALUES (?, ?, ?)',
            [ticket.id, 'contact', message]
        );
        const [messageRows] = await db.query('SELECT * FROM messages WHERE id = ?', [messageResult.insertId]);
        const io = req.app.get('io');
        io.to(`ticket:${ticket.id}`).emit('message:new', messageRows[0]);
        io.emit('ticket:updated', { id: ticket.id });
        res.json({ success: true, message: 'Mensaje recibido', ticketId: ticket.id });
    } catch (error) {
        console.error('Error en webhook:', error);
        res.status(500).json({ error: 'Error al procesar webhook' });
    }
};

module.exports = exports;
