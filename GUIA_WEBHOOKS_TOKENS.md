# 📡 GUÍA COMPLETA DE WEBHOOKS Y TOKENS - ZONOCHAT

## 🎯 ENDPOINTS DE WEBHOOKS

### Facebook Messenger
```
Webhook URL: https://tu-dominio.com/api/webhooks/messenger
Verify Token: zonochat_verify_2024 (o el que definas)
```

### Instagram
```
Webhook URL: https://tu-dominio.com/api/webhooks/instagram
Verify Token: zonochat_verify_2024 (o el que definas)
```

### WhatsApp Business
```
Webhook URL: https://tu-dominio.com/api/webhooks/whatsapp
Verify Token: zonochat_verify_2024 (o el que definas)
```

### Telegram
```
Webhook URL: https://tu-dominio.com/api/webhooks/telegram
No requiere verify token (se configura automáticamente)
```

---

## 🔑 CÓMO OBTENER TOKENS

### 1. FACEBOOK MESSENGER

#### Paso 1: Crear App en Meta for Developers
1. Ve a https://developers.facebook.com
2. Clic en "Mis Apps" → "Crear App"
3. Selecciona "Empresa" como tipo de app
4. Completa el nombre y email

#### Paso 2: Agregar Producto Messenger
1. En el panel izquierdo, busca "Messenger"
2. Clic en "Configurar"

#### Paso 3: Obtener Page Access Token
1. Ve a "Configuración de Messenger"
2. En "Tokens de acceso", selecciona tu página de Facebook
3. Copia el **Page Access Token**
   ```
   Ejemplo: EAABsbCS1iHgBO7ZC8VqF9ZAqwZBZCqGxR...
   ```

#### Paso 4: Configurar Webhook
1. Ve a "Webhooks" en Messenger
2. Clic en "Agregar URL de devolución de llamada"
3. **URL de devolución de llamada**: `https://tu-dominio.com/api/webhooks/messenger`
4. **Token de verificación**: `zonochat_verify_2024`
5. **Campos**: Selecciona `messages`, `messaging_postbacks`, `messaging_optins`, `message_deliveries`, `message_reads`
6. Clic en "Verificar y guardar"

#### Paso 5: Suscribir la Página
1. En "Webhooks", selecciona tu página
2. Clic en "Suscribirse"

#### Tokens Necesarios:
```
page_access_token: EAABsbCS1iHgBO7ZC8VqF9ZAqwZBZCqGxR... (de Meta)
verify_token: zonochat_verify_2024 (lo defines tú)
```

---

### 2. INSTAGRAM

#### Paso 1: Requisitos Previos
- Tener una cuenta de Instagram Business o Creator
- Conectar la cuenta de Instagram a una página de Facebook
- Usar la misma App de Facebook creada anteriormente

#### Paso 2: Agregar Producto Instagram
1. En tu App de Facebook, busca "Instagram"
2. Clic en "Configurar"

#### Paso 3: Obtener Access Token
1. Ve a "Configuración básica de Instagram"
2. Genera un **User Access Token** o usa el de la página
3. Copia el token
   ```
   Ejemplo: IGAAdn...AZDZD
   ```

#### Paso 4: Configurar Webhook
1. Ve a "Webhooks" en Instagram
2. Clic en "Editar suscripción"
3. **URL de devolución de llamada**: `https://tu-dominio.com/api/webhooks/instagram`
4. **Token de verificación**: `zonochat_verify_2024`
5. **Campos**: Selecciona `messages`, `messaging_postbacks`, `messaging_optins`
6. Clic en "Verificar y guardar"

#### Paso 5: Suscribir la Cuenta
1. Selecciona tu cuenta de Instagram Business
2. Clic en "Suscribirse"

#### Tokens Necesarios:
```
access_token: IGAAdnDOsdy5lBZAGEwS3RvTV9JWkFH... (de Meta)
verify_token: zonochat_verify_2024 (lo defines tú)
```

---

### 3. WHATSAPP BUSINESS

#### Paso 1: Crear App de WhatsApp Business
1. Ve a https://developers.facebook.com
2. Usa la misma App o crea una nueva
3. Agrega el producto "WhatsApp"

#### Paso 2: Configurar WhatsApp Business
1. Ve a "Configuración de WhatsApp"
2. Agrega un número de teléfono de prueba o conecta tu número de negocio

#### Paso 3: Obtener Tokens
1. **Phone Number ID**: 
   - Ve a "Configuración de API"
   - Copia el "Phone number ID"
   ```
   Ejemplo: 123456789012345
   ```

2. **Access Token**:
   - En "Configuración de API", copia el "Temporary access token"
   - Para producción, genera un "System User Token" permanente
   ```
   Ejemplo: EAABsbCS1iHgBO7ZC8VqF9ZAqwZBZCqGxR...
   ```

#### Paso 4: Configurar Webhook
1. Ve a "Configuración" → "Webhooks"
2. Clic en "Editar"
3. **URL de devolución de llamada**: `https://tu-dominio.com/api/webhooks/whatsapp`
4. **Token de verificación**: `zonochat_verify_2024`
5. **Campos de webhook**: Selecciona `messages`
6. Clic en "Verificar y guardar"

#### Tokens Necesarios:
```
access_token: EAABsbCS1iHgBO7ZC8VqF9ZAqwZBZCqGxR... (de Meta)
phone_number_id: 123456789012345 (de WhatsApp Business)
verify_token: zonochat_verify_2024 (lo defines tú)
```

---

### 4. TELEGRAM

#### Paso 1: Crear Bot
1. Abre Telegram y busca **@BotFather**
2. Envía el comando `/newbot`
3. Sigue las instrucciones:
   - Nombre del bot: `ZonoChat Bot`
   - Username del bot: `zonochat_bot` (debe terminar en "bot")

#### Paso 2: Obtener Bot Token
1. BotFather te dará un **Bot Token**
   ```
   Ejemplo: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
2. **¡GUARDA ESTE TOKEN!** Es el único que necesitas

#### Paso 3: Configurar Webhook (Automático)
El webhook de Telegram se configura automáticamente desde ZonoChat:

**Opción 1 - Desde el Panel:**
1. Ve a Configuración → Canales
2. Agrega un nuevo canal de Telegram
3. Pega el Bot Token
4. El sistema configurará el webhook automáticamente

**Opción 2 - Manualmente:**
```bash
curl -X POST "https://api.telegram.org/bot<TU_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://tu-dominio.com/api/webhooks/telegram"
  }'
```

#### Tokens Necesarios:
```
bot_token: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz (de BotFather)
```

---

## 📋 RESUMEN DE CAMPOS PARA EL PANEL DE ZONOCHAT

### Facebook Messenger
```json
{
  "page_access_token": "EAABsbCS1iHgBO7ZC8VqF9ZAqwZBZCqGxR...",
  "verify_token": "zonochat_verify_2024"
}
```

### Instagram
```json
{
  "access_token": "IGAAdnDOsdy5lBZAGEwS3RvTV9JWkFH...",
  "verify_token": "zonochat_verify_2024"
}
```

### WhatsApp
```json
{
  "access_token": "EAABsbCS1iHgBO7ZC8VqF9ZAqwZBZCqGxR...",
  "phone_number_id": "123456789012345",
  "verify_token": "zonochat_verify_2024"
}
```

### Telegram
```json
{
  "bot_token": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
}
```

---

## 🚀 CONFIGURACIÓN EN ZONOCHAT

### Paso 1: Acceder al Panel
1. Inicia sesión en ZonoChat
2. Ve a **Configuración** → **Canales**

### Paso 2: Agregar Canal
1. Clic en "Agregar Canal"
2. Selecciona el tipo de canal (Messenger, Instagram, WhatsApp, Telegram)
3. Ingresa el nombre del canal (ej: "Messenger Morsalcorp")
4. Pega los tokens correspondientes
5. Clic en "Guardar"

### Paso 3: Verificar
1. El canal debe aparecer como "Activo"
2. Envía un mensaje de prueba desde el canal
3. Debe aparecer en ZonoChat

---

## 🔧 DESARROLLO LOCAL (NGROK)

Para probar en local, necesitas exponer tu servidor:

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto 3000
ngrok http 3000
```

Usa la URL de ngrok como tu dominio:
```
https://abc123.ngrok.io/api/webhooks/messenger
https://abc123.ngrok.io/api/webhooks/instagram
https://abc123.ngrok.io/api/webhooks/whatsapp
https://abc123.ngrok.io/api/webhooks/telegram
```

---

## ⚠️ NOTAS IMPORTANTES

### Facebook/Instagram/WhatsApp:
- Los tokens tienen **fecha de expiración**
- Para producción, usa **System User Tokens** (no expiran)
- Necesitas **HTTPS** (ngrok lo proporciona automáticamente)
- La app debe estar en **modo producción** para usuarios reales

### Telegram:
- El Bot Token **no expira**
- No requiere HTTPS en desarrollo (pero se recomienda)
- Más simple de configurar que Meta

### Seguridad:
- **NUNCA** compartas tus tokens públicamente
- Guarda los tokens en variables de entorno o en la BD encriptada
- Usa el mismo `verify_token` para todos los canales de Meta

---

## 📞 SOPORTE

Si tienes problemas:
1. Verifica que el webhook esté configurado correctamente
2. Revisa los logs del backend (`npm run dev`)
3. Usa la herramienta de prueba de webhooks de Meta
4. Para Telegram, usa `/getWebhookInfo` con BotFather

---

**Última actualización**: 2026-01-01
**Versión**: 1.0.0
