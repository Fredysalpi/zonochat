# 🔐 Credenciales de Acceso - ZonoChat

## 📋 Usuarios del Sistema

### 1️⃣ **ADMINISTRADOR**
- **Email:** `admin@zonochat.com`
- **Contraseña:** `admin123`
- **Rol:** Administrador
- **Permisos:** Acceso completo al sistema

### 2️⃣ **SUPERVISOR**
- **Email:** `supervisor@zonochat.com`
- **Contraseña:** `supervisor123`
- **Rol:** Supervisor
- **Permisos:** Gestión de agentes y tickets

### 3️⃣ **AGENTE 1**
- **Email:** `agente1@zonochat.com`
- **Contraseña:** `agente123`
- **Rol:** Agente
- **Permisos:** Gestión de tickets asignados

---

## 🚀 Cómo Crear los Usuarios

### Opción 1: Usando MySQL Workbench o phpMyAdmin
1. Abre MySQL Workbench o phpMyAdmin
2. Selecciona la base de datos `zonochat`
3. Ejecuta el archivo: `database/insert_users.sql`
4. Verifica que los usuarios se crearon correctamente

### Opción 2: Usando la línea de comandos de MySQL
```bash
mysql -u root -p zonochat < database/insert_users.sql
```

### Opción 3: Usando el script de Node.js (requiere credenciales correctas)
```bash
cd backend
node scripts/createUsers.js
```

---

## ⚠️ Notas Importantes

1. **Las contraseñas están hasheadas** usando bcrypt con 10 rounds
2. **Cambiar contraseñas en producción** - Estas son contraseñas de desarrollo
3. **Verificar conexión a MySQL** - Asegúrate de que MySQL esté corriendo
4. **Base de datos** - Debe existir la base de datos `zonochat`

---

## 🔍 Verificar Usuarios Creados

Ejecuta esta consulta en MySQL:

```sql
SELECT id, email, first_name, last_name, role, created_at 
FROM users 
ORDER BY id;
```

---

## 🛠️ Solución de Problemas

### Error: "Access denied for user 'root'"
- Verifica que la contraseña de MySQL sea correcta
- Actualiza las credenciales en `backend/.env`
- O edita el script `createUsers.js` con tus credenciales

### Error: "Table 'zonochat.users' doesn't exist"
- Ejecuta primero el archivo `database/schema.sql`
- Asegúrate de que la base de datos `zonochat` exista

### No puedo iniciar sesión
- Verifica que los usuarios estén en la base de datos
- Revisa que el backend esté corriendo en el puerto 3000
- Verifica la consola del navegador para ver errores

---

## 📞 Contacto

Si tienes problemas, verifica:
1. ✅ MySQL está corriendo
2. ✅ Base de datos `zonochat` existe
3. ✅ Tabla `users` existe
4. ✅ Backend está corriendo (`npm run dev`)
5. ✅ Frontend está corriendo (`npm run dev`)
