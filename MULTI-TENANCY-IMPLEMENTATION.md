# 🏢 GUÍA DE IMPLEMENTACIÓN MULTI-TENANCY

## 📋 Resumen de Cambios Implementados

Se ha implementado un sistema **Multi-Tenancy completo** para ZonoChat con las siguientes características:

### ✅ Características Implementadas

1. **Sistema Multi-Tenant**
   - Tabla `tenants` para gestionar múltiples empresas
   - Cada empresa tiene su propio subdomain, plan y límites
   - Aislamiento completo de datos entre empresas

2. **Gestión de Agentes**
   - Asignación de canales específicos a cada agente
   - Límite configurable de tickets simultáneos (por defecto 5)
   - Contador automático de tickets activos
   - Sistema de disponibilidad en tiempo real

3. **Sistema de Cola Automática**
   - Tickets en espera cuando no hay agentes disponibles
   - Asignación automática al liberar slots
   - Priorización por urgencia y tiempo de espera
   - Procesamiento inteligente de la cola

4. **Configuración de Canales en BD**
   - Tokens y credenciales almacenados en base de datos
   - Configuración por tenant (no global en .env)
   - Soporte para: Messenger, WhatsApp, Instagram, Telegram
   - Activación/desactivación dinámica de canales

5. **Panel de Administración**
   - Crear y gestionar empresas (tenants)
   - Crear agentes y asignarles canales
   - Configurar credenciales de canales
   - Ver estadísticas y límites

---

## 🗄️ Cambios en Base de Datos

### Nuevas Tablas

1. **`tenants`** - Empresas/Organizaciones
2. **`channel_configs`** - Configuración de canales por tenant
3. **`ticket_queue`** - Cola de tickets en espera
4. **`agent_availability`** - Disponibilidad de agentes

### Tablas Modificadas

1. **`users`**
   - `tenant_id` - Relación con empresa
   - `assigned_channels` - JSON con canales asignados
   - `current_tickets_count` - Contador de tickets activos

2. **`channels`**
   - `tenant_id` - Relación con empresa

3. **`tickets`**
   - `queue_position` - Posición en cola
   - `waiting_since` - Tiempo en espera

### Procedimientos Almacenados

1. **`sp_auto_assign_ticket`** - Asignación automática
2. **`sp_release_agent_slot`** - Liberar slot de agente
3. **`sp_process_queue`** - Procesar cola de tickets

### Vistas

1. **`v_available_agents`** - Agentes disponibles
2. **`v_tenant_stats`** - Estadísticas por tenant

---

## 🚀 Pasos de Instalación

### 1. Aplicar Migración de Base de Datos

```bash
cd backend
node migrations/apply-multi-tenancy.js
```

Este script:
- Crea todas las tablas nuevas
- Modifica las tablas existentes
- Crea procedimientos y vistas
- Genera un tenant de ejemplo "demo"
- Asocia usuarios existentes al tenant demo

### 2. Reiniciar el Servidor Backend

```bash
# Detener el servidor actual (Ctrl+C)
npm run dev
```

### 3. Verificar las Nuevas Rutas

El servidor ahora tiene estas rutas adicionales:

#### Gestión de Tenants
- `GET /api/tenants` - Listar todos los tenants
- `POST /api/tenants` - Crear nuevo tenant
- `GET /api/tenants/:id` - Obtener tenant
- `PUT /api/tenants/:id` - Actualizar tenant
- `GET /api/tenants/:id/stats` - Estadísticas
- `GET /api/tenants/:id/limits` - Verificar límites

#### Configuración de Canales
- `GET /api/channel-config` - Listar configuraciones
- `GET /api/channel-config/:type` - Obtener configuración
- `POST /api/channel-config/:type` - Guardar configuración
- `PATCH /api/channel-config/:type/toggle` - Activar/Desactivar
- `POST /api/channel-config/:type/test` - Probar configuración

#### Gestión de Agentes
- `GET /api/agents` - Listar agentes
- `POST /api/agents` - Crear agente
- `PUT /api/agents/:id` - Actualizar agente
- `GET /api/agents/:id/stats` - Estadísticas del agente
- `GET /api/agents/available/:channelType` - Agentes disponibles

---

## 📱 Uso del Sistema

### Crear una Nueva Empresa

```javascript
POST /api/tenants
{
  "name": "Mi Empresa",
  "subdomain": "miempresa",
  "plan": "pro",
  "maxAgents": 10,
  "adminEmail": "admin@miempresa.com",
  "adminPassword": "password123"
}
```

### Crear un Agente

```javascript
POST /api/agents
{
  "email": "agente@miempresa.com",
  "password": "password123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "role": "agent",
  "assignedChannels": ["messenger", "whatsapp"],
  "maxConcurrentTickets": 5
}
```

### Configurar Canal de Messenger

```javascript
POST /api/channel-config/messenger
{
  "page_access_token": "EAAxxxxx...",
  "verify_token": "mi_token_secreto",
  "page_id": "123456789",
  "app_id": "987654321",
  "app_secret": "abcdef123456"
}
```

### Activar Canal

```javascript
PATCH /api/channel-config/messenger/toggle
{
  "isActive": true
}
```

---

## 🔄 Flujo de Asignación Automática

### Cuando llega un nuevo ticket:

1. **Sistema busca agente disponible:**
   - Que tenga el canal asignado (ej: messenger)
   - Que esté online o away
   - Que tenga slots disponibles (< 5 tickets)
   - Con menor carga actual

2. **Si encuentra agente:**
   - ✅ Asigna ticket inmediatamente
   - Incrementa contador del agente
   - Registra asignación automática
   - Notifica al agente vía WebSocket

3. **Si NO encuentra agente:**
   - ⏳ Agrega ticket a la cola
   - Marca ticket como "pending"
   - Registra tiempo de espera
   - Espera a que se libere un slot

4. **Cuando un agente cierra un ticket:**
   - Decrementa su contador
   - Procesa la cola automáticamente
   - Asigna siguiente ticket en espera

---

## 🎨 Componentes Frontend a Crear

### 1. Panel de Gestión de Empresas
**Archivo:** `frontend/src/components/admin/TenantManagement.jsx`

Funcionalidades:
- Listar todas las empresas
- Crear nueva empresa
- Editar empresa existente
- Ver estadísticas por empresa
- Verificar límites y uso

### 2. Panel de Configuración de Canales
**Archivo:** `frontend/src/components/settings/ChannelSettings.jsx`

Funcionalidades:
- Tabs para cada canal (Messenger, WhatsApp, Instagram)
- Formularios para ingresar tokens y credenciales
- Botón de activar/desactivar
- Botón de probar configuración
- Indicador de estado del canal

### 3. Panel de Gestión de Agentes
**Archivo:** `frontend/src/components/admin/AgentManagement.jsx`

Funcionalidades:
- Listar agentes del tenant
- Crear nuevo agente
- Asignar canales a agentes
- Configurar límite de tickets
- Ver estadísticas del agente
- Activar/desactivar agentes

### 4. Vista de Cola de Tickets
**Archivo:** `frontend/src/components/supervisor/TicketQueue.jsx`

Funcionalidades:
- Mostrar tickets en espera
- Tiempo de espera de cada ticket
- Prioridad visual
- Asignación manual desde la cola
- Estadísticas de la cola

---

## 🔐 Seguridad

### Tokens Sensibles
- Los tokens se almacenan en la BD (tabla `channel_configs`)
- Las APIs nunca retornan tokens completos (se ocultan con ***)
- Solo usuarios con rol `admin` pueden ver/editar configuraciones

### Control de Acceso
- Cada usuario está asociado a un tenant
- Solo puede ver/editar datos de su tenant
- Super admins pueden gestionar todos los tenants

### Validaciones
- Subdomain único por tenant
- Email único por usuario
- Verificación de límites antes de crear agentes
- Validación de configuración antes de activar canales

---

## 📊 Monitoreo y Estadísticas

### Métricas Disponibles

**Por Tenant:**
- Total de agentes
- Agentes online
- Tickets activos
- Tickets en cola
- Canales activos

**Por Agente:**
- Tickets manejados
- Tickets activos
- Tiempo promedio de resolución
- Disponibilidad

**Sistema de Cola:**
- Tickets en espera
- Tiempo promedio de espera
- Tasa de asignación automática

---

## 🧪 Testing

### Probar Asignación Automática

1. Crear 2 agentes con canal "messenger"
2. Configurar límite de 2 tickets por agente
3. Enviar 5 mensajes de Messenger
4. Verificar:
   - Primeros 4 tickets se asignan automáticamente
   - Quinto ticket va a la cola
   - Al cerrar un ticket, el de la cola se asigna

### Probar Límites de Tenant

1. Crear tenant con `max_agents: 2`
2. Crear 2 agentes
3. Intentar crear tercer agente
4. Verificar que retorna error de límite alcanzado

---

## 🐛 Troubleshooting

### Error: "Usuario no asociado a ningún tenant"
**Solución:** Ejecutar la migración para asociar usuarios existentes

### Error: "Límite de agentes alcanzado"
**Solución:** Actualizar el plan del tenant o eliminar agentes inactivos

### Tickets no se asignan automáticamente
**Verificar:**
1. Agentes tienen el canal asignado
2. Agentes están online
3. Agentes tienen slots disponibles
4. Revisar logs del servidor

---

## 📝 Próximos Pasos

1. ✅ Aplicar migración de BD
2. ✅ Reiniciar backend
3. 🔲 Crear componentes frontend
4. 🔲 Probar flujo completo
5. 🔲 Configurar canales reales
6. 🔲 Crear agentes de producción
7. 🔲 Monitorear asignaciones

---

## 💡 Consejos

- **Desarrollo:** Usa el tenant "demo" para pruebas
- **Producción:** Crea un tenant por cada cliente real
- **Canales:** Configura solo los canales que realmente uses
- **Agentes:** Asigna canales específicos según expertise
- **Límites:** Ajusta según el plan de cada cliente

---

## 🆘 Soporte

Si encuentras problemas:
1. Revisa los logs del servidor
2. Verifica la configuración de la BD
3. Consulta esta guía
4. Revisa el código de los servicios

---

**¡El sistema Multi-Tenancy está listo para usar! 🎉**
