const db = require('../config/database');

/**
 * Obtener todas las respuestas rápidas del usuario
 */
exports.getQuickReplies = async (req, res) => {
    try {
        const userId = req.user.id;

        // Obtener respuestas personales y globales
        const [replies] = await db.query(
            `SELECT * FROM quick_replies 
             WHERE (user_id = ? OR user_id IS NULL) AND is_active = TRUE
             ORDER BY category, title`,
            [userId]
        );

        res.json({
            success: true,
            quickReplies: replies
        });
    } catch (error) {
        console.error('Error al obtener respuestas rápidas:', error);
        res.status(500).json({
            error: 'Error al obtener respuestas rápidas'
        });
    }
};

/**
 * Crear nueva respuesta rápida
 */
exports.createQuickReply = async (req, res) => {
    try {
        const userId = req.user.id;
        const { shortcut, title, content, category } = req.body;

        if (!shortcut || !title || !content) {
            return res.status(400).json({
                error: 'Shortcut, título y contenido son requeridos'
            });
        }

        // Verificar que el shortcut no exista para este usuario
        const [existing] = await db.query(
            'SELECT id FROM quick_replies WHERE shortcut = ? AND (user_id = ? OR user_id IS NULL)',
            [shortcut, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                error: 'Ya existe una respuesta rápida con ese atajo'
            });
        }

        const [result] = await db.query(
            `INSERT INTO quick_replies (user_id, shortcut, title, content, category)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, shortcut, title, content, category || null]
        );

        const [newReply] = await db.query(
            'SELECT * FROM quick_replies WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Respuesta rápida creada exitosamente',
            quickReply: newReply[0]
        });
    } catch (error) {
        console.error('Error al crear respuesta rápida:', error);
        res.status(500).json({
            error: 'Error al crear respuesta rápida'
        });
    }
};

/**
 * Actualizar respuesta rápida
 */
exports.updateQuickReply = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { shortcut, title, content, category } = req.body;

        // Verificar que la respuesta pertenezca al usuario
        const [reply] = await db.query(
            'SELECT * FROM quick_replies WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (reply.length === 0) {
            return res.status(404).json({
                error: 'Respuesta rápida no encontrada'
            });
        }

        // Verificar que el shortcut no esté en uso por otra respuesta
        if (shortcut && shortcut !== reply[0].shortcut) {
            const [existing] = await db.query(
                'SELECT id FROM quick_replies WHERE shortcut = ? AND id != ? AND (user_id = ? OR user_id IS NULL)',
                [shortcut, id, userId]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    error: 'Ya existe una respuesta rápida con ese atajo'
                });
            }
        }

        await db.query(
            `UPDATE quick_replies 
             SET shortcut = ?, title = ?, content = ?, category = ?, updated_at = NOW()
             WHERE id = ? AND user_id = ?`,
            [
                shortcut || reply[0].shortcut,
                title || reply[0].title,
                content || reply[0].content,
                category !== undefined ? category : reply[0].category,
                id,
                userId
            ]
        );

        const [updated] = await db.query(
            'SELECT * FROM quick_replies WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Respuesta rápida actualizada exitosamente',
            quickReply: updated[0]
        });
    } catch (error) {
        console.error('Error al actualizar respuesta rápida:', error);
        res.status(500).json({
            error: 'Error al actualizar respuesta rápida'
        });
    }
};

/**
 * Eliminar respuesta rápida
 */
exports.deleteQuickReply = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verificar que la respuesta pertenezca al usuario
        const [reply] = await db.query(
            'SELECT * FROM quick_replies WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (reply.length === 0) {
            return res.status(404).json({
                error: 'Respuesta rápida no encontrada'
            });
        }

        await db.query(
            'DELETE FROM quick_replies WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({
            success: true,
            message: 'Respuesta rápida eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar respuesta rápida:', error);
        res.status(500).json({
            error: 'Error al eliminar respuesta rápida'
        });
    }
};

/**
 * Buscar respuesta rápida por atajo
 */
exports.searchByShortcut = async (req, res) => {
    try {
        const userId = req.user.id;
        const { shortcut } = req.params;

        const [replies] = await db.query(
            `SELECT * FROM quick_replies 
             WHERE shortcut = ? AND (user_id = ? OR user_id IS NULL) AND is_active = TRUE
             LIMIT 1`,
            [shortcut, userId]
        );

        if (replies.length === 0) {
            return res.status(404).json({
                error: 'Respuesta rápida no encontrada'
            });
        }

        res.json({
            success: true,
            quickReply: replies[0]
        });
    } catch (error) {
        console.error('Error al buscar respuesta rápida:', error);
        res.status(500).json({
            error: 'Error al buscar respuesta rápida'
        });
    }
};

module.exports = exports;
