# ========================================
# GUIA RAPIDA DE CONFIGURACION - ZONOCHAT
# ========================================

## PASO 1: Configurar Variables de Entorno

1. Abre una terminal en la carpeta `backend`
2. Ejecuta: `setup-env.bat`
3. Ingresa tu password de MySQL (o deja vacío si no tiene)

O manualmente:
1. Copia el archivo `.env.example` a `.env`
2. Edita `.env` y configura tu password de MySQL en `DB_PASSWORD`

---

## PASO 2: Crear la Base de Datos

### Opción A: Usando MySQL Workbench (Recomendado)
1. Abre MySQL Workbench
2. Conecta a tu servidor MySQL
3. Abre el archivo `database/schema.sql`
4. Ejecuta todo el script (Ctrl + Shift + Enter)

### Opción B: Usando phpMyAdmin
1. Abre phpMyAdmin
2. Ve a la pestaña "SQL"
3. Copia y pega el contenido de `database/schema.sql`
4. Haz clic en "Ejecutar"

### Opción C: Línea de comandos
```bash
# Si MySQL está en el PATH
mysql -u root -p < database/schema.sql

# Si usas XAMPP
C:\xampp\mysql\bin\mysql -u root -p < database/schema.sql

# Si usas WAMP
C:\wamp64\bin\mysql\mysql8.0.X\bin\mysql -u root -p < database/schema.sql
```

---

## PASO 3: Crear Usuario de Prueba

Después de crear la base de datos, necesitas crear un usuario para poder iniciar sesión.

### Opción A: Usando el script de Node.js

1. Asegúrate de tener el archivo `.env` configurado
2. Ejecuta: `node create-admin.js`

### Opción B: Manualmente en MySQL

Ejecuta este SQL en MySQL:

```sql
USE zonochat;

-- Crear usuario admin (password: admin123)
INSERT INTO users (email, password, first_name, last_name, role, status) 
VALUES (
    'admin@zonochat.com',
    '$2a$10$YQiQVJ5pYQK5yF5.rF5lAO7hHqZ5nZ5nZ5nZ5nZ5nZ5nZ5nZ5nZ5n',
    'Admin',
    'ZonoChat',
    'admin',
    'online'
);
```

**NOTA:** El hash de arriba es un ejemplo. Usa el script `create-admin.js` para generar el hash correcto.

---

## PASO 4: Iniciar el Backend

```bash
cd backend
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

## PASO 5: Iniciar el Frontend

En otra terminal:

```bash
cd frontend
npm run dev
```

Deberías ver:
```
  VITE v5.0.8  ready in XXX ms
  ➜  Local:   http://localhost:5173/
```

---

## PASO 6: Abrir la Aplicación

Abre tu navegador y ve a: http://localhost:5173

Usa las credenciales:
- Email: admin@zonochat.com
- Password: admin123

---

## PROBLEMAS COMUNES

### "Cannot connect to MySQL"
- Verifica que MySQL esté corriendo
- Verifica el password en `.env`
- Verifica que la base de datos `zonochat` exista

### "Port 3000 already in use"
- Cambia el puerto en `.env`: `PORT=3001`
- O detén el proceso que está usando el puerto 3000

### "Token inválido" al hacer login
- Verifica que el hash de la contraseña sea correcto
- Usa el script `create-admin.js` para crear el usuario

### MySQL no está en el PATH
- Busca la carpeta de instalación de MySQL
- Ejemplo XAMPP: `C:\xampp\mysql\bin\`
- Ejemplo WAMP: `C:\wamp64\bin\mysql\mysql8.0.X\bin\`
- Usa la ruta completa en los comandos

---

## VERIFICAR QUE TODO FUNCIONA

1. Backend: http://localhost:3000/health
   - Debería responder: `{"status":"healthy","database":"connected"}`

2. Frontend: http://localhost:5173
   - Debería mostrar la página de login

3. Login: Ingresa credenciales y verifica que funcione

---

¿Necesitas ayuda? Revisa:
- `INSTALLATION.md` - Guía detallada
- `PROJECT_PROGRESS.md` - Estado del proyecto
- `RESUMEN.md` - Resumen ejecutivo
