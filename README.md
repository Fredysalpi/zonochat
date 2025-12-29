# 🚀 ZonoChat

Sistema de chat omnicanal para gestión de conversaciones multi-agente, inspirado en Laraigo.

## 📋 Descripción

ZonoChat es una plataforma completa de gestión de conversaciones que permite a múltiples agentes atender clientes desde diferentes canales (Messenger, WhatsApp, Instagram) en una sola interfaz unificada.

## ✨ Características

### 🎯 Funcionalidades Principales
- ✅ **Chat en tiempo real** con WebSockets
- ✅ **Múltiples canales**: Messenger, WhatsApp, Instagram
- ✅ **Sistema de tickets** con estados (Abierto, Pendiente, Cerrado)
- ✅ **Panel de supervisor** con estadísticas en tiempo real
- ✅ **Gestión de agentes** con estados (Disponible, Ocupado, Ausente)
- ✅ **Reasignación de tickets** entre agentes
- ✅ **Respuestas rápidas** predefinidas
- ✅ **Notificaciones de sonido** automáticas
- ✅ **Mensajes del sistema** para eventos importantes
- ✅ **Soporte para archivos multimedia**

### 👥 Roles de Usuario
- **Admin**: Gestión completa del sistema
- **Supervisor**: Monitoreo y reasignación de tickets
- **Agente**: Atención de conversaciones

## 🛠️ Tecnologías

### Backend
- Node.js + Express
- MySQL
- Socket.IO (WebSockets)
- JWT (Autenticación)
- Multer (Subida de archivos)

### Frontend
- React + Vite
- Lucide React (Iconos)
- Axios
- Socket.IO Client

### Integraciones
- Meta Cloud API (Messenger, WhatsApp, Instagram)
- Webhooks para recepción de mensajes

## 📦 Instalación

### Requisitos Previos
- Node.js 18+ 
- MySQL 8+
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/zonochat.git
cd zonochat
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env`:
```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=zonochat_dev
DB_PORT=3306

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro

# Servidor
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Messenger (opcional)
MESSENGER_PAGE_ACCESS_TOKEN=tu_token
MESSENGER_VERIFY_TOKEN=tu_verify_token
```

Importar base de datos:
```bash
mysql -u root -p zonochat_dev < database/schema.sql
```

Iniciar backend:
```bash
npm run dev
```

### 3. Configurar Frontend

```bash
cd frontend
npm install
```

Crear archivo `.env`:
```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

Iniciar frontend:
```bash
npm run dev
```

## 🚀 Uso

### Acceso al Sistema

1. Abre el navegador en `http://localhost:5173`
2. Inicia sesión con las credenciales por defecto:
   - **Admin**: admin@zonochat.com / admin123
   - **Supervisor**: supervisor@zonochat.com / supervisor123
   - **Agente**: agente@zonochat.com / agente123

### Configurar Webhooks (Messenger)

Para recibir mensajes de Messenger:

1. **Instalar ngrok** (para desarrollo):
```bash
npm install -g ngrok
ngrok http 3000
```

2. **Configurar en Meta for Developers**:
   - URL del webhook: `https://tu-url-ngrok.ngrok-free.app/api/webhooks/messenger`
   - Verify Token: El que definiste en `.env`
   - Suscribirse a: `messages`

## 📚 Documentación

### Estructura del Proyecto

```
zonochat/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuración (DB, etc)
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── middleware/     # Middlewares (auth, etc)
│   │   ├── models/         # Modelos de datos
│   │   ├── routes/         # Rutas de API
│   │   └── server.js       # Punto de entrada
│   ├── database/
│   │   ├── migrations/     # Migraciones SQL
│   │   └── schema.sql      # Esquema completo
│   └── uploads/            # Archivos subidos
├── frontend/
│   ├── public/             # Archivos estáticos
│   └── src/
│       ├── components/     # Componentes React
│       ├── hooks/          # Custom hooks
│       ├── pages/          # Páginas principales
│       ├── services/       # Servicios (API, etc)
│       └── styles/         # Estilos CSS
└── .agent/
    └── workflows/          # Guías y documentación
```

### API Endpoints

#### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/me` - Obtener usuario actual

#### Tickets
- `GET /api/tickets` - Listar tickets
- `GET /api/tickets/:id` - Obtener ticket
- `POST /api/tickets` - Crear ticket
- `PUT /api/tickets/:id` - Actualizar ticket
- `PUT /api/tickets/:id/status` - Cambiar estado
- `PUT /api/tickets/:id/assign` - Asignar agente

#### Mensajes
- `GET /api/messages/:ticketId` - Obtener mensajes
- `POST /api/messages` - Enviar mensaje
- `POST /api/messages/upload` - Subir archivo

#### Supervisor
- `GET /api/supervisor/agents/stats` - Estadísticas de agentes
- `GET /api/supervisor/agents` - Lista de agentes
- `GET /api/supervisor/holding` - Tickets en espera

#### Webhooks
- `GET /api/webhooks/messenger` - Verificación
- `POST /api/webhooks/messenger` - Recibir mensajes

### WebSocket Events

#### Cliente → Servidor
- `agent:status` - Cambiar estado del agente
- `ticket:join` - Unirse a sala de ticket
- `ticket:leave` - Salir de sala de ticket
- `message:send` - Enviar mensaje
- `ticket:status_changed` - Cambio de estado

#### Servidor → Cliente
- `ticket:created` - Nuevo ticket creado
- `ticket:updated` - Ticket actualizado
- `ticket:assigned` - Ticket asignado
- `ticket:transferred_in` - Ticket recibido
- `ticket:transferred_out` - Ticket transferido
- `message:new` - Nuevo mensaje
- `system:message` - Mensaje del sistema
- `agent:online` - Agente conectado
- `agent:offline` - Agente desconectado
- `agent:status_changed` - Estado de agente cambiado

## 🔐 Seguridad

- ✅ Autenticación JWT
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Variables de entorno para datos sensibles
- ✅ Validación de tokens en webhooks
- ✅ CORS configurado
- ✅ Sanitización de inputs

## 📝 Guías Adicionales

En la carpeta `.agent/workflows/` encontrarás:
- `deployment-production.md` - Guía completa de despliegue
- `setup-messenger-solo.md` - Configuración de Messenger
- `modulo-configuracion-canales.md` - Módulo de configuración

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👨‍💻 Autor

Desarrollado por Fredy Salpiandroid

## 🙏 Agradecimientos

- Inspirado en Laraigo
- Comunidad de React y Node.js
- Meta for Developers

---

**¿Necesitas ayuda?** Abre un issue en GitHub o consulta la documentación en `.agent/workflows/`
