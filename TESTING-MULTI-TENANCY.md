# 🧪 GUÍA DE PRUEBAS - SISTEMA MULTI-TENANCY

## 📋 Checklist de Verificación

### ✅ Pre-requisitos
- [x] Migración de base de datos aplicada
- [x] Servidor backend funcionando
- [x] Ngrok iniciado (para webhooks)

---

## 🔍 Pruebas de API

### 1. Verificar Tenant Demo

```bash
# Obtener información del tenant demo
GET http://localhost:3000/api/tenants/1
Authorization: Bearer <tu_token>
```

**Respuesta esperada:**
```json
{
  "success": true,
  "tenant": {
    "id": 1,
    "name": "Empresa Demo",
    "subdomain": "demo",
    "status": "active",
    "plan": "pro",
    "max_agents": 10,
    "max_tickets_per_month": 1000
  }
}
```

---

### 2. Listar Agentes

```bash
GET http://localhost:3000/api/agents
Authorization: Bearer <tu_token>
```

**Respuesta esperada:**
```json
{
  "success": true,
  "agents": [
    {
      "id": 1,
      "email": "agente@example.com",
      "first_name": "Juan",
      "last_name": "Pérez",
      "role": "agent",
      "assigned_channels": ["messenger", "whatsapp"],
      "max_concurrent_tickets": 5,
      "current_tickets_count": 0,
      "available_slots": 5
    }
  ]
}
```

---

### 3. Crear Nuevo Agente

```bash
POST http://localhost:3000/api/agents
Authorization: Bearer <tu_token>
Content-Type: application/json

{
  "email": "nuevo.agente@demo.com",
  "password": "password123",
  "firstName": "María",
  "lastName": "González",
  "role": "agent",
  "assignedChannels": ["messenger", "instagram"],
  "maxConcurrentTickets": 5
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Agente creado exitosamente",
  "agentId": 4
}
```

---

### 4. Configurar Canal de Messenger

```bash
POST http://localhost:3000/api/channel-config/messenger
Authorization: Bearer <tu_token>
Content-Type: application/json

{
  "page_access_token": "TU_PAGE_ACCESS_TOKEN",
  "verify_token": "mi_token_secreto_123",
  "page_id": "123456789",
  "app_id": "987654321",
  "app_secret": "abcdef123456"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Configuración de messenger guardada correctamente"
}
```

---

### 5. Activar Canal de Messenger

```bash
PATCH http://localhost:3000/api/channel-config/messenger/toggle
Authorization: Bearer <tu_token>
Content-Type: application/json

{
  "isActive": true
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Canal messenger activado"
}
```

---

### 6. Listar Configuraciones de Canales

```bash
GET http://localhost:3000/api/channel-config
Authorization: Bearer <tu_token>
```

**Respuesta esperada:**
```json
{
  "success": true,
  "configs": [
    {
      "id": 1,
      "channel_type": "messenger",
      "is_active": true,
      "config": {
        "page_access_token": "***",
        "verify_token": "mi_token_secreto_123",
        "page_id": "123456789",
        "app_id": "987654321",
        "app_secret": "***"
      }
    }
  ]
}
```

---

## 🎯 Pruebas de Asignación Automática

### Escenario 1: Asignación Normal

**Setup:**
1. Crear 2 agentes con canal "messenger"
2. Configurar límite de 5 tickets por agente

**Prueba:**
1. Enviar 3 mensajes de Messenger
2. Verificar que se asignan automáticamente

**Verificación:**
```sql
SELECT 
    t.id,
    t.ticket_number,
    t.status,
    t.assigned_to,
    CONCAT(u.first_name, ' ', u.last_name) AS agente,
    u.current_tickets_count
FROM tickets t
LEFT JOIN users u ON t.assigned_to = u.id
ORDER BY t.created_at DESC
LIMIT 5;
```

**Resultado esperado:**
- 3 tickets con `status = 'in_progress'`
- Asignados a diferentes agentes
- `current_tickets_count` incrementado

---

### Escenario 2: Cola de Espera

**Setup:**
1. Crear 1 agente con límite de 2 tickets
2. Asignar canal "messenger"

**Prueba:**
1. Enviar 3 mensajes de Messenger
2. Verificar que el tercero va a la cola

**Verificación:**
```sql
-- Ver tickets en cola
SELECT * FROM ticket_queue ORDER BY entered_queue_at DESC;

-- Ver estado de tickets
SELECT 
    t.id,
    t.ticket_number,
    t.status,
    t.assigned_to,
    t.waiting_since
FROM tickets t
ORDER BY t.created_at DESC
LIMIT 5;
```

**Resultado esperado:**
- 2 tickets asignados
- 1 ticket con `status = 'pending'`
- 1 registro en `ticket_queue`

---

### Escenario 3: Liberación de Slot

**Setup:**
1. Tener tickets en cola (del escenario anterior)

**Prueba:**
1. Cerrar uno de los tickets asignados
2. Verificar que el ticket en cola se asigna automáticamente

**Acción:**
```bash
PATCH http://localhost:3000/api/tickets/:id/status
Content-Type: application/json

{
  "status": "resolved"
}
```

**Verificación:**
```sql
-- Verificar que la cola está vacía
SELECT COUNT(*) FROM ticket_queue;

-- Verificar que todos los tickets están asignados
SELECT 
    t.status,
    COUNT(*) as total
FROM tickets t
GROUP BY t.status;
```

**Resultado esperado:**
- Cola vacía
- Ticket que estaba en cola ahora asignado
- `current_tickets_count` del agente actualizado

---

## 🔍 Verificaciones en Base de Datos

### Verificar Estructura de Tablas

```sql
-- Verificar que todas las tablas existen
SHOW TABLES LIKE '%tenant%';
SHOW TABLES LIKE '%channel_config%';
SHOW TABLES LIKE '%ticket_queue%';
SHOW TABLES LIKE '%agent_availability%';

-- Verificar columnas nuevas en users
DESCRIBE users;

-- Verificar columnas nuevas en tickets
DESCRIBE tickets;
```

---

### Verificar Datos de Ejemplo

```sql
-- Ver tenant demo
SELECT * FROM tenants WHERE subdomain = 'demo';

-- Ver usuarios asociados al tenant
SELECT 
    id,
    email,
    tenant_id,
    assigned_channels,
    current_tickets_count,
    max_concurrent_tickets
FROM users
WHERE tenant_id = 1;

-- Ver configuraciones de canales
SELECT 
    channel_type,
    is_active,
    JSON_EXTRACT(config, '$.verify_token') as verify_token
FROM channel_configs
WHERE tenant_id = 1;

-- Ver disponibilidad de agentes
SELECT 
    aa.*,
    CONCAT(u.first_name, ' ', u.last_name) as agente
FROM agent_availability aa
JOIN users u ON aa.user_id = u.id
WHERE aa.tenant_id = 1;
```

---

## 🎨 Pruebas de Límites

### Límite de Agentes

```bash
# 1. Verificar límite actual
GET http://localhost:3000/api/tenants/1/limits

# 2. Intentar crear más agentes del límite
# (Repetir POST /api/agents hasta exceder max_agents)

# 3. Verificar error
```

**Respuesta esperada al exceder límite:**
```json
{
  "error": "Límite de agentes alcanzado",
  "message": "Su plan permite un máximo de 10 agentes"
}
```

---

### Límite de Tickets por Agente

```bash
# 1. Configurar agente con límite de 2 tickets
PUT http://localhost:3000/api/agents/:id
{
  "maxConcurrentTickets": 2
}

# 2. Enviar 3 mensajes
# 3. Verificar que el tercero va a cola
```

---

## 📊 Monitoreo

### Ver Estadísticas del Tenant

```bash
GET http://localhost:3000/api/tenants/1/stats
```

**Respuesta esperada:**
```json
{
  "success": true,
  "stats": {
    "total_agents": 3,
    "online_agents": 2,
    "total_tickets": 15,
    "active_tickets": 5,
    "resolved_tickets": 10,
    "queued_tickets": 0,
    "total_channels": 3,
    "active_channels": 1
  }
}
```

---

### Ver Estadísticas de Agente

```bash
GET http://localhost:3000/api/agents/:id/stats
```

**Respuesta esperada:**
```json
{
  "success": true,
  "stats": {
    "total_tickets": 25,
    "resolved_tickets": 20,
    "active_tickets": 5,
    "avg_resolution_time_minutes": 15.5,
    "tickets_today": 3
  }
}
```

---

## 🐛 Debugging

### Ver Logs del Servidor

```bash
# En la terminal donde corre el backend, buscar:
[Auto-Assign] Intentando asignar ticket...
[Auto-Assign] ✅ Ticket asignado al agente...
[Auto-Assign] ⏳ Ticket agregado a la cola...
[Queue] Procesando cola del tenant...
```

---

### Consultas SQL Útiles

```sql
-- Ver agentes disponibles para un canal
SELECT * FROM v_available_agents 
WHERE JSON_CONTAINS(assigned_channels, '"messenger"');

-- Ver tickets sin asignar
SELECT * FROM tickets WHERE assigned_to IS NULL;

-- Ver cola completa con detalles
SELECT 
    tq.*,
    t.ticket_number,
    c.name as contacto,
    TIMESTAMPDIFF(MINUTE, tq.entered_queue_at, NOW()) as minutos_esperando
FROM ticket_queue tq
JOIN tickets t ON tq.ticket_id = t.id
JOIN contacts c ON t.contact_id = c.id
ORDER BY tq.priority DESC, tq.entered_queue_at ASC;

-- Ver carga de agentes
SELECT 
    CONCAT(u.first_name, ' ', u.last_name) as agente,
    u.current_tickets_count as tickets_activos,
    u.max_concurrent_tickets as maximo,
    (u.max_concurrent_tickets - u.current_tickets_count) as slots_disponibles,
    u.status,
    u.assigned_channels
FROM users u
WHERE u.tenant_id = 1 AND u.role IN ('agent', 'supervisor')
ORDER BY u.current_tickets_count DESC;
```

---

## ✅ Checklist Final

- [ ] Migración ejecutada sin errores
- [ ] Servidor backend arranca correctamente
- [ ] Tenant demo existe en la BD
- [ ] Usuarios tienen tenant_id asignado
- [ ] Se pueden crear nuevos agentes
- [ ] Se puede configurar canal de Messenger
- [ ] Se puede activar/desactivar canales
- [ ] Asignación automática funciona
- [ ] Sistema de cola funciona
- [ ] Límites de agentes se respetan
- [ ] Límites de tickets por agente funcionan
- [ ] Estadísticas se generan correctamente

---

## 🎯 Próximo Paso

Una vez verificado que todo funciona en el backend, el siguiente paso es:

**Crear los componentes frontend:**
1. `TenantManagement.jsx` - Gestión de empresas
2. `ChannelSettings.jsx` - Configuración de canales
3. `AgentManagement.jsx` - Gestión de agentes
4. `TicketQueue.jsx` - Vista de cola de tickets

---

**¡Sistema Multi-Tenancy listo para pruebas! 🚀**
