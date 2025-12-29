const express = require('express');
const router = express.Router();
const supervisorController = require('../controllers/supervisorController');
const auth = require('../middleware/auth');

// Todas las rutas requieren autenticación (temporalmente deshabilitado para debug)
// router.use(auth);

// Obtener estadísticas de agentes
router.get('/agents/stats', supervisorController.getAgentStats);

// Obtener lista de agentes con métricas
router.get('/agents', supervisorController.getAgents);

// Obtener tickets de un agente específico
router.get('/agents/:agentId/tickets', supervisorController.getAgentTickets);

// Actualizar estado del agente
router.put('/agents/:userId/status', supervisorController.updateAgentStatus);

// Obtener tickets en holding
router.get('/holding', supervisorController.getHoldingTickets);

module.exports = router;
