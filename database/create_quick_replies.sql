-- Crear tabla de respuestas rápidas
CREATE TABLE IF NOT EXISTS quick_replies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL COMMENT 'NULL para respuestas globales',
    shortcut VARCHAR(50) NOT NULL COMMENT 'Atajo para activar la respuesta (ej: /hola)',
    title VARCHAR(100) NOT NULL COMMENT 'Título descriptivo',
    content TEXT NOT NULL COMMENT 'Contenido del mensaje',
    category VARCHAR(50) NULL COMMENT 'Categoría para organizar (ej: Saludos, Despedidas)',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_shortcut (user_id, shortcut),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar respuestas rápidas globales de ejemplo
INSERT INTO quick_replies (user_id, shortcut, title, content, category) VALUES
(NULL, 'hola', 'Saludo inicial', '¡Hola! 👋 Gracias por contactarnos. ¿En qué puedo ayudarte hoy?', 'Saludos'),
(NULL, 'gracias', 'Agradecimiento', '¡De nada! Estoy aquí para ayudarte. ¿Hay algo más en lo que pueda asistirte?', 'Cortesía'),
(NULL, 'espera', 'Solicitar espera', 'Un momento por favor, estoy revisando tu solicitud... ⏳', 'Soporte'),
(NULL, 'info', 'Solicitar información', 'Para poder ayudarte mejor, ¿podrías proporcionarme más detalles sobre tu consulta?', 'Soporte'),
(NULL, 'resuelto', 'Problema resuelto', '¡Perfecto! Me alegra que hayamos podido resolver tu problema. ¿Hay algo más en lo que pueda ayudarte?', 'Cierre'),
(NULL, 'despedida', 'Despedida', 'Gracias por contactarnos. ¡Que tengas un excelente día! 😊', 'Despedidas'),
(NULL, 'horario', 'Horario de atención', 'Nuestro horario de atención es de Lunes a Viernes de 9:00 AM a 6:00 PM. Los fines de semana estamos cerrados.', 'Información'),
(NULL, 'derivar', 'Derivar a especialista', 'Voy a derivar tu consulta a un especialista que podrá ayudarte mejor. En breve se pondrá en contacto contigo.', 'Soporte');

-- Verificar la creación
SELECT * FROM quick_replies;
