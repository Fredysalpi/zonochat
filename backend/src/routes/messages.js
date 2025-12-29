const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * POST /api/messages/webhook
 * Recibir mensajes de webhooks (sin autenticación)
 */
router.post('/webhook', messageController.receiveWebhook);

// Aplicar autenticación a las rutas siguientes
router.use(authenticateToken);

/**
 * GET /api/messages/ticket/:ticketId
 * Obtener mensajes de un ticket
 */
router.get('/ticket/:ticketId', messageController.getMessagesByTicket);

/**
 * POST /api/messages
 * Enviar mensaje (ticket_id en el body) - Soporta adjuntos de imagen
 */
router.post('/', upload.single('attachment'), messageController.sendMessage);

/**
 * POST /api/messages/ticket/:ticketId
 * Enviar mensaje a un ticket - Soporta adjuntos de imagen
 */
router.post('/ticket/:ticketId', upload.single('attachment'), messageController.sendMessage);

/**
 * POST /api/messages/upload
 * Subir archivo y enviar como mensaje
 */
router.post('/upload', upload.single('file'), messageController.sendFileMessage);

/**
 * PUT /api/messages/:id/read
 * Marcar mensaje como leído
 */
router.put('/:id/read', messageController.markAsRead);

/**
 * PUT /api/messages/ticket/:ticketId/read-all
 * Marcar todos los mensajes de un ticket como leídos
 */
router.put('/ticket/:ticketId/read-all', messageController.markAllAsRead);

module.exports = router;
