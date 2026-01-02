const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

/**
 * POST /api/auth/register
 * Registrar nuevo usuario
 */
router.post('/register',
    [
        body('email').isEmail().withMessage('Email inválido'),
        body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
        body('first_name').notEmpty().withMessage('El nombre es requerido'),
        body('last_name').notEmpty().withMessage('El apellido es requerido')
    ],
    async (req, res) => {
        try {
            // Validar datos
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password, first_name, last_name, role } = req.body;

            // Verificar si el usuario ya existe
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    error: 'El email ya está registrado'
                });
            }

            // Encriptar contraseña
            const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

            // Crear usuario
            const user = await User.create({
                email,
                password: hashedPassword,
                first_name,
                last_name,
                role: role || 'agent'
            });

            // Generar token
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    tenant_id: user.tenant_id
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.status(201).json({
                message: 'Usuario registrado exitosamente',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Error en registro:', error);
            res.status(500).json({
                error: 'Error al registrar usuario'
            });
        }
    }
);

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/login',
    [
        body('email').isEmail().withMessage('Email inválido'),
        body('password').notEmpty().withMessage('La contraseña es requerida')
    ],
    async (req, res) => {
        try {
            // Validar datos
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password } = req.body;

            // Buscar usuario
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    error: 'Credenciales inválidas'
                });
            }

            // Verificar contraseña
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    error: 'Credenciales inválidas'
                });
            }

            // Verificar que el usuario esté activo
            if (!user.is_active) {
                return res.status(403).json({
                    error: 'Usuario inactivo'
                });
            }

            // Actualizar último login
            await User.updateLastLogin(user.id);

            // Generar token
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    tenant_id: user.tenant_id
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.json({
                message: 'Login exitoso',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    avatar: user.avatar,
                    status: user.status
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                error: 'Error al iniciar sesión'
            });
        }
    }
);

/**
 * GET /api/auth/me
 * Obtener usuario actual
 */
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: 'Token no proporcionado'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                avatar: user.avatar,
                status: user.status
            }
        });

    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(401).json({
            error: 'Token inválido'
        });
    }
});

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
router.post('/logout', async (req, res) => {
    try {
        // En una implementación real, aquí invalidarías el token
        // Por ahora, solo enviamos una respuesta exitosa
        res.json({
            message: 'Logout exitoso'
        });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            error: 'Error al cerrar sesión'
        });
    }
});

module.exports = router;
