# 🚀 Guía de Despliegue a Producción - ZonoChat

## 📋 Tabla de Contenidos
1. [Preparación del Servidor](#preparación-del-servidor)
2. [APIs y Webhooks](#apis-y-webhooks)
3. [Configuración de WhatsApp Business API](#whatsapp-business-api)
4. [Configuración de Facebook Messenger](#facebook-messenger)
5. [Configuración de Instagram](#instagram)
6. [Despliegue del Backend](#despliegue-del-backend)
7. [Despliegue del Frontend](#despliegue-del-frontend)
8. [Configuración de Webhooks](#configuración-de-webhooks)
9. [Testing y Verificación](#testing-y-verificación)

---

## 1. Preparación del Servidor

### Requisitos del Servidor
- **VPS/Cloud**: DigitalOcean, AWS, Google Cloud, o similar
- **Sistema Operativo**: Ubuntu 20.04 LTS o superior
- **Recursos Mínimos**:
  - 2 GB RAM
  - 2 vCPUs
  - 50 GB SSD
  - Ancho de banda ilimitado

### Software Necesario
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar MySQL
sudo apt install -y mysql-server

# Instalar Nginx
sudo apt install -y nginx

# Instalar PM2 (gestor de procesos)
sudo npm install -g pm2

# Instalar Certbot (SSL gratuito)
sudo apt install -y certbot python3-certbot-nginx
```

### Configurar MySQL
```bash
# Asegurar MySQL
sudo mysql_secure_installation

# Crear base de datos
sudo mysql -u root -p
```

```sql
CREATE DATABASE zonochat_production;
CREATE USER 'zonochat'@'localhost' IDENTIFIED BY 'TU_PASSWORD_SEGURA';
GRANT ALL PRIVILEGES ON zonochat_production.* TO 'zonochat'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 2. APIs y Webhooks

### ¿Qué es un Webhook?
Un webhook es una URL que las plataformas (WhatsApp, Messenger, Instagram) llaman cuando ocurre un evento (mensaje nuevo, estado de entrega, etc.).

**Flujo**:
```
Usuario envía mensaje en WhatsApp
    ↓
WhatsApp Business API recibe el mensaje
    ↓
WhatsApp hace POST a tu webhook: https://tudominio.com/api/webhooks/whatsapp
    ↓
Tu backend procesa el mensaje
    ↓
Tu backend responde al usuario
```

### Requisitos para Webhooks
- ✅ **HTTPS obligatorio** (certificado SSL)
- ✅ **URL pública** (no localhost)
- ✅ **Respuesta rápida** (< 20 segundos)
- ✅ **Verificación de firma** (seguridad)

---

## 3. WhatsApp Business API

### Opción 1: Meta Cloud API (Recomendado - GRATIS)

#### Paso 1: Crear Cuenta de Meta for Developers
1. Ve a https://developers.facebook.com/
2. Crea una cuenta o inicia sesión
3. Crea una nueva aplicación
4. Selecciona "Business" como tipo

#### Paso 2: Configurar WhatsApp Business API
1. En tu app, agrega el producto "WhatsApp"
2. Ve a "WhatsApp" → "Getting Started"
3. Copia tu **Access Token** temporal
4. Copia tu **Phone Number ID**
5. Copia tu **WhatsApp Business Account ID**

#### Paso 3: Obtener Token Permanente
```bash
# El token temporal expira en 24 horas
# Necesitas crear un System User para token permanente

1. Ve a Meta Business Suite: https://business.facebook.com/
2. Configuración → Usuarios del sistema
3. Crear usuario del sistema
4. Asignar activos (tu app de WhatsApp)
5. Generar token con permisos:
   - whatsapp_business_messaging
   - whatsapp_business_management
```

#### Paso 4: Configurar Webhook
```javascript
// En tu backend, crea el endpoint de verificación
// backend/src/routes/webhooks.js

router.get('/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Token que defines tú (ej: "mi_token_secreto_123")
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('✅ Webhook verificado');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Recibir mensajes
router.post('/whatsapp', async (req, res) => {
    try {
        const body = req.body;
        
        // Verificar que es de WhatsApp
        if (body.object === 'whatsapp_business_account') {
            // Procesar cada entrada
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    if (change.field === 'messages') {
                        const message = change.value.messages[0];
                        const from = message.from; // Número del usuario
                        const text = message.text?.body; // Texto del mensaje
                        
                        // Aquí procesas el mensaje
                        await processWhatsAppMessage(from, text, message);
                    }
                }
            }
        }
        
        res.sendStatus(200);
    } catch (error) {
        console.error('Error en webhook WhatsApp:', error);
        res.sendStatus(500);
    }
});
```

#### Paso 5: Enviar Mensajes
```javascript
// Función para enviar mensajes de WhatsApp
async function sendWhatsAppMessage(to, message) {
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
            body: message
        }
    };
    
    const response = await axios.post(url, data, {
        headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });
    
    return response.data;
}
```

### Opción 2: Twilio (De Pago - Más Fácil)

#### Configuración Twilio
1. Crea cuenta en https://www.twilio.com/
2. Ve a "Messaging" → "Try it Out" → "Try WhatsApp"
3. Obtén tu **Account SID** y **Auth Token**
4. Configura tu número de WhatsApp

```javascript
// Instalar SDK
npm install twilio

// Enviar mensaje
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendWhatsAppMessage(to, message) {
    const msg = await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${to}`,
        body: message
    });
    return msg;
}

// Webhook
router.post('/whatsapp', async (req, res) => {
    const from = req.body.From.replace('whatsapp:', '');
    const message = req.body.Body;
    
    await processWhatsAppMessage(from, message);
    
    res.sendStatus(200);
});
```

---

## 4. Facebook Messenger

### Paso 1: Configurar App de Facebook
1. En tu app de Facebook Developers
2. Agrega el producto "Messenger"
3. Ve a "Messenger" → "Settings"

### Paso 2: Generar Page Access Token
1. Conecta una página de Facebook
2. Genera un **Page Access Token**
3. Guárdalo de forma segura

### Paso 3: Configurar Webhook
```javascript
// Verificación
router.get('/messenger', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.MESSENGER_VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Recibir mensajes
router.post('/messenger', async (req, res) => {
    const body = req.body;
    
    if (body.object === 'page') {
        for (const entry of body.entry) {
            for (const event of entry.messaging) {
                if (event.message) {
                    const senderId = event.sender.id;
                    const message = event.message.text;
                    
                    await processMessengerMessage(senderId, message);
                }
            }
        }
    }
    
    res.sendStatus(200);
});

// Enviar mensaje
async function sendMessengerMessage(recipientId, message) {
    const url = `https://graph.facebook.com/v18.0/me/messages`;
    
    const data = {
        recipient: { id: recipientId },
        message: { text: message }
    };
    
    await axios.post(url, data, {
        params: { access_token: process.env.MESSENGER_PAGE_ACCESS_TOKEN }
    });
}
```

### Paso 4: Suscribir Webhook
1. En Messenger Settings → Webhooks
2. Callback URL: `https://tudominio.com/api/webhooks/messenger`
3. Verify Token: El que definiste en `.env`
4. Suscribirse a eventos:
   - `messages`
   - `messaging_postbacks`
   - `message_deliveries`
   - `message_reads`

---

## 5. Instagram

### Paso 1: Configurar Instagram Business Account
1. Necesitas una cuenta de Instagram Business
2. Conectada a una página de Facebook
3. En tu app, agrega "Instagram"

### Paso 2: Configurar Webhook (Similar a Messenger)
```javascript
router.post('/instagram', async (req, res) => {
    const body = req.body;
    
    if (body.object === 'instagram') {
        for (const entry of body.entry) {
            for (const change of entry.changes) {
                if (change.field === 'messages') {
                    const message = change.value.messages[0];
                    const from = message.from.id;
                    const text = message.text;
                    
                    await processInstagramMessage(from, text);
                }
            }
        }
    }
    
    res.sendStatus(200);
});

// Enviar mensaje
async function sendInstagramMessage(recipientId, message) {
    const url = `https://graph.facebook.com/v18.0/me/messages`;
    
    const data = {
        recipient: { id: recipientId },
        message: { text: message }
    };
    
    await axios.post(url, data, {
        params: { access_token: process.env.INSTAGRAM_ACCESS_TOKEN }
    });
}
```

---

## 6. Despliegue del Backend

### Paso 1: Preparar Código
```bash
# En tu servidor
cd /var/www
git clone https://github.com/tu-usuario/zonochat.git
cd zonochat/backend

# Instalar dependencias
npm install --production
```

### Paso 2: Configurar Variables de Entorno
```bash
# Crear archivo .env
nano .env
```

```env
# Base de datos
DB_HOST=localhost
DB_USER=zonochat
DB_PASSWORD=TU_PASSWORD_SEGURA
DB_NAME=zonochat_production
DB_PORT=3306

# JWT
JWT_SECRET=TU_JWT_SECRET_MUY_SEGURO_Y_LARGO

# Server
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://tudominio.com

# WhatsApp (Meta Cloud API)
WHATSAPP_ACCESS_TOKEN=tu_access_token
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=tu_business_account_id
WHATSAPP_VERIFY_TOKEN=mi_token_secreto_123

# Messenger
MESSENGER_PAGE_ACCESS_TOKEN=tu_page_access_token
MESSENGER_VERIFY_TOKEN=mi_token_secreto_messenger

# Instagram
INSTAGRAM_ACCESS_TOKEN=tu_instagram_access_token
INSTAGRAM_VERIFY_TOKEN=mi_token_secreto_instagram
```

### Paso 3: Ejecutar Migraciones
```bash
# Importar esquema de base de datos
mysql -u zonochat -p zonochat_production < database/schema.sql
```

### Paso 4: Iniciar con PM2
```bash
# Iniciar aplicación
pm2 start src/server.js --name zonochat-backend

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
```

---

## 7. Despliegue del Frontend

### Paso 1: Build de Producción
```bash
cd /var/www/zonochat/frontend

# Configurar variables de entorno
nano .env.production
```

```env
VITE_API_URL=https://api.tudominio.com
VITE_SOCKET_URL=https://api.tudominio.com
```

```bash
# Build
npm install
npm run build
```

### Paso 2: Configurar Nginx
```bash
sudo nano /etc/nginx/sites-available/zonochat
```

```nginx
# Frontend
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    
    root /var/www/zonochat/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}

# Backend API
server {
    listen 80;
    server_name api.tudominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/zonochat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Paso 3: Configurar SSL (HTTPS)
```bash
# Obtener certificado SSL gratuito
sudo certbot --nginx -d tudominio.com -d www.tudominio.com -d api.tudominio.com

# Renovación automática
sudo certbot renew --dry-run
```

---

## 8. Configuración de Webhooks

### Configurar en Meta for Developers

#### WhatsApp
1. Ve a tu app → WhatsApp → Configuration
2. Webhook URL: `https://api.tudominio.com/api/webhooks/whatsapp`
3. Verify Token: El que pusiste en `.env` (`WHATSAPP_VERIFY_TOKEN`)
4. Suscribirse a: `messages`
5. Click "Verify and Save"

#### Messenger
1. Ve a tu app → Messenger → Settings → Webhooks
2. Callback URL: `https://api.tudominio.com/api/webhooks/messenger`
3. Verify Token: `MESSENGER_VERIFY_TOKEN`
4. Suscribirse a: `messages`, `messaging_postbacks`
5. Click "Verify and Save"

#### Instagram
1. Ve a tu app → Instagram → Configuration
2. Webhook URL: `https://api.tudominio.com/api/webhooks/instagram`
3. Verify Token: `INSTAGRAM_VERIFY_TOKEN`
4. Suscribirse a: `messages`
5. Click "Verify and Save"

---

## 9. Testing y Verificación

### Test de WhatsApp
```bash
# Enviar mensaje de prueba
curl -X POST "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "TU_NUMERO_DE_PRUEBA",
    "type": "text",
    "text": {
      "body": "Hola desde ZonoChat!"
    }
  }'
```

### Test de Webhook
```bash
# Verificar que tu webhook responde
curl "https://api.tudominio.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=mi_token_secreto_123&hub.challenge=test123"

# Debería devolver: test123
```

### Monitoreo
```bash
# Ver logs del backend
pm2 logs zonochat-backend

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 📝 Checklist Final

- [ ] Servidor configurado con Node.js, MySQL, Nginx
- [ ] Base de datos creada e importada
- [ ] Variables de entorno configuradas
- [ ] Backend desplegado con PM2
- [ ] Frontend compilado y servido por Nginx
- [ ] SSL configurado (HTTPS)
- [ ] App de Facebook creada
- [ ] WhatsApp Business API configurada
- [ ] Messenger configurado
- [ ] Instagram configurado
- [ ] Webhooks verificados y funcionando
- [ ] Tests de envío/recepción exitosos

---

## 🆘 Solución de Problemas

### Webhook no verifica
- ✅ Verifica que la URL sea HTTPS
- ✅ Verifica que el verify_token coincida
- ✅ Revisa logs: `pm2 logs zonochat-backend`

### No recibe mensajes
- ✅ Verifica que el webhook esté suscrito a `messages`
- ✅ Verifica que el token de acceso sea válido
- ✅ Revisa logs del servidor

### Error de CORS
- ✅ Verifica `FRONTEND_URL` en `.env`
- ✅ Verifica configuración de CORS en `server.js`

---

## 📚 Recursos Útiles

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Messenger Platform Docs](https://developers.facebook.com/docs/messenger-platform)
- [Instagram Messaging API](https://developers.facebook.com/docs/messenger-platform/instagram)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
