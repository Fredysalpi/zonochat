# 🔧 Solución para el problema de Messenger

## 🔴 Problemas identificados:

1. **Error 400 al obtener info de usuario** - El PAGE_ACCESS_TOKEN no es válido o no tiene permisos
2. **Verificación fallida (403)** - El VERIFY_TOKEN no coincide o hay un problema de configuración

## ✅ Solución paso a paso:

### 1. Verificar y actualizar el PAGE_ACCESS_TOKEN

#### Opción A: Generar un nuevo token (Recomendado)

1. Ve a: https://developers.facebook.com/apps
2. Selecciona tu aplicación
3. En el menú lateral, ve a **Messenger** → **Configuración**
4. Busca la sección **"Tokens de acceso"**
5. Selecciona tu página de Facebook
6. Haz clic en **"Generar token"**
7. **IMPORTANTE**: Copia el token completo (empieza con `EAAA...`)
8. Actualiza tu archivo `.env`:

```env
MESSENGER_PAGE_ACCESS_TOKEN=EAAA... (tu token completo aquí)
MESSENGER_VERIFY_TOKEN=mi_token_secreto_123
```

#### Opción B: Verificar el token actual

Si ya tienes un token, verifica que:
- No haya espacios al inicio o al final
- Esté completo (no cortado)
- No haya expirado

### 2. Configurar el Webhook correctamente

1. Ve a: https://developers.facebook.com/apps
2. Selecciona tu aplicación
3. Ve a **Messenger** → **Configuración**
4. En la sección **Webhooks**, haz clic en **"Editar URL de devolución de llamada"**

**Configuración:**
- **URL de devolución de llamada**: `https://vinously-superobedient-mildred.ngrok-free.dev/api/webhooks/messenger`
- **Token de verificación**: `mi_token_secreto_123` (el mismo que está en tu .env)

5. Haz clic en **"Verificar y guardar"**

### 3. Suscribir a los eventos necesarios

En la misma página de Webhooks, asegúrate de que estos campos estén **marcados**:

- ✅ `messages`
- ✅ `messaging_postbacks`
- ✅ `message_deliveries`
- ✅ `message_reads`

### 4. Reiniciar el backend

Después de actualizar el `.env`:

```bash
# Detén el servidor (Ctrl+C en la terminal del backend)
# Luego inicia nuevamente:
npm run dev
```

### 5. Probar nuevamente

1. Envía un mensaje desde Messenger a tu página
2. Observa los logs del backend
3. Deberías ver:
   ```
   📥 Webhook de Messenger recibido: {...}
   📨 Procesando mensaje de Messenger: [sender_id]
   👤 Nuevo contacto creado: [contact_id]
   🎫 Nuevo ticket creado: [ticket_id]
   💾 Mensaje guardado: [message_id]
   📡 Emitiendo mensaje por Socket.IO a sala: ticket:[ticket_id]
   ✅ Mensaje emitido correctamente
   ```

## 🔍 Verificar que el token funciona

Puedes probar tu token con este comando:

```bash
node test-facebook-token.js
```

(Voy a crear este script para ti)

## ⚠️ Notas importantes:

1. **El token de página es diferente al token de usuario**
   - Necesitas el **Page Access Token**, no el User Access Token
   
2. **El token puede expirar**
   - Los tokens de corta duración expiran en 1 hora
   - Los tokens de larga duración expiran en 60 días
   - Considera generar un token de larga duración

3. **Permisos necesarios**
   - Tu app debe tener el permiso `pages_messaging`
   - La página debe estar vinculada a tu app

## 🆘 Si sigue sin funcionar:

1. Verifica que tu app de Facebook esté en modo **"Desarrollo"** o **"Producción"**
2. Asegúrate de que tu usuario sea administrador de la página
3. Revisa que la página esté conectada a la app en **Messenger** → **Configuración**
