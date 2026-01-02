const express = require('express');
const router = express.Router();

// Importar controladores de webhooks
const messengerController = require('../controllers/webhooks/messengerController');
const instagramController = require('../controllers/webhooks/instagramController');
const whatsappController = require('../controllers/webhooks/whatsappController');
const telegramController = require('../controllers/webhooks/telegramController');

// ==================== MESSENGER ====================

// Verificación del webhook (GET)
router.get('/messenger', messengerController.verify);

// Recibir mensajes (POST)
router.post('/messenger', messengerController.webhook);

// ==================== INSTAGRAM ====================

// Verificación del webhook (GET)
router.get('/instagram', instagramController.verify);

// Recibir mensajes (POST)
router.post('/instagram', instagramController.webhook);

// ==================== WHATSAPP ====================

// Verificación del webhook (GET)
router.get('/whatsapp', whatsappController.verify);

// Recibir mensajes (POST)
router.post('/whatsapp', whatsappController.webhook);

// ==================== TELEGRAM ====================

// Recibir mensajes (POST)
router.post('/telegram', telegramController.webhook);

// Configurar webhook (POST) - Endpoint especial para Telegram
router.post('/telegram/set', telegramController.setWebhook);

module.exports = router;
