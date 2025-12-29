const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticateToken } = require('../middleware/auth');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * GET /api/tickets
 * Obtener todos los tickets (con filtros opcionales)
 */
router.get('/', ticketController.getAllTickets);

/**
 * GET /api/tickets/my
 * Obtener tickets del agente actual
 */
router.get('/my', ticketController.getMyTickets);

/**
 * GET /api/tickets/:id
 * Obtener un ticket específico
 */
router.get('/:id', ticketController.getTicketById);

/**
 * POST /api/tickets
 * Crear nuevo ticket
 */
router.post('/', ticketController.createTicket);

/**
 * PUT /api/tickets/:id/assign
 * Asignar ticket a un agente
 */
router.put('/:id/assign', ticketController.assignTicket);

/**
 * PUT /api/tickets/:id/transfer
 * Transferir ticket a otro agente
 */
router.put('/:id/transfer', ticketController.transferTicket);

/**
 * PUT /api/tickets/:id/status
 * Actualizar estado del ticket
 */
router.put('/:id/status', ticketController.updateTicketStatus);

/**
 * PUT /api/tickets/:id/priority
 * Actualizar prioridad del ticket
 */
router.put('/:id/priority', ticketController.updateTicketPriority);

module.exports = router;
