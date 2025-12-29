# 🎯 Módulo de Configuración de Canales - Guía Completa

## ✅ ¿Qué es esto?

Ahora puedes configurar los canales (Messenger, WhatsApp, Instagram) **desde el dashboard** sin tocar el archivo `.env`.

---

## 📋 Paso 1: Ejecutar Migración de Base de Datos

### Opción A: MySQL Workbench (Recomendado)
1. Abre **MySQL Workbench**
2. Conecta a tu base de datos
3. Abre el archivo:
   ```
   backend/database/migrations/006_create_channel_configs.sql
   ```
4. Ejecuta todo el archivo (Ctrl + Shift + Enter)
5. Deberías ver: "Tabla channel_configs creada exitosamente"

### Opción B: Línea de Comandos
```bash
# Conectar a MySQL
mysql -u root -p

# Seleccionar base de datos
USE zonochat_dev;

# Copiar y pegar el contenido del archivo 006_create_channel_configs.sql
```

---

## 📋 Paso 2: Reiniciar el Backend

El backend ya está actualizado para usar la configuración de la base de datos.

```bash
# En la terminal del backend
# Ctrl + C para detener
npm run dev
```

---

## 🎨 Paso 3: Crear Interfaz en el Frontend (Opcional)

Ya tienes el backend listo. Ahora puedes crear la interfaz en el dashboard.

### API Endpoints Disponibles:

#### 1. **Listar Canales**
```javascript
GET /api/channels
Headers: Authorization: Bearer {token}

Response:
{
  "configs": [
    {
      "id": 1,
      "channel_type": "messenger",
      "name": "Mi Página de Facebook",
      "is_active": true,
      "config": {
        "page_access_token": "EAAxxxxx...",
        "verify_token": "mi_token",
        "page_id": "123456789"
      },
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 2. **Crear Canal**
```javascript
POST /api/channels
Headers: Authorization: Bearer {token}
Body:
{
  "channel_type": "messenger",
  "name": "Mi Página de Facebook",
  "config": {
    "page_access_token": "EAAxxxxx...",
    "verify_token": "mi_token_verificacion",
    "page_id": "123456789",
    "page_name": "Mi Página"
  }
}

Response:
{
  "message": "Canal configurado exitosamente",
  "config": { ... }
}
```

#### 3. **Actualizar Canal**
```javascript
PUT /api/channels/:id
Headers: Authorization: Bearer {token}
Body:
{
  "name": "Nuevo Nombre",
  "config": {
    "page_access_token": "nuevo_token..."
  }
}
```

#### 4. **Activar/Desactivar Canal**
```javascript
PATCH /api/channels/:id/toggle
Headers: Authorization: Bearer {token}

Response:
{
  "message": "Canal activado exitosamente",
  "config": { ... }
}
```

#### 5. **Eliminar Canal**
```javascript
DELETE /api/channels/:id
Headers: Authorization: Bearer {token}
```

---

## 🧪 Paso 4: Probar con Postman o cURL

### Crear Canal de Messenger:

```bash
curl -X POST http://localhost:3000/api/channels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "channel_type": "messenger",
    "name": "Mi Página Principal",
    "config": {
      "page_access_token": "TU_TOKEN_DE_MESSENGER",
      "verify_token": "zonochat_messenger_2024",
      "page_id": "123456789",
      "page_name": "Mi Página"
    }
  }'
```

---

## 🎯 Cómo Funciona

### Prioridad de Configuración:

1. **Base de Datos** (primero)
   - Si existe configuración activa en BD → usa esa
   
2. **Variables de Entorno** (fallback)
   - Si NO hay en BD → usa `.env`

### Ejemplo de Logs:

```
✅ Webhook de Messenger verificado correctamente (config: database)
```

o

```
⚠️ No se pudo obtener config de BD, usando .env
✅ Webhook de Messenger verificado correctamente (config: env)
```

---

## 📝 Estructura de Configuración por Canal

### Messenger:
```json
{
  "page_access_token": "EAAxxxxx...",
  "verify_token": "mi_token_verificacion",
  "page_id": "123456789",
  "page_name": "Nombre de la Página"
}
```

### WhatsApp:
```json
{
  "access_token": "EAAxxxxx...",
  "phone_number_id": "123456789012345",
  "business_account_id": "123456789012345",
  "verify_token": "mi_token_verificacion",
  "phone_number": "+1234567890"
}
```

### Instagram:
```json
{
  "access_token": "EAAxxxxx...",
  "instagram_account_id": "123456789",
  "verify_token": "mi_token_verificacion",
  "username": "@miusuario"
}
```

---

## 🎨 Ejemplo de Interfaz (React)

```jsx
// ChannelConfigPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';

function ChannelConfigPage() {
    const [channels, setChannels] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        channel_type: 'messenger',
        name: '',
        config: {
            page_access_token: '',
            verify_token: '',
            page_id: '',
            page_name: ''
        }
    });

    useEffect(() => {
        loadChannels();
    }, []);

    const loadChannels = async () => {
        const response = await api.get('/channels');
        setChannels(response.data.configs);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/channels', formData);
            alert('Canal configurado exitosamente');
            setShowForm(false);
            loadChannels();
        } catch (error) {
            alert('Error: ' + error.response?.data?.error);
        }
    };

    const toggleChannel = async (id) => {
        await api.patch(`/channels/${id}/toggle`);
        loadChannels();
    };

    return (
        <div>
            <h1>Configuración de Canales</h1>
            
            <button onClick={() => setShowForm(true)}>
                + Nuevo Canal
            </button>

            {/* Lista de canales */}
            <div>
                {channels.map(channel => (
                    <div key={channel.id}>
                        <h3>{channel.name}</h3>
                        <p>Tipo: {channel.channel_type}</p>
                        <p>Estado: {channel.is_active ? 'Activo' : 'Inactivo'}</p>
                        <button onClick={() => toggleChannel(channel.id)}>
                            {channel.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                    </div>
                ))}
            </div>

            {/* Formulario */}
            {showForm && (
                <form onSubmit={handleSubmit}>
                    <select 
                        value={formData.channel_type}
                        onChange={(e) => setFormData({...formData, channel_type: e.target.value})}
                    >
                        <option value="messenger">Messenger</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="instagram">Instagram</option>
                    </select>

                    <input
                        placeholder="Nombre del canal"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />

                    <input
                        placeholder="Page Access Token"
                        value={formData.config.page_access_token}
                        onChange={(e) => setFormData({
                            ...formData,
                            config: {...formData.config, page_access_token: e.target.value}
                        })}
                    />

                    <input
                        placeholder="Verify Token"
                        value={formData.config.verify_token}
                        onChange={(e) => setFormData({
                            ...formData,
                            config: {...formData.config, verify_token: e.target.value}
                        })}
                    />

                    <button type="submit">Guardar</button>
                    <button type="button" onClick={() => setShowForm(false)}>Cancelar</button>
                </form>
            )}
        </div>
    );
}
```

---

## ✅ Ventajas

1. **No tocar .env**: Configura todo desde el dashboard
2. **Múltiples canales**: Puedes tener varios canales del mismo tipo
3. **Activar/Desactivar**: Sin eliminar la configuración
4. **Seguro**: Solo admins pueden configurar
5. **Fallback**: Si falla BD, usa .env automáticamente

---

## 🚀 Por Ahora (Desarrollo)

Puedes seguir usando el `.env` mientras desarrollas. El sistema funciona con ambos:

```env
# Esto sigue funcionando
MESSENGER_PAGE_ACCESS_TOKEN=tu_token
MESSENGER_VERIFY_TOKEN=tu_verify_token
```

**Cuando estés listo**, crea la configuración en la BD y el sistema automáticamente usará esa.

---

## 📞 Próximos Pasos

1. ✅ Ejecutar migración de BD
2. ✅ Reiniciar backend
3. ⏳ Crear interfaz en el dashboard (opcional)
4. ⏳ Migrar tokens de .env a BD (opcional)

**¿Quieres que cree la interfaz completa del dashboard ahora?** 🎨
