const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar token JWT
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: 'Token de autenticación requerido'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                error: 'Token inválido o expirado'
            });
        }

        req.user = user;
        next();
    });
};

/**
 * Middleware para verificar roles
 */
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'No autenticado'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'No tienes permisos para realizar esta acción',
                requiredRoles: roles,
                yourRole: req.user.role
            });
        }

        next();
    };
};

/**
 * Middleware opcional de autenticación
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (!err) {
                req.user = user;
            }
        });
    }

    next();
};

/**
 * Middleware para verificar que el usuario es admin o supervisor
 */
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        return res.status(403).json({
            error: 'Acceso denegado. Se requieren permisos de administrador o supervisor'
        });
    }

    next();
};

/**
 * Middleware para verificar que el usuario es supervisor
 */
const isSupervisor = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Acceso denegado. Se requieren permisos de supervisor'
        });
    }

    next();
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    optionalAuth,
    isAdmin,
    isSupervisor
};
