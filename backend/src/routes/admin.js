const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Aplicar autenticación y verificación de admin a todas las rutas
router.use(authenticateToken);
router.use(isAdmin);

// RUTAS DE USUARIOS/AGENTES
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// RUTAS DE CANALES
router.get('/channels', adminController.getAllChannels);
router.post('/channels', adminController.createChannel);
router.put('/channels/:id', adminController.updateChannel);
router.delete('/channels/:id', adminController.deleteChannel);

module.exports = router;
