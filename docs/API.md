# 📡 API Documentation - ZonoChat

## Base URL
```
http://localhost:3000/api
```

---

## 🔐 Autenticación

### POST /auth/register
Registrar nuevo usuario

**Body:**
```json
{
  "email": "agent@zonochat.com",
  "password": "password123",
  "first_name": "Juan",
  "last_name": "Pérez",
  "role": "agent"
}
```

**Response:**
```json
{
  "message": "Usuario registrado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "agent@zonochat.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "role": "agent"
  }
}
```

---

### POST /auth/login
Iniciar sesión

**Body:**
```json
{
  "email": "admin@zonochat.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@zonochat.com",
    "first_name": "Admin",
    "last_name": "ZonoChat",
    "role": "admin",
    "avatar": null,
    "status": "online"
  }
}
```

---

### GET /auth/me
Obtener usuario actual (requiere autenticación)

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "admin@zonochat.com",
    "first_name": "Admin",
    "last_name": "ZonoChat",
    "role": "admin",
    "avatar": null,
    "status": "online"
  }
}
```

---

### POST /auth/logout
Cerrar sesión

**Response:**
```json
{
  "message": "Logout exitoso"
}
```

---

## 🎫 Tickets

> **Nota:** Todas las rutas de tickets requieren autenticación

### GET /tickets
Obtener todos los tickets

**Query Params:**
- `status` (opcional): open, pending, resolved, closed
- `channel` (opcional): whatsapp, messenger, instagram
- `agent_id` (opcional): ID del agente
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Resultados por página (default: 20)

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "tickets": [
    {
      "id": 1,
      "ticket_number": "TKT-000001",
      "contact_name": "Cliente Ejemplo",
      "subject": "Consulta sobre producto",
      "status": "open",
      "priority": "medium",
      "channel_type": "whatsapp",
      "assigned_to": 1,
      "agent_name": "Admin ZonoChat",
      "created_at": "2025-12-27T16:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

### GET /tickets/my
Obtener tickets del agente actual

**Query Params:**
- `status` (opcional): open, pending, resolved, closed

**Headers:**
```
Authorization: Bearer {token}
```

---

### GET /tickets/:id
Obtener un ticket específico

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "ticket": {
    "id": 1,
    "ticket_number": "TKT-000001",
    "contact_id": 1,
    "contact_name": "Cliente Ejemplo",
    "subject": "Consulta sobre producto",
    "status": "open",
    "priority": "medium",
    "channel_id": 1,
    "channel_type": "whatsapp",
    "assigned_to": 1,
    "agent_name": "Admin ZonoChat",
    "created_at": "2025-12-27T16:00:00.000Z",
    "updated_at": "2025-12-27T16:00:00.000Z"
  }
}
```

---

### POST /tickets
Crear nuevo ticket

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "contact_id": 1,
  "channel_id": 1,
  "subject": "Nueva consulta",
  "priority": "medium"
}
```

**Response:**
```json
{
  "message": "Ticket creado exitosamente",
  "ticket": {
    "id": 2,
    "ticket_number": "TKT-000002",
    "status": "open",
    ...
  }
}
```

---

### PUT /tickets/:id/assign
Asignar ticket a un agente

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "agent_id": 2
}
```

**Response:**
```json
{
  "message": "Ticket asignado exitosamente",
  "ticket": { ... }
}
```

---

### PUT /tickets/:id/status
Actualizar estado del ticket

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "status": "resolved"
}
```

**Valores válidos:** `open`, `pending`, `resolved`, `closed`

---

### PUT /tickets/:id/priority
Actualizar prioridad del ticket

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "priority": "high"
}
```

**Valores válidos:** `low`, `medium`, `high`, `urgent`

---

## 💬 Mensajes

### POST /messages/webhook
Recibir mensajes de webhooks (sin autenticación)

**Body:**
```json
{
  "channel": "whatsapp",
  "from": "+1234567890",
  "content": "Hola, necesito ayuda",
  "message_type": "text",
  "media_url": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mensaje recibido",
  "ticketId": 1
}
```

---

### GET /messages/ticket/:ticketId
Obtener mensajes de un ticket

**Query Params:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Resultados por página (default: 50)

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "messages": [
    {
      "id": 1,
      "ticket_id": 1,
      "sender_id": null,
      "content": "Hola, necesito ayuda",
      "message_type": "text",
      "direction": "inbound",
      "is_read": true,
      "created_at": "2025-12-27T16:00:00.000Z",
      "first_name": null,
      "last_name": null,
      "user_avatar": null
    },
    {
      "id": 2,
      "ticket_id": 1,
      "sender_id": 1,
      "content": "Hola! ¿En qué puedo ayudarte?",
      "message_type": "text",
      "direction": "outbound",
      "is_read": false,
      "created_at": "2025-12-27T16:01:00.000Z",
      "first_name": "Admin",
      "last_name": "ZonoChat",
      "user_avatar": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 12,
    "pages": 1
  }
}
```

---

### POST /messages/ticket/:ticketId
Enviar mensaje a un ticket

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "content": "Gracias por contactarnos",
  "message_type": "text",
  "media_url": null
}
```

**Tipos de mensaje:** `text`, `image`, `video`, `audio`, `document`

**Response:**
```json
{
  "message": "Mensaje enviado exitosamente",
  "data": {
    "id": 3,
    "ticket_id": 1,
    "sender_id": 1,
    "content": "Gracias por contactarnos",
    "message_type": "text",
    "direction": "outbound",
    "created_at": "2025-12-27T16:02:00.000Z",
    "first_name": "Admin",
    "last_name": "ZonoChat"
  }
}
```

---

### PUT /messages/:id/read
Marcar mensaje como leído

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Mensaje marcado como leído"
}
```

---

### PUT /messages/ticket/:ticketId/read-all
Marcar todos los mensajes de un ticket como leídos

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Mensajes marcados como leídos"
}
```

---

## 🔌 WebSocket Events

### Cliente → Servidor

**Unirse a sala de agente:**
```javascript
socket.emit('agent:join', agentId);
```

**Unirse a sala de ticket:**
```javascript
socket.emit('ticket:join', ticketId);
```

**Agente escribiendo:**
```javascript
socket.emit('agent:typing', { ticketId, agentName });
```

---

### Servidor → Cliente

**Nuevo ticket creado:**
```javascript
socket.on('ticket:created', (ticket) => {
  console.log('Nuevo ticket:', ticket);
});
```

**Ticket asignado:**
```javascript
socket.on('ticket:assigned', (ticket) => {
  console.log('Ticket asignado:', ticket);
});
```

**Ticket actualizado:**
```javascript
socket.on('ticket:updated', (ticket) => {
  console.log('Ticket actualizado:', ticket);
});
```

**Nuevo mensaje:**
```javascript
socket.on('message:new', (message) => {
  console.log('Nuevo mensaje:', message);
});
```

**Mensajes leídos:**
```javascript
socket.on('messages:read', ({ ticketId }) => {
  console.log('Mensajes leídos en ticket:', ticketId);
});
```

**Agente escribiendo:**
```javascript
socket.on('agent:typing', ({ ticketId, agentName }) => {
  console.log(`${agentName} está escribiendo...`);
});
```

---

## 🧪 Ejemplos con cURL

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zonochat.com","password":"admin123"}'
```

### Obtener tickets
```bash
curl -X GET "http://localhost:3000/api/tickets?status=open" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Crear ticket
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contact_id":1,"channel_id":1,"subject":"Nueva consulta"}'
```

### Enviar mensaje
```bash
curl -X POST http://localhost:3000/api/messages/ticket/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hola, ¿cómo estás?","message_type":"text"}'
```

---

## 📝 Códigos de Estado HTTP

- `200` - OK
- `201` - Created
- `400` - Bad Request (datos inválidos)
- `401` - Unauthorized (sin token o token inválido)
- `403` - Forbidden (usuario inactivo)
- `404` - Not Found (recurso no encontrado)
- `500` - Internal Server Error

---

**Última actualización:** 2025-12-27  
**Versión:** 1.0.0
