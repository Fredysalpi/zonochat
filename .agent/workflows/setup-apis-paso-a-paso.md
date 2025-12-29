# 🎯 Guía Paso a Paso - Configuración de APIs

## 📍 ESTÁS AQUÍ: Configuración Inicial

Vamos a configurar las APIs de WhatsApp, Messenger e Instagram paso a paso.

---

## PASO 1: Crear Cuenta en Meta for Developers (5 minutos)

### 1.1 Ir a Facebook Developers
🔗 **URL**: https://developers.facebook.com/

### 1.2 Iniciar Sesión
- Usa tu cuenta de Facebook personal
- Si no tienes, créala primero

### 1.3 Crear Nueva App
1. Click en "Mis Apps" (esquina superior derecha)
2. Click en "Crear App"
3. Selecciona tipo: **"Business"**
4. Click "Siguiente"

### 1.4 Información de la App
```
Nombre de la app: ZonoChat
Email de contacto: tu@email.com
Cuenta de empresa: [Crear nueva si no tienes]
```

5. Click "Crear App"
6. **Completa la verificación de seguridad** (captcha)

✅ **LISTO**: Ya tienes tu app creada

---

## PASO 2: Configurar WhatsApp Business API (10 minutos)

### 2.1 Agregar Producto WhatsApp
1. En el panel de tu app, busca "WhatsApp"
2. Click en "Configurar" o "Set up"

### 2.2 Obtener Número de Prueba
Meta te da un número de WhatsApp de prueba GRATIS para empezar:

1. Ve a **WhatsApp → Getting Started**
2. Verás un número como: `+1 555 025 3483`
3. **IMPORTANTE**: Agrega tu número personal para recibir mensajes de prueba
   - Click en "Add phone number"
   - Ingresa tu WhatsApp personal
   - Recibirás un código de verificación
   - Ingrésalo

### 2.3 Obtener Tokens (IMPORTANTE - COPIA ESTOS VALORES)

En la misma página "Getting Started":

**A. Access Token (Temporal - 24 horas)**
```
Busca: "Temporary access token"
Copia el token que empieza con: EAAxxxxxxxxx...
```

📋 **Guárdalo aquí**:
```
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxx...
```

**B. Phone Number ID**
```
Busca: "Phone number ID"
Copia el número (solo dígitos)
```

📋 **Guárdalo aquí**:
```
WHATSAPP_PHONE_NUMBER_ID=123456789012345
```

**C. WhatsApp Business Account ID**
```
Busca: "WhatsApp Business Account ID"
Copia el número
```

📋 **Guárdalo aquí**:
```
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
```

### 2.4 Probar Envío de Mensaje

En la misma página, hay una sección "Send and receive messages":

1. Selecciona tu número personal (el que agregaste)
2. Click en "Send message"
3. **Deberías recibir un mensaje de WhatsApp** ✅

Si lo recibes, ¡WhatsApp está funcionando! 🎉

---

## PASO 3: Configurar Messenger (5 minutos)

### 3.1 Agregar Producto Messenger
1. En tu app, busca "Messenger"
2. Click en "Configurar"

### 3.2 Conectar Página de Facebook

**IMPORTANTE**: Necesitas una página de Facebook (no perfil personal)

**Si NO tienes página**:
1. Ve a https://www.facebook.com/pages/create
2. Crea una página (ej: "ZonoChat Soporte")
3. Completa la información básica

**Si YA tienes página**:
1. En Messenger Settings → "Access Tokens"
2. Click "Add or Remove Pages"
3. Selecciona tu página
4. Otorga los permisos necesarios

### 3.3 Obtener Page Access Token

1. En "Access Tokens", selecciona tu página
2. Click "Generate Token"
3. Acepta los permisos
4. **Copia el token**

📋 **Guárdalo aquí**:
```
MESSENGER_PAGE_ACCESS_TOKEN=EAAxxxxxxxxx...
```

### 3.4 Probar Messenger

1. Ve a tu página de Facebook
2. Envíate un mensaje a ti mismo
3. Deberías verlo en la bandeja de entrada de la página ✅

---

## PASO 4: Configurar Instagram (5 minutos)

### 4.1 Requisitos Previos

**IMPORTANTE**: Necesitas:
- ✅ Cuenta de Instagram **Business** (no personal)
- ✅ Conectada a una página de Facebook

**Convertir cuenta personal a Business**:
1. Abre Instagram en tu teléfono
2. Ve a Configuración → Cuenta
3. "Cambiar a cuenta profesional"
4. Selecciona "Empresa"
5. Conecta con tu página de Facebook

### 4.2 Agregar Producto Instagram

1. En tu app de Facebook, busca "Instagram"
2. Click en "Configurar"
3. Conecta tu cuenta de Instagram Business

### 4.3 Obtener Access Token

1. Ve a Instagram → Settings
2. Genera un token de acceso
3. **Copia el token**

📋 **Guárdalo aquí**:
```
INSTAGRAM_ACCESS_TOKEN=EAAxxxxxxxxx...
```

---

## PASO 5: Configurar tu archivo .env (2 minutos)

Abre tu archivo `.env` en:
```
backend/.env
```

Agrega/actualiza estas líneas con TUS valores:

```env
# WhatsApp
WHATSAPP_ACCESS_TOKEN=TU_TOKEN_AQUI
WHATSAPP_PHONE_NUMBER_ID=TU_PHONE_ID_AQUI
WHATSAPP_BUSINESS_ACCOUNT_ID=TU_ACCOUNT_ID_AQUI
WHATSAPP_VERIFY_TOKEN=mi_token_secreto_123

# Messenger
MESSENGER_PAGE_ACCESS_TOKEN=TU_TOKEN_AQUI
MESSENGER_VERIFY_TOKEN=mi_token_secreto_456

# Instagram
INSTAGRAM_ACCESS_TOKEN=TU_TOKEN_AQUI
INSTAGRAM_VERIFY_TOKEN=mi_token_secreto_789
```

**NOTA**: Los `VERIFY_TOKEN` los defines TÚ (pueden ser cualquier texto)

---

## PASO 6: Probar Localmente con ngrok (10 minutos)

### 6.1 Instalar ngrok

**Windows**:
```bash
# Opción 1: Con npm
npm install -g ngrok

# Opción 2: Descargar
# Ve a https://ngrok.com/download
# Descarga y extrae ngrok.exe
```

### 6.2 Iniciar ngrok

```bash
# En una terminal nueva (NO cierres el backend)
ngrok http 3000
```

Verás algo como:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

📋 **Copia esa URL**: `https://abc123.ngrok.io`

### 6.3 Configurar Webhooks en Meta

#### WhatsApp:
1. Ve a tu app → WhatsApp → Configuration
2. Click "Edit" en Webhook
3. **Callback URL**: `https://abc123.ngrok.io/api/webhooks/whatsapp`
4. **Verify Token**: `mi_token_secreto_123` (el que pusiste en .env)
5. Click "Verify and Save"
6. Suscríbete a: `messages`

#### Messenger:
1. Ve a Messenger → Settings → Webhooks
2. **Callback URL**: `https://abc123.ngrok.io/api/webhooks/messenger`
3. **Verify Token**: `mi_token_secreto_456`
4. Click "Verify and Save"
5. Suscríbete a: `messages`, `messaging_postbacks`

#### Instagram:
1. Ve a Instagram → Configuration
2. **Callback URL**: `https://abc123.ngrok.io/api/webhooks/instagram`
3. **Verify Token**: `mi_token_secreto_789`
4. Click "Verify and Save"
5. Suscríbete a: `messages`

---

## PASO 7: ¡PROBAR! (5 minutos)

### 7.1 Probar WhatsApp

1. Envía un mensaje de WhatsApp al número de prueba de Meta
2. Deberías ver en la consola del backend:
   ```
   📥 Webhook de WhatsApp recibido
   📨 Procesando mensaje de: +123456789
   💾 Mensaje guardado
   ```
3. El mensaje debería aparecer en tu dashboard de ZonoChat ✅

### 7.2 Probar Messenger

1. Envía un mensaje a tu página de Facebook
2. Verifica los logs del backend
3. El mensaje debería aparecer en ZonoChat ✅

### 7.3 Probar Instagram

1. Envía un DM a tu cuenta de Instagram Business
2. Verifica los logs
3. El mensaje debería aparecer en ZonoChat ✅

---

## 🎉 ¡FELICIDADES!

Si todo funcionó, ahora tienes:
- ✅ WhatsApp recibiendo mensajes
- ✅ Messenger recibiendo mensajes
- ✅ Instagram recibiendo mensajes
- ✅ Todo sincronizado en tiempo real

---

## 🚨 Problemas Comunes

### "Webhook verification failed"
- ✅ Verifica que el `VERIFY_TOKEN` en .env coincida exactamente
- ✅ Verifica que ngrok esté corriendo
- ✅ Verifica que el backend esté corriendo

### "No recibo mensajes"
- ✅ Verifica que el webhook esté suscrito a `messages`
- ✅ Revisa los logs del backend: `npm run dev`
- ✅ Verifica que el token de acceso sea válido

### "Token expirado"
- Los tokens temporales expiran en 24 horas
- Necesitas crear un token permanente (ver guía de producción)

---

## 📞 ¿Necesitas Más Ayuda?

Dime en qué paso estás y te ayudo específicamente:

1. ¿Ya creaste la app en Facebook Developers?
2. ¿Ya obtuviste los tokens de WhatsApp?
3. ¿Ya configuraste el .env?
4. ¿Ya instalaste ngrok?
5. ¿Ya configuraste los webhooks?
6. ¿Qué error específico estás viendo?

**Comparte tu pantalla o el error que ves y te ayudo a resolverlo** 🚀
