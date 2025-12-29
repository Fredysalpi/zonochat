const express = require('express');
const router = express.Router();
// const whatsappController = require('../controllers/webhooks/whatsappController'); // Temporalmente deshabilitado
const messengerController = require('../controllers/webhooks/messengerController');
// const instagramController = require('../controllers/webhooks/instagramController'); // Temporalmente deshabilitado

// ==================== WHATSAPP ====================
// Temporalmente deshabilitado
// router.get('/whatsapp', whatsappController.verify);
// router.post('/whatsapp', whatsappController.receiveMessage);

// ==================== MESSENGER ====================

// Verificación del webhook (GET)
router.get('/messenger', messengerController.verify);

// Recibir mensajes (POST)
router.post('/messenger', messengerController.receiveMessage);

// ==================== INSTAGRAM ====================
// Temporalmente deshabilitado
// router.get('/instagram', instagramController.verify);
// router.post('/instagram', instagramController.receiveMessage);

module.exports = router;

