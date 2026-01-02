const express = require('express');
const router = express.Router();
const TenantService = require('../services/tenantService');
const { authenticateToken } = require('../middleware/auth');

// Middleware para verificar rol de super admin
const requireSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    next();
};

/**
 * GET /api/tenants
 * Obtener todos los tenants
 */
router.get('/', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const tenants = await TenantService.getAllTenants();
        res.json({ success: true, tenants });
    } catch (error) {
        console.error('Error obteniendo tenants:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/tenants/:id
 * Obtener un tenant por ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el usuario tenga acceso a este tenant
        if (req.user.role !== 'super_admin' && req.user.tenant_id !== parseInt(id)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const tenant = await TenantService.getTenantById(id);
        res.json({ success: true, tenant });
    } catch (error) {
        console.error('Error obteniendo tenant:', error);
        res.status(404).json({ error: error.message });
    }
});

/**
 * POST /api/tenants
 * Crear un nuevo tenant
 */
router.post('/', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { name, subdomain, plan, maxAgents, adminEmail, adminPassword } = req.body;

        // Validaciones
        if (!name || !subdomain) {
            return res.status(400).json({ error: 'Nombre y subdominio son requeridos' });
        }

        if (!/^[a-z0-9-]+$/.test(subdomain)) {
            return res.status(400).json({
                error: 'El subdominio solo puede contener letras minúsculas, números y guiones'
            });
        }

        const result = await TenantService.createTenant({
            name,
            subdomain,
            plan: plan || 'free',
            maxAgents: maxAgents || 5,
            adminEmail,
            adminPassword
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creando tenant:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * PUT /api/tenants/:id
 * Actualizar un tenant
 */
router.put('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const result = await TenantService.updateTenant(id, updates);
        res.json(result);
    } catch (error) {
        console.error('Error actualizando tenant:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * DELETE /api/tenants/:id
 * Eliminar (desactivar) un tenant
 */
router.delete('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await TenantService.deleteTenant(id);
        res.json(result);
    } catch (error) {
        console.error('Error eliminando tenant:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/tenants/:id/stats
 * Obtener estadísticas de un tenant
 */
router.get('/:id/stats', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar acceso
        if (req.user.role !== 'super_admin' && req.user.tenant_id !== parseInt(id)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const stats = await TenantService.getTenantStats(id);
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/tenants/:id/limits
 * Verificar límites del tenant
 */
router.get('/:id/limits', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar acceso
        if (req.user.role !== 'super_admin' && req.user.tenant_id !== parseInt(id)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const limits = await TenantService.checkTenantLimits(id);
        res.json({ success: true, limits });
    } catch (error) {
        console.error('Error verificando límites:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
