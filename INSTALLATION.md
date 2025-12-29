# 🚀 Guía de Instalación - ZonoChat

Esta guía te ayudará a poner en marcha el proyecto ZonoChat en tu máquina local.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 18 o superior ([Descargar](https://nodejs.org/))
- **MySQL** 8 o superior ([Descargar](https://dev.mysql.com/downloads/))
- **npm** o **yarn** (viene con Node.js)
- **Git** (opcional, para control de versiones)

## 🗄️ Paso 1: Configurar la Base de Datos

### 1.1 Crear la base de datos

Abre tu cliente MySQL (MySQL Workbench, phpMyAdmin, o línea de comandos) y ejecuta:

```bash
mysql -u root -p < database/schema.sql
```

O manualmente:
1. Abre el archivo `database/schema.sql`
2. Copia todo el contenido
3. Ejecútalo en tu cliente MySQL

Esto creará:
- Base de datos `zonochat`
- Todas las tablas necesarias
- Vistas, triggers y datos de ejemplo

### 1.2 Verificar la instalación

```sql
USE zonochat;
SHOW TABLES;
```

Deberías ver las siguientes tablas:
- users
- channels
- contacts
- tickets
- messages
- ticket_assignments
- quick_replies
- notes
- agent_status_log

## ⚙️ Paso 2: Configurar el Backend

### 2.1 Navegar a la carpeta backend

```bash
cd backend
```

### 2.2 Instalar dependencias

```bash
npm install
```

### 2.3 Configurar variables de entorno

Copia el archivo de ejemplo:

```bash
copy .env.example .env
```

Edita el archivo `.env` y configura tus credenciales:

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=zonochat
DB_PORT=3306

# JWT
JWT_SECRET=cambia_esto_por_algo_super_seguro_y_aleatorio

# Servidor
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**IMPORTANTE:** Cambia `JWT_SECRET` por una cadena aleatoria y segura.

### 2.4 Iniciar el servidor backend

```bash
npm run dev
```

Deberías ver:

```
╔════════════════════════════════════════╗
║     🚀 ZONOCHAT API INICIADO 🚀       ║
╠════════════════════════════════════════╣
║  Puerto:        3000                   ║
║  Entorno:       development            ║
║  URL:           http://localhost:3000  ║
╚════════════════════════════════════════╝
```

### 2.5 Verificar que funciona

Abre tu navegador y ve a: `http://localhost:3000/health`

Deberías ver:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "..."
}
```

## 🎨 Paso 3: Configurar el Frontend

### 3.1 Abrir una nueva terminal

Deja el backend corriendo y abre una nueva terminal.

### 3.2 Navegar a la carpeta frontend

```bash
cd frontend
```

### 3.3 Instalar dependencias

```bash
npm install
```

### 3.4 Iniciar el servidor de desarrollo

```bash
npm run dev
```

Deberías ver:

```
  VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 3.5 Abrir la aplicación

Abre tu navegador y ve a: `http://localhost:5173`

¡Deberías ver la página de login de ZonoChat! 🎉

## 🔐 Paso 4: Iniciar Sesión

Usa las credenciales de demostración:

- **Email:** `admin@zonochat.com`
- **Password:** `admin123`

**NOTA:** Estas credenciales son de ejemplo. Para que funcionen, necesitas actualizar el hash de la contraseña en la base de datos.

### Generar hash de contraseña

Ejecuta este código en Node.js:

```javascript
const bcrypt = require('bcryptjs');
const password = 'admin123';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
```

Luego actualiza la base de datos:

```sql
UPDATE users 
SET password = 'TU_HASH_GENERADO' 
WHERE email = 'admin@zonochat.com';
```

## ✅ Verificación Final

Si todo está funcionando correctamente:

- ✅ Backend corriendo en `http://localhost:3000`
- ✅ Frontend corriendo en `http://localhost:5173`
- ✅ Base de datos conectada
- ✅ Puedes ver la página de login

## 🐛 Solución de Problemas

### Error: "Cannot connect to MySQL"

- Verifica que MySQL esté corriendo
- Verifica las credenciales en `.env`
- Verifica que la base de datos `zonochat` exista

### Error: "Port 3000 already in use"

- Cambia el puerto en `.env`:
  ```env
  PORT=3001
  ```

### Error: "Cannot find module"

- Ejecuta `npm install` nuevamente
- Elimina `node_modules` y ejecuta `npm install`

### La página de login no carga

- Verifica que el frontend esté corriendo
- Abre la consola del navegador (F12) para ver errores
- Verifica que el backend esté respondiendo en `/health`

## 📚 Próximos Pasos

Una vez que tengas todo funcionando:

1. Lee `PROJECT_PROGRESS.md` para ver el estado del proyecto
2. Revisa `README.md` para la documentación general
3. Explora el código en `backend/src` y `frontend/src`

## 🆘 Ayuda

Si tienes problemas:

1. Revisa los logs del backend y frontend
2. Verifica que todas las dependencias estén instaladas
3. Consulta `PROJECT_PROGRESS.md` para ver qué está implementado

---

**¡Listo para desarrollar! 🚀**

Consulta el archivo `PROJECT_PROGRESS.md` para ver qué funcionalidades están pendientes y en qué puedes trabajar.
