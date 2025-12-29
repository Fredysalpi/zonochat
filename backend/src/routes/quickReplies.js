const express = require('express');
const router = express.Router();
const quickReplyController = require('../controllers/quickReplyController');
const { authenticateToken } = require('../middleware/auth');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * GET /api/quick-replies
 * Obtener todas las respuestas rápidas del usuario
 */
router.get('/', quickReplyController.getQuickReplies);

/**
 * POST /api/quick-replies
 * Crear nueva respuesta rápida
 */
router.post('/', quickReplyController.createQuickReply);

/**
 * PUT /api/quick-replies/:id
 * Actualizar respuesta rápida
 */
router.put('/:id', quickReplyController.updateQuickReply);

/**
 * DELETE /api/quick-replies/:id
 * Eliminar respuesta rápida
 */
router.delete('/:id', quickReplyController.deleteQuickReply);

/**
 * GET /api/quick-replies/shortcut/:shortcut
 * Buscar respuesta rápida por atajo
 */
router.get('/shortcut/:shortcut', quickReplyController.searchByShortcut);

module.exports = router;
