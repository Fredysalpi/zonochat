# 🚀 Guía Rápida de Prueba - Backend ZonoChat

## ✅ Pasos para Probar el Backend

### 1. Verificar que MySQL esté corriendo

Asegúrate de que MySQL esté activo en tu sistema.

---

### 2. Configurar Variables de Entorno

Si aún no lo has hecho:

```bash
cd backend
# Ejecutar el script de configuración
setup-env.bat

# O copiar manualmente
copy .env.example .env
# Luego editar .env con tu password de MySQL
```

---

### 3. Crear la Base de Datos

**Opción A - MySQL Workbench:**
1. Abre MySQL Workbench
2. Conecta a tu servidor
3. Abre `database/schema.sql`
4. Ejecuta todo (Ctrl + Shift + Enter)

**Opción B - Línea de comandos:**
```bash
# Desde la raíz del proyecto
mysql -u root -p < database/schema.sql
```

---

### 4. Verificar la Base de Datos

```bash
cd backend
node setup-database.js
```

Deberías ver:
```
✅ Conexión exitosa
✅ Todas las tablas existen
✅ 3 canales configurados
```

---

### 5. Crear Usuario Admin

```bash
node create-admin.js
```

Deberías ver:
```
✅ Usuario creado exitosamente

Email:    admin@zonochat.com
Password: admin123
```

---

### 6. Iniciar el Servidor

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

---

### 7. Probar los Endpoints

#### A. Verificar que el servidor funciona

Abre en tu navegador:
```
http://localhost:3000/
```

Deberías ver:
```json
{
  "message": "🚀 ZonoChat API",
  "version": "1.0.0",
  "status": "running"
}
```

#### B. Verificar la conexión a la base de datos

```
http://localhost:3000/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

---

### 8. Probar la API con Postman o Thunder Client

#### Login

**POST** `http://localhost:3000/api/auth/login`

**Body (JSON):**
```json
{
  "email": "admin@zonochat.com",
  "password": "admin123"
}
```

**Respuesta esperada:**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@zonochat.com",
    "first_name": "Admin",
    "last_name": "ZonoChat",
    "role": "admin"
  }
}
```

**⚠️ IMPORTANTE:** Copia el `token` de la respuesta, lo necesitarás para las siguientes peticiones.

---

#### Obtener Tickets

**GET** `http://localhost:3000/api/tickets`

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
```

**Respuesta esperada:**
```json
{
  "tickets": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "pages": 0
  }
}
```

---

#### Crear un Ticket de Prueba

Primero necesitas crear un contacto manualmente en MySQL:

```sql
USE zonochat;

INSERT INTO contacts (name, phone, email) 
VALUES ('Cliente Prueba', '+1234567890', 'cliente@example.com');
```

Luego crear el ticket:

**POST** `http://localhost:3000/api/tickets`

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json
```

**Body:**
```json
{
  "contact_id": 1,
  "channel_id": 1,
  "subject": "Prueba de ticket",
  "priority": "medium"
}
```

---

#### Enviar un Mensaje

**POST** `http://localhost:3000/api/messages/ticket/1`

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json
```

**Body:**
```json
{
  "content": "Hola, este es un mensaje de prueba",
  "message_type": "text"
}
```

---

#### Obtener Mensajes de un Ticket

**GET** `http://localhost:3000/api/messages/ticket/1`

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
```

---

### 9. Probar WebSocket (Opcional)

Puedes usar una herramienta como [Socket.io Client Tool](https://amritb.github.io/socketio-client-tool/) o crear un archivo HTML simple:

```html
<!DOCTYPE html>
<html>
<head>
    <title>ZonoChat WebSocket Test</title>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
    <h1>ZonoChat WebSocket Test</h1>
    <div id="messages"></div>

    <script>
        const socket = io('http://localhost:3000');

        socket.on('connect', () => {
            console.log('Conectado!', socket.id);
            
            // Unirse a sala de ticket
            socket.emit('ticket:join', 1);
        });

        socket.on('message:new', (message) => {
            console.log('Nuevo mensaje:', message);
            document.getElementById('messages').innerHTML += 
                `<p><strong>Nuevo mensaje:</strong> ${message.content}</p>`;
        });

        socket.on('ticket:updated', (ticket) => {
            console.log('Ticket actualizado:', ticket);
        });
    </script>
</body>
</html>
```

---

## 🐛 Solución de Problemas

### Error: "Cannot connect to MySQL"
- Verifica que MySQL esté corriendo
- Verifica las credenciales en `.env`
- Verifica que el puerto sea el correcto (default: 3306)

### Error: "Database 'zonochat' does not exist"
- Ejecuta el script de base de datos: `mysql -u root -p < database/schema.sql`

### Error: "Port 3000 already in use"
- Cambia el puerto en `.env`: `PORT=3001`
- O detén el proceso que está usando el puerto 3000

### Error: "Token inválido"
- Asegúrate de incluir el header `Authorization: Bearer {token}`
- Verifica que el token no haya expirado (duración: 7 días)
- Haz login nuevamente para obtener un token nuevo

---

## 📚 Documentación Adicional

- **API Completa:** Ver `docs/API.md`
- **Instalación Detallada:** Ver `INSTALLATION.md`
- **Progreso del Proyecto:** Ver `PROJECT_PROGRESS.md`

---

## ✅ Checklist de Verificación

- [ ] MySQL corriendo
- [ ] Base de datos creada
- [ ] Variables de entorno configuradas
- [ ] Usuario admin creado
- [ ] Servidor iniciado correctamente
- [ ] Endpoint `/health` responde OK
- [ ] Login funciona y retorna token
- [ ] Puedo obtener tickets con el token
- [ ] Puedo crear tickets
- [ ] Puedo enviar mensajes

---

**¡Listo!** Si todos los pasos funcionan, el backend está completamente operativo. 🎉

Próximo paso: Desarrollar el frontend del Dashboard.
