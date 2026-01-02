# 🔧 Sistema de Configuración de Tokens - ZonoChat

## 📋 Descripción General

ZonoChat ahora utiliza un **sistema de configuración híbrido** para gestionar los tokens y credenciales de los canales de comunicación (Messenger, WhatsApp, Instagram).

### 🎯 Prioridad de Configuración

El sistema sigue esta jerarquía:

1. **🥇 Primera Prioridad: Panel de Administración (Base de Datos)**
   - Configuración almacenada en la tabla `channel_configs`
   - Gestionada desde el panel web de ZonoChat
   - Permite múltiples configuraciones por tipo de canal
   - Activación/desactivación dinámica sin reiniciar el servidor

2. **🥈 Segunda Prioridad: Variables de Entorno (.env)**
   - Fallback automático si no hay configuración en BD
   - Útil para desarrollo y configuración inicial
   - Requiere reiniciar el servidor para aplicar cambios

## 🔄 Cómo Funciona

### Flujo de Configuración

```
┌─────────────────────────────────────┐
│  Solicitud de Configuración         │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  ¿Existe config activa en BD?       │
└─────────────┬───────────────────────┘
              │
        ┌─────┴─────┐
        │           │
       SÍ          NO
        │           │
        ▼           ▼
┌──────────┐  ┌──────────┐
│ Usar BD  │  │ Usar ENV │
└──────────┘  └──────────┘
```

### Ejemplo de Logs

Cuando se usa configuración del panel:
```
✅ Usando configuración de Messenger desde el panel de ZonoChat
```

Cuando se usa configuración del .env:
```
📋 Usando configuración de Messenger desde variables de entorno (.env)
```

## 🛠️ Configuración desde el Panel

### 1. Acceder al Panel de Canales

1. Inicia sesión como administrador
2. Ve a **Configuración** → **Canales**
3. Selecciona el canal que deseas configurar

### 2. Configurar Messenger

**Campos requeridos:**
- `page_access_token`: Token de acceso de la página de Facebook
- `verify_token`: Token de verificación del webhook

**Ejemplo:**
```json
{
  "page_access_token": "EAAxxxxxxxxxxxxx",
  "verify_token": "mi_token_secreto_123"
}
```

### 3. Configurar WhatsApp

**Campos requeridos:**
- `access_token`: Token de acceso de WhatsApp Business API
- `phone_number_id`: ID del número de teléfono
- `verify_token`: Token de verificación del webhook

**Ejemplo:**
```json
{
  "access_token": "EAAxxxxxxxxxxxxx",
  "phone_number_id": "123456789012345",
  "verify_token": "mi_token_whatsapp_456"
}
```

### 4. Configurar Instagram

**Campos requeridos:**
- `access_token`: Token de acceso de Instagram
- `verify_token`: Token de verificación del webhook

**Ejemplo:**
```json
{
  "access_token": "EAAxxxxxxxxxxxxx",
  "verify_token": "mi_token_instagram_789"
}
```

## 📝 Configuración desde .env

Si prefieres usar variables de entorno (o como fallback), configura tu archivo `.env`:

```env
# MESSENGER
MESSENGER_PAGE_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
MESSENGER_VERIFY_TOKEN=mi_token_secreto_123

# WHATSAPP
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=mi_token_whatsapp_456

# INSTAGRAM
INSTAGRAM_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
INSTAGRAM_VERIFY_TOKEN=mi_token_instagram_789
```

## 🔍 Verificar Configuración Activa

### Desde los Logs del Backend

Al iniciar el servidor o recibir webhooks, verás mensajes indicando qué configuración se está usando:

```bash
# Configuración desde panel
✅ Usando configuración de Messenger desde el panel de ZonoChat

# Configuración desde .env
📋 Usando configuración de Messenger desde variables de entorno (.env)

# Error al obtener de BD (usará .env)
⚠️ No se pudo obtener configuración de Messenger desde BD: Connection error
```

### Desde la Base de Datos

```sql
-- Ver todas las configuraciones activas
SELECT id, channel_type, name, is_active, created_at 
FROM channel_configs 
WHERE is_active = true;

-- Ver configuración específica de Messenger
SELECT * FROM channel_configs 
WHERE channel_type = 'messenger' AND is_active = true;
```

## 🎨 Ventajas del Sistema Híbrido

### ✅ Ventajas de usar el Panel (BD)

1. **Sin reiniciar servidor**: Cambios aplicados inmediatamente
2. **Múltiples configuraciones**: Varios canales del mismo tipo
3. **Gestión visual**: Interfaz amigable para administradores
4. **Auditoría**: Registro de quién creó/modificó cada configuración
5. **Activación/desactivación**: Control granular de canales

### ✅ Ventajas de usar .env

1. **Simplicidad**: Configuración rápida para desarrollo
2. **Portabilidad**: Fácil de versionar (con .env.example)
3. **Seguridad**: Variables de entorno protegidas por el sistema
4. **Compatibilidad**: Funciona sin base de datos configurada

## 🔐 Seguridad

### Mejores Prácticas

1. **Nunca commits tokens**: Usa `.gitignore` para `.env`
2. **Tokens únicos**: Usa tokens diferentes para cada entorno
3. **Rotación regular**: Cambia los tokens periódicamente
4. **Permisos mínimos**: Otorga solo los permisos necesarios
5. **HTTPS obligatorio**: Webhooks solo sobre conexiones seguras

### Protección en el Panel

- Los tokens se muestran ofuscados (`***`) en el frontend
- Solo administradores pueden ver/editar configuraciones
- Autenticación JWT requerida para todas las operaciones

## 🚀 Migración

### De .env a Panel

1. Copia tus tokens actuales del `.env`
2. Ve al panel de Canales
3. Crea una nueva configuración con esos tokens
4. Activa la configuración
5. El sistema automáticamente usará la configuración del panel

### De Panel a .env

1. Desactiva la configuración en el panel
2. Asegúrate de tener los tokens en el `.env`
3. Reinicia el servidor
4. El sistema automáticamente usará el `.env`

## 🐛 Troubleshooting

### El webhook no se verifica

**Síntoma**: Error 403 al verificar webhook

**Solución**:
1. Verifica que el `verify_token` coincida en:
   - Panel de ZonoChat (si usas BD)
   - Archivo `.env` (si usas variables de entorno)
   - Configuración de Meta/Facebook
2. Revisa los logs para ver qué configuración se está usando

### Los mensajes no se envían

**Síntoma**: Error al enviar mensajes

**Solución**:
1. Verifica que el token de acceso sea válido
2. Comprueba que el token tenga los permisos necesarios
3. Revisa los logs para ver qué configuración se está usando
4. Verifica que la configuración esté activa en el panel

### Configuración no se aplica

**Síntoma**: Cambios en el panel no tienen efecto

**Solución**:
1. Verifica que la configuración esté marcada como `is_active = true`
2. Revisa los logs para confirmar qué fuente se está usando
3. Si hay error de BD, el sistema usará `.env` como fallback

## 📊 Estructura de Base de Datos

### Tabla: channel_configs

```sql
CREATE TABLE channel_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    channel_type ENUM('messenger', 'whatsapp', 'instagram', 'telegram'),
    name VARCHAR(100) NOT NULL,
    config JSON NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_channel_name (channel_type, name)
);
```

### Ejemplo de registro

```json
{
  "id": 1,
  "channel_type": "messenger",
  "name": "Facebook Page Principal",
  "config": {
    "page_access_token": "EAAxxxxxxxxxxxxx",
    "verify_token": "mi_token_secreto"
  },
  "is_active": true,
  "created_by": 1,
  "created_at": "2026-01-01 14:00:00"
}
```

## 🔄 API Endpoints

### Listar configuraciones
```http
GET /api/channels
Authorization: Bearer {token}
```

### Crear configuración
```http
POST /api/channels
Authorization: Bearer {token}
Content-Type: application/json

{
  "channel_type": "messenger",
  "name": "Mi Página de Facebook",
  "config": {
    "page_access_token": "EAAxxxxxxxxxxxxx",
    "verify_token": "mi_token_secreto"
  }
}
```

### Actualizar configuración
```http
PUT /api/channels/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nuevo nombre",
  "config": { ... },
  "is_active": true
}
```

### Activar/Desactivar
```http
PATCH /api/channels/:id/toggle
Authorization: Bearer {token}
```

## 📚 Referencias

- [Facebook Messenger Platform](https://developers.facebook.com/docs/messenger-platform)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Instagram Messaging API](https://developers.facebook.com/docs/messenger-platform/instagram)
