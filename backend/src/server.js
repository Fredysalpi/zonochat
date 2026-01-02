require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

// Importar configuración
const db = require('./config/database');

// Crear aplicación Express
const app = express();
const server = http.createServer(app);

// Configurar Socket.io
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

const path = require('path');

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (uploads) con headers CORS permisivos para webhooks externos
app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Access-Control-Allow-Methods', 'GET');
    next();
}, express.static(path.join(__dirname, '../uploads')));


// Hacer io accesible en las rutas
app.set('io', io);

// Hacer io accesible globalmente para webhooks
global.io = io;

// ============================================
// SOCKET.IO - CONFIGURACIÓN Y LISTENERS
// ============================================
console.log('🔧 Configurando Socket.IO...');

// Mapa para rastrear agentes conectados
const connectedAgents = new Map(); // agentId -> { sockets: Set, connectedAt, status }

// Función helper para obtener agentes conectados
const getConnectedAgents = () => {
    return Array.from(connectedAgents.keys());
};

// Función helper para obtener datos completos de agentes conectados
const getConnectedAgentsData = () => {
    return connectedAgents;
};

// Exponer las funciones en app para que los controladores puedan acceder
app.set('getConnectedAgents', getConnectedAgents);
app.set('getConnectedAgentsData', getConnectedAgentsData);

io.on('connection', (socket) => {
    console.log('👤 Cliente conectado:', socket.id);

    // Unirse a sala de agente y registrar presencia
    socket.on('agent:join', async (agentId) => {
        console.log('📥 ¡EVENTO AGENT:JOIN RECIBIDO! agentId:', agentId, 'tipo:', typeof agentId);
        socket.join(`agent:${agentId}`);
        socket.agentId = agentId;

        const isFirstConnection = !connectedAgents.has(agentId);

        if (connectedAgents.has(agentId)) {
            connectedAgents.get(agentId).sockets.add(socket.id);
            console.log(`🔄 Agente ${agentId} - nueva pestaña (${connectedAgents.get(agentId).sockets.size} pestañas)`);
        } else {
            connectedAgents.set(agentId, {
                sockets: new Set([socket.id]),
                connectedAt: new Date(),
                status: 'available'
            });
            console.log(`✅ Agente ${agentId} conectado`);
            io.emit('agent:online', { agentId, status: 'available' });
        }

        const onlineAgents = Array.from(connectedAgents.entries()).map(([id, data]) => ({
            agentId: id,
            status: data.status,
            connectedAt: data.connectedAt
        }));
        socket.emit('agents:online', onlineAgents);

        // 🤖 ASIGNACIÓN AUTOMÁTICA: Solo cuando es la primera conexión
        if (isFirstConnection) {
            const { autoAssignTicketsToAgent } = require('./utils/autoAssign');
            const result = await autoAssignTicketsToAgent(agentId, io);

            if (result.assigned > 0) {
                console.log(`🎯 ${result.assigned} ticket(s) asignado(s) automáticamente al agente ${agentId}`);
            }
        }
    });

    // Cambiar estado del agente
    socket.on('agent:status', (data) => {
        const { agentId, status } = data;
        if (connectedAgents.has(agentId)) {
            connectedAgents.get(agentId).status = status;
            io.emit('agent:status_changed', { agentId, status });
        }
    });

    // Unirse a sala de ticket
    socket.on('ticket:join', (ticketId) => {
        socket.join(`ticket:${ticketId}`);
        console.log(`Cliente unido al ticket ${ticketId}`);
    });

    // Agente escribiendo
    socket.on('agent:typing', (data) => {
        socket.to(`ticket:${data.ticketId}`).emit('agent:typing', data);
    });

    // Mensaje del sistema (transferencias, etc.)
    socket.on('system:message', (data) => {
        console.log('📢 Mensaje del sistema:', data);
        // Emitir a todos en la sala del ticket
        io.to(`ticket:${data.ticketId}`).emit('system:message', data);
    });

    // Cambio de estado del ticket
    socket.on('ticket:status_changed', (data) => {
        console.log('🔄 Estado del ticket cambiado:', data);
        // Emitir a todos para actualizar el supervisor
        io.emit('ticket:updated', data.ticket);
    });

    // Ticket abierto por el agente (para limpiar notificaciones)
    socket.on('ticket:opened', (data) => {
        console.log('👁️ Ticket abierto por agente:', data.ticketId);
        // Emitir solo al agente que abrió el ticket
        if (socket.agentId) {
            io.to(`agent:${socket.agentId}`).emit('ticket:opened', data);
        }
    });

    // Desconexión
    socket.on('disconnect', () => {
        console.log('👤 Cliente desconectado:', socket.id);

        if (socket.agentId) {
            const agentData = connectedAgents.get(socket.agentId);

            if (agentData) {
                agentData.sockets.delete(socket.id);

                if (agentData.sockets.size === 0) {
                    connectedAgents.delete(socket.agentId);
                    console.log(`❌ Agente ${socket.agentId} desconectado`);
                    io.emit('agent:offline', { agentId: socket.agentId });
                } else {
                    console.log(`🔄 Agente ${socket.agentId} - pestaña cerrada (quedan ${agentData.sockets.size})`);
                }
            }
        }
    });
});

console.log('✅ Socket.IO configurado correctamente');

// ============================================
// RUTAS
// ============================================

// Rutas básicas
app.get('/', (req, res) => {
    res.json({
        message: '🚀 ZonoChat API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message
        });
    }
});

// Importar rutas
const authRoutes = require('./routes/auth');
const ticketsRoutes = require('./routes/tickets');
const messagesRoutes = require('./routes/messages');
const supervisorRoutes = require('./routes/supervisor');
const quickRepliesRoutes = require('./routes/quickReplies');
const adminRoutes = require('./routes/admin');
const webhooksRoutes = require('./routes/webhooks');
// Multi-tenancy routes
const tenantsRoutes = require('./routes/tenants');
const channelConfigRoutes = require('./routes/channelConfig');
const agentsRoutes = require('./routes/agents');
// const channelsRoutes = require('./routes/channels'); // Temporalmente deshabilitado
// const usersRoutes = require('./routes/users');

// Registrar rutas
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/quick-replies', quickRepliesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhooksRoutes);
// Multi-tenancy routes
app.use('/api/tenants', tenantsRoutes);
app.use('/api/channel-config', channelConfigRoutes);
app.use('/api/agents', agentsRoutes);
// app.use('/api/channels', channelsRoutes); // Temporalmente deshabilitado
// app.use('/api/users', usersRoutes);

// Endpoint de debug para ver agentes conectados
app.get('/api/debug/connected-agents', (req, res) => {
    const getConnectedAgents = req.app.get('getConnectedAgents');
    const connectedAgentIds = getConnectedAgents ? getConnectedAgents() : [];
    res.json({
        count: connectedAgentIds.length,
        agents: connectedAgentIds
    });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado',
        path: req.path
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║     🚀 ZONOCHAT API INICIADO 🚀       ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║  Puerto:        ${PORT.toString().padEnd(24)}║`);
    console.log(`║  Entorno:       ${(process.env.NODE_ENV || 'development').padEnd(24)}║`);
    console.log(`║  URL:           http://localhost:${PORT.toString().padEnd(13)}║`);
    console.log('╚════════════════════════════════════════╝');
    console.log('');
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('SIGTERM recibido, cerrando servidor...');
    server.close(() => {
        console.log('Servidor cerrado');
        process.exit(0);
    });
});

module.exports = { app, server, io, connectedAgents };
