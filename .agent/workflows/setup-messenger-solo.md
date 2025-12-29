# 🎯 Configuración Rápida - Solo Messenger

## ✅ Lo que ya tienes:
- Token de cliente de Messenger

## 📝 Pasos a seguir:

---

## PASO 1: Configurar el archivo .env (2 minutos)

Abre tu archivo `.env` en:
```
backend/.env
```

Agrega estas líneas (o actualízalas si ya existen):

```env
# ==================== MESSENGER ====================
# Tu token de cliente (Page Access Token)
MESSENGER_PAGE_ACCESS_TOKEN=TU_TOKEN_AQUI

# Token de verificación (lo defines tú - puede ser cualquier texto)
MESSENGER_VERIFY_TOKEN=zonochat_messenger_2024

# ==================== SERVIDOR ====================
# Asegúrate de tener estas también
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Reemplaza**:
- `TU_TOKEN_AQUI` → Tu token de Messenger (el que ya tienes)
- `zonochat_messenger_2024` → Puedes dejarlo así o cambiarlo

**Guarda el archivo** (Ctrl + S)

---

## PASO 2: Reiniciar el Backend (1 minuto)

En la terminal donde está corriendo el backend:

1. **Detener**: Presiona `Ctrl + C`
2. **Reiniciar**: 
```bash
npm run dev
```

3. **Verificar**: Deberías ver:
```
✅ Servidor corriendo en puerto 3000
🔧 Configurando Socket.IO...
```

---

## PASO 3: Instalar ngrok (5 minutos)

ngrok crea un túnel HTTPS para que Messenger pueda enviar mensajes a tu localhost.

### Opción A: Con npm (Recomendado)
```bash
# En una terminal nueva
npm install -g ngrok
```

### Opción B: Descarga directa
1. Ve a https://ngrok.com/download
2. Descarga ngrok para Windows
3. Extrae el archivo `ngrok.exe`
4. Muévelo a una carpeta (ej: `C:\ngrok\`)

---

## PASO 4: Iniciar ngrok (1 minuto)

En una **terminal nueva** (no cierres el backend):

```bash
ngrok http 3000
```

Verás algo como esto:
```
ngrok

Session Status    online
Account           Free
Version           3.x.x
Region            United States (us)
Latency           -
Web Interface     http://127.0.0.1:4040
Forwarding        https://abc123def456.ngrok-free.app -> http://localhost:3000

Connections       ttl     opn     rt1     rt5     p50     p90
                  0       0       0.00    0.00    0.00    0.00
```

📋 **IMPORTANTE**: Copia la URL que empieza con `https://`
Ejemplo: `https://abc123def456.ngrok-free.app`

**Guárdala aquí**:
```
MI_URL_NGROK: https://______________________.ngrok-free.app
```

---

## PASO 5: Configurar Webhook en Meta (5 minutos)

### 5.1 Ir a tu App de Facebook
1. Ve a https://developers.facebook.com/apps
2. Selecciona tu app
3. En el menú lateral, busca **"Messenger"**
4. Click en **"Messenger"** → **"Settings"**

### 5.2 Configurar Webhook
1. Busca la sección **"Webhooks"**
2. Click en **"Add Callback URL"** o **"Edit"**

3. **Completa los campos**:
```
Callback URL: https://TU_URL_NGROK.ngrok-free.app/api/webhooks/messenger

Verify Token: zonochat_messenger_2024
```

**Ejemplo completo**:
```
Callback URL: https://abc123def456.ngrok-free.app/api/webhooks/messenger
Verify Token: zonochat_messenger_2024
```

4. Click **"Verify and Save"**

### 5.3 Verificación
Si todo está bien, verás:
- ✅ **Webhook verificado correctamente**

Si ves un error:
- ❌ Verifica que ngrok esté corriendo
- ❌ Verifica que el backend esté corriendo
- ❌ Verifica que el `VERIFY_TOKEN` en .env coincida exactamente

### 5.4 Suscribirse a Eventos
1. En la misma página, busca **"Webhook Fields"**
2. Marca estas opciones:
   - ✅ `messages`
   - ✅ `messaging_postbacks`
   - ✅ `message_deliveries` (opcional)
   - ✅ `message_reads` (opcional)

3. Click **"Save"**

---

## PASO 6: ¡PROBAR! (2 minutos)

### 6.1 Enviar Mensaje de Prueba

1. Ve a tu **página de Facebook** (la que conectaste a Messenger)
2. Envía un mensaje a la página desde tu cuenta personal
3. **Observa la consola del backend**

Deberías ver:
```
📥 Webhook de Messenger recibido: {...}
📨 Procesando mensaje de Messenger: 123456789
👤 Nuevo contacto creado: 1
🎫 Nuevo ticket creado: 1
💾 Mensaje guardado: 1
```

### 6.2 Ver en ZonoChat

1. Abre ZonoChat en el navegador: `http://localhost:5173`
2. Inicia sesión como agente
3. **Deberías ver el nuevo ticket** con el mensaje de Messenger ✅

### 6.3 Responder desde ZonoChat

1. Abre el ticket
2. Escribe una respuesta
3. Envía el mensaje
4. **Verifica que llegue a Messenger** ✅

---

## 🎉 ¡LISTO!

Si todo funcionó:
- ✅ Recibes mensajes de Messenger en ZonoChat
- ✅ Puedes responder desde ZonoChat
- ✅ Los mensajes llegan al usuario en Messenger

---

## 🔧 Solución de Problemas

### "Webhook verification failed"
**Problema**: El webhook no se verifica

**Soluciones**:
1. Verifica que ngrok esté corriendo:
   ```bash
   # Deberías ver "Forwarding https://..."
   ```

2. Verifica que el backend esté corriendo:
   ```bash
   # Deberías ver "Servidor corriendo en puerto 3000"
   ```

3. Verifica el `VERIFY_TOKEN` en `.env`:
   ```env
   MESSENGER_VERIFY_TOKEN=zonochat_messenger_2024
   ```
   Debe coincidir EXACTAMENTE con el que pusiste en Meta

4. Prueba la URL manualmente:
   ```
   https://TU_URL_NGROK.ngrok-free.app/api/webhooks/messenger?hub.mode=subscribe&hub.verify_token=zonochat_messenger_2024&hub.challenge=test
   ```
   Debería devolver: `test`

---

### "No recibo mensajes"
**Problema**: El webhook está verificado pero no llegan mensajes

**Soluciones**:
1. Verifica que estés suscrito a `messages`:
   - Meta → Messenger → Settings → Webhooks
   - Debe estar marcado ✅ `messages`

2. Verifica los logs del backend:
   ```bash
   # Deberías ver "📥 Webhook de Messenger recibido"
   ```

3. Verifica que el token sea válido:
   - Copia tu token de Messenger
   - Pégalo de nuevo en `.env`
   - Reinicia el backend

---

### "Error al enviar mensaje"
**Problema**: Puedes recibir pero no enviar

**Soluciones**:
1. Verifica el token en `.env`:
   ```env
   MESSENGER_PAGE_ACCESS_TOKEN=TU_TOKEN_AQUI
   ```

2. Verifica que la página tenga permisos:
   - Meta → Messenger → Settings → Access Tokens
   - Debe aparecer tu página con un token

3. Revisa los logs del backend:
   ```bash
   # Busca errores como "Error enviando mensaje"
   ```

---

## 📝 Resumen de URLs

**Backend**: `http://localhost:3000`
**Frontend**: `http://localhost:5173`
**ngrok**: `https://__________.ngrok-free.app`
**Webhook**: `https://__________.ngrok-free.app/api/webhooks/messenger`

---

## ⚠️ Notas Importantes

1. **ngrok debe estar corriendo** mientras pruebas
   - Si cierras ngrok, la URL cambia
   - Tendrás que actualizar el webhook en Meta

2. **El backend debe estar corriendo**
   - `npm run dev` en la carpeta backend

3. **Para producción**:
   - Necesitarás un servidor con dominio
   - SSL (HTTPS) obligatorio
   - Token permanente (no expira)

---

## 🚀 Siguiente Paso

Una vez que Messenger funcione, podemos:
- ✅ Agregar WhatsApp
- ✅ Agregar Instagram
- ✅ Desplegar a producción
- ✅ Configurar tokens permanentes

**¿Messenger ya está funcionando?** 🎉
