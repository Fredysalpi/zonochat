# 💬 ZonoChat

Sistema de gestión de conversaciones omnicanal con multi-agentes, inspirado en Laraigo.

## 🌟 Características

- 📱 **Multi-canal**: WhatsApp, Facebook Messenger, Instagram
- 🎫 **Sistema de Tickets**: Gestión organizada de conversaciones
- 👥 **Multi-agente**: Asignación automática y manual de conversaciones
- ⚡ **Tiempo Real**: Actualizaciones instantáneas con WebSocket
- 📊 **Dashboard**: Métricas y supervisión en tiempo real
- 🤖 **IA (Futuro)**: Respuestas automáticas inteligentes

## 🛠️ Stack Tecnológico

### Backend
- Node.js + Express
- MySQL
- Socket.io
- JWT Authentication

### Frontend
- React 18
- React Router
- Socket.io Client
- Modern CSS

## 📁 Estructura del Proyecto

```
zonochat/
├── backend/              # Servidor Node.js
│   ├── src/
│   │   ├── config/      # Configuraciones
│   │   ├── controllers/ # Lógica de negocio
│   │   ├── models/      # Modelos de datos
│   │   ├── routes/      # Rutas API
│   │   ├── services/    # Servicios externos
│   │   ├── middleware/  # Middleware
│   │   ├── sockets/     # WebSocket handlers
│   │   └── agents/      # Sistema multi-agente
│   └── package.json
├── frontend/            # Aplicación React
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── pages/       # Páginas
│   │   ├── services/    # API calls
│   │   ├── context/     # Context API
│   │   └── utils/       # Utilidades
│   └── package.json
├── database/            # Scripts SQL
│   └── schema.sql
└── docs/               # Documentación
```

## 🚀 Instalación

### Prerrequisitos
- Node.js 18+
- MySQL 8+
- npm o yarn

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configurar variables de entorno
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Base de Datos
```bash
mysql -u root -p < database/schema.sql
```

## 🔧 Configuración

### Variables de Entorno

Crear archivo `.env` en la carpeta `backend/`:

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=zonochat

# JWT
JWT_SECRET=tu_secreto_super_seguro

# WhatsApp Business API
WHATSAPP_API_TOKEN=tu_token
WHATSAPP_PHONE_ID=tu_phone_id
WHATSAPP_VERIFY_TOKEN=tu_verify_token

# Facebook/Instagram
FB_APP_ID=tu_app_id
FB_APP_SECRET=tu_app_secret
FB_PAGE_ACCESS_TOKEN=tu_page_token

# Servidor
PORT=3000
NODE_ENV=development
```

## 📖 Documentación

- **[PROJECT_PROGRESS.md](./PROJECT_PROGRESS.md)**: Estado y progreso del proyecto
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)**: Documentación técnica detallada
- **[API.md](./docs/API.md)**: Documentación de endpoints

## 🤝 Contribución

Este es un proyecto en desarrollo activo. Consulta `PROJECT_PROGRESS.md` para ver el estado actual.

## 📝 Licencia

Proyecto privado - Todos los derechos reservados

## 👨‍💻 Autor

Desarrollado con ❤️ usando Antigravity AI

---

**Última actualización:** 2025-12-27
