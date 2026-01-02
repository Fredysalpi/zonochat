# 🚀 ZonoChat - Sistema Omnicanal de Atención al Cliente

Sistema de atención al cliente multi-agente con soporte para múltiples canales de comunicación (Messenger, Instagram, WhatsApp, Telegram).

## ✨ Características

- 💬 **Multi-Canal**: Messenger, Instagram, WhatsApp, Telegram
- 👥 **Multi-Agente**: Gestión de múltiples agentes con asignación automática
- 🎫 **Sistema de Tickets**: Gestión completa de conversaciones
- 📊 **Panel de Supervisor**: Monitoreo en tiempo real
- 🔔 **Notificaciones**: Contador de mensajes no leídos
- 👤 **Avatares**: Visualización de fotos de perfil
- ⚡ **Tiempo Real**: WebSocket para actualizaciones instantáneas
- 🎨 **UI Moderna**: Interfaz inspirada en Laraigo

## 🛠️ Tecnologías

### Backend
- Node.js + Express
- MySQL
- Socket.IO
- JWT Authentication
- Multer (uploads)

### Frontend
- React + Vite
- Socket.IO Client
- Axios
- CSS Moderno

## 📋 Requisitos Previos

- Node.js 16+
- MySQL 8+
- Cuenta de Meta for Developers (para Messenger/Instagram/WhatsApp)
- Bot de Telegram (opcional)

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/zonochat.git
cd zonochat
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env`:

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=zonochat

# JWT
JWT_SECRET=tu_secret_key_muy_segura

# URLs
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Messenger (opcional)
MESSENGER_PAGE_ACCESS_TOKEN=tu_token
MESSENGER_VERIFY_TOKEN=zonochat_verify_2024

# Instagram (opcional)
INSTAGRAM_ACCESS_TOKEN=tu_token
INSTAGRAM_VERIFY_TOKEN=zonochat_verify_2024

# WhatsApp (opcional)
WHATSAPP_ACCESS_TOKEN=tu_token
WHATSAPP_PHONE_NUMBER_ID=tu_phone_id
WHATSAPP_VERIFY_TOKEN=zonochat_verify_2024

# Telegram (opcional)
TELEGRAM_BOT_TOKEN=tu_bot_token
```

Importar base de datos:

```bash
mysql -u root -p < database/schema.sql
```

### 3. Configurar Frontend

```bash
cd frontend
npm install
```

Crear archivo `.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### 4. Iniciar Aplicación

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## 📱 Configuración de Canales

### Messenger

1. Crea una app en [Meta for Developers](https://developers.facebook.com)
2. Agrega el producto "Messenger"
3. Configura el webhook:
   - URL: `https://tu-dominio.com/api/webhooks/messenger`
   - Verify Token: `zonochat_verify_2024`
4. Suscribe tu página al webhook

### Instagram

1. En la misma app de Meta, agrega "Instagram"
2. Conecta tu cuenta de Instagram Business
3. Configura el webhook:
   - URL: `https://tu-dominio.com/api/webhooks/instagram`
   - Verify Token: `zonochat_verify_2024`
4. Solicita permisos `instagram_manage_messages`

### WhatsApp

1. Agrega el producto "WhatsApp" a tu app
2. Configura el webhook:
   - URL: `https://tu-dominio.com/api/webhooks/whatsapp`
   - Verify Token: `zonochat_verify_2024`
3. Obtén el Phone Number ID y Access Token

### Telegram

1. Crea un bot con [@BotFather](https://t.me/BotFather)
2. Obtén el Bot Token
3. Configura el webhook automáticamente desde ZonoChat

## 📚 Documentación

- [Guía de Webhooks y Tokens](GUIA_WEBHOOKS_TOKENS.md)
- [Sistema de Asignación Automática](ASIGNACION_AUTOMATICA.md)
- [Configuración de Tokens](CONFIGURACION_TOKENS.md)
- [Permisos de Instagram](INSTAGRAM_PERMISOS.md)

## 🔐 Usuarios por Defecto

```
Admin:
Email: admin@zonochat.com
Password: admin123

Agente:
Email: agent@zonochat.com
Password: agent123
```

**⚠️ IMPORTANTE**: Cambia estas contraseñas en producción.

## 🏗️ Estructura del Proyecto

```
zonochat/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuración (DB, etc)
│   │   ├── controllers/    # Controladores
│   │   │   ├── webhooks/   # Webhooks de canales
│   │   │   └── ...
│   │   ├── models/         # Modelos de datos
│   │   ├── routes/         # Rutas de API
│   │   ├── middleware/     # Middleware (auth, etc)
│   │   └── server.js       # Servidor principal
│   ├── uploads/            # Archivos subidos
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── services/       # Servicios (API, WebSocket)
│   │   ├── App.jsx         # Componente principal
│   │   └── main.jsx        # Punto de entrada
│   └── package.json
├── database/
│   └── schema.sql          # Esquema de BD
└── README.md
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 👨‍💻 Autor

**Fredy Salpiandroid**

## 🙏 Agradecimientos

- Inspirado en Laraigo
- Construido con ❤️ para mejorar la atención al cliente

---

**⭐ Si este proyecto te fue útil, dale una estrella en GitHub!**
