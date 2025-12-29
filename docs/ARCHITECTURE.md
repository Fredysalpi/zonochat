# 🏗️ Arquitectura Técnica - ZonoChat

## 📐 Visión General

ZonoChat es una aplicación web de tres capas:

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  - Interfaz de usuario                                   │
│  - Gestión de estado (Context API)                       │
│  - Comunicación en tiempo real (Socket.io Client)        │
└─────────────────────────────────────────────────────────┘
                           ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js/Express)               │
│  - API REST                                              │
│  - Autenticación JWT                                     │
│  - WebSocket Server (Socket.io)                          │
│  - Lógica de negocio                                     │
│  - Integración con APIs externas                         │
└─────────────────────────────────────────────────────────┘
                           ↕ SQL
┌─────────────────────────────────────────────────────────┐
│                   BASE DE DATOS (MySQL)                  │
│  - Almacenamiento persistente                            │
│  - Relaciones entre entidades                            │
│  - Triggers y vistas                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Frontend - Arquitectura

### Tecnologías
- **React 18** - Biblioteca UI
- **Vite** - Build tool y dev server
- **React Router** - Enrutamiento
- **Context API** - Gestión de estado global
- **Axios** - Cliente HTTP
- **Socket.io Client** - WebSocket

### Estructura de Carpetas

```
frontend/src/
├── main.jsx                 # Punto de entrada
├── App.jsx                  # Componente raíz
├── index.css                # Estilos globales
│
├── context/                 # Contextos de React
│   └── AuthContext.jsx      # Autenticación
│
├── services/                # Servicios externos
│   ├── api.js               # Cliente HTTP
│   └── socket.js            # Cliente WebSocket (futuro)
│
├── pages/                   # Páginas principales
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Tickets.jsx          # (futuro)
│   └── Settings.jsx         # (futuro)
│
├── components/              # Componentes reutilizables
│   ├── common/              # Componentes genéricos
│   ├── tickets/             # Componentes de tickets
│   ├── chat/                # Componentes de chat
│   └── layout/              # Layout components
│
└── utils/                   # Utilidades
    ├── formatters.js        # Formateo de datos
    └── constants.js         # Constantes
```

### Flujo de Autenticación

```
1. Usuario ingresa credenciales
2. Frontend → POST /api/auth/login
3. Backend valida y genera JWT
4. Frontend guarda token en localStorage
5. Frontend configura header Authorization
6. Todas las peticiones incluyen el token
7. Backend valida token en cada request
```

### Comunicación en Tiempo Real

```
1. Usuario se conecta
2. Socket.io establece conexión WebSocket
3. Cliente se une a salas (rooms):
   - agent:{agentId}
   - ticket:{ticketId}
4. Servidor emite eventos a salas específicas
5. Cliente escucha eventos y actualiza UI
```

---

## ⚙️ Backend - Arquitectura

### Tecnologías
- **Node.js** - Runtime
- **Express** - Framework web
- **MySQL2** - Driver MySQL
- **Socket.io** - WebSocket server
- **JWT** - Autenticación
- **bcryptjs** - Encriptación
- **Helmet** - Seguridad HTTP
- **Morgan** - Logging

### Estructura de Carpetas

```
backend/src/
├── server.js                # Servidor principal
│
├── config/                  # Configuraciones
│   ├── database.js          # Pool de conexiones MySQL
│   └── socket.js            # Configuración Socket.io (futuro)
│
├── middleware/              # Middleware
│   ├── auth.js              # Autenticación JWT
│   ├── validation.js        # Validación de datos (futuro)
│   └── errorHandler.js      # Manejo de errores (futuro)
│
├── models/                  # Modelos de datos
│   ├── User.js              # Usuarios/Agentes
│   ├── Ticket.js            # Tickets/Conversaciones
│   ├── Message.js           # Mensajes (futuro)
│   ├── Contact.js           # Contactos (futuro)
│   └── Channel.js           # Canales (futuro)
│
├── controllers/             # Controladores (futuro)
│   ├── authController.js
│   ├── ticketController.js
│   ├── messageController.js
│   └── userController.js
│
├── routes/                  # Rutas API (futuro)
│   ├── auth.js
│   ├── tickets.js
│   ├── messages.js
│   └── users.js
│
├── services/                # Servicios externos
│   ├── whatsapp.js          # WhatsApp Business API
│   ├── messenger.js         # Facebook Messenger API
│   └── instagram.js         # Instagram Graph API
│
├── agents/                  # Sistema multi-agente
│   ├── assignmentEngine.js  # Motor de asignación
│   └── queueManager.js      # Gestor de cola
│
└── sockets/                 # Handlers WebSocket
    ├── ticketHandlers.js
    └── messageHandlers.js
```

### Patrón MVC

```
Request → Route → Controller → Model → Database
                      ↓
                  Response
```

### Middleware Pipeline

```
Request
  ↓
CORS
  ↓
Helmet (Security Headers)
  ↓
Morgan (Logging)
  ↓
Body Parser (JSON)
  ↓
Authentication (JWT)
  ↓
Authorization (Roles)
  ↓
Validation
  ↓
Controller
  ↓
Response
```

---

## 🗄️ Base de Datos - Arquitectura

### Modelo de Datos

```
┌─────────────┐
│    users    │
│  (Agentes)  │
└──────┬──────┘
       │
       │ assigned_to
       │
┌──────▼──────────────────────┐
│         tickets             │
│  (Conversaciones)           │
└──────┬──────────────────────┘
       │
       │ ticket_id
       │
┌──────▼──────┐
│  messages   │
│ (Mensajes)  │
└─────────────┘

┌─────────────┐
│  channels   │
│  (Canales)  │
└──────┬──────┘
       │
       │ channel_id
       │
┌──────▼──────┐
│  contacts   │
│ (Contactos) │
└──────┬──────┘
       │
       │ contact_id
       │
       └──────────────────────┐
                              │
                         ┌────▼────┐
                         │ tickets │
                         └─────────┘
```

### Relaciones Principales

1. **users → tickets** (1:N)
   - Un agente puede tener múltiples tickets asignados

2. **tickets → messages** (1:N)
   - Un ticket contiene múltiples mensajes

3. **channels → contacts** (1:N)
   - Un canal tiene múltiples contactos

4. **contacts → tickets** (1:N)
   - Un contacto puede tener múltiples tickets

5. **tickets → ticket_assignments** (1:N)
   - Historial de asignaciones de un ticket

### Índices Importantes

```sql
-- Búsqueda rápida de tickets
INDEX idx_ticket_number ON tickets(ticket_number)
INDEX idx_status ON tickets(status)
INDEX idx_assigned_to ON tickets(assigned_to)

-- Búsqueda de mensajes
INDEX idx_ticket_id ON messages(ticket_id)
INDEX idx_created_at ON messages(created_at)

-- Búsqueda de usuarios
INDEX idx_email ON users(email)
INDEX idx_role ON users(role)
```

### Vistas Útiles

1. **v_tickets_full**
   - Tickets con toda la información relacionada
   - Incluye: contacto, canal, agente asignado, contadores

2. **v_agent_stats**
   - Estadísticas de agentes
   - Incluye: tickets activos, slots disponibles

---

## 🔌 Integraciones Externas

### WhatsApp Business API

```
Webhook → Backend → Procesar mensaje → Crear/Actualizar ticket
                                    → Guardar mensaje
                                    → Notificar agente (Socket.io)
```

**Endpoints necesarios:**
- `POST /webhooks/whatsapp` - Recibir mensajes
- `GET /webhooks/whatsapp` - Verificación webhook

**Flujo:**
1. Cliente envía mensaje por WhatsApp
2. Meta envía webhook a nuestro servidor
3. Backend procesa el mensaje
4. Crea o actualiza ticket
5. Guarda mensaje en BD
6. Emite evento Socket.io al agente
7. Frontend actualiza UI en tiempo real

### Facebook Messenger

Similar a WhatsApp, usando Facebook Graph API.

### Instagram

Similar a WhatsApp, usando Instagram Graph API.

---

## 🔐 Seguridad

### Autenticación JWT

```javascript
// Estructura del token
{
  "id": 1,
  "email": "agent@zonochat.com",
  "role": "agent",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Niveles de Autorización

1. **admin** - Acceso total
2. **supervisor** - Gestión de agentes y tickets
3. **agent** - Solo sus tickets asignados

### Protección de Rutas

```javascript
// Ruta pública
app.get('/api/health', handler)

// Ruta autenticada
app.get('/api/tickets', authenticateToken, handler)

// Ruta con rol específico
app.post('/api/users', authenticateToken, authorizeRoles('admin'), handler)
```

---

## 🚀 Escalabilidad

### Optimizaciones Futuras

1. **Redis** para caché y sesiones
2. **Message Queue** (RabbitMQ/Bull) para procesamiento asíncrono
3. **CDN** para assets estáticos
4. **Load Balancer** para múltiples instancias
5. **Database Replication** para lectura/escritura

### Arquitectura Escalada (Futuro)

```
                    ┌─────────────┐
                    │   Nginx     │
                    │ Load Balancer│
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ Node.js │       │ Node.js │       │ Node.js │
   │Instance1│       │Instance2│       │Instance3│
   └────┬────┘       └────┬────┘       └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │    Redis    │
                    │   (Cache)   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    MySQL    │
                    │  (Primary)  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    MySQL    │
                    │  (Replica)  │
                    └─────────────┘
```

---

## 📊 Monitoreo y Logs

### Logs Importantes

1. **Autenticación** - Intentos de login
2. **Errores** - Errores de servidor
3. **Webhooks** - Mensajes recibidos
4. **Performance** - Tiempos de respuesta

### Métricas a Monitorear

- Tickets abiertos/cerrados por hora
- Tiempo promedio de respuesta
- Carga de agentes
- Errores de API
- Latencia de WebSocket

---

## 🧪 Testing (Futuro)

### Tipos de Tests

1. **Unit Tests** - Funciones individuales
2. **Integration Tests** - Flujos completos
3. **E2E Tests** - Pruebas de usuario

### Herramientas Sugeridas

- **Jest** - Unit tests
- **Supertest** - API tests
- **Cypress** - E2E tests

---

**Última actualización:** 2025-12-27  
**Versión:** 1.0
