# 📋 GUÍA DE MIGRACIONES - ZONOCHAT MULTI-TENANCY

## 🚀 INICIO RÁPIDO

### 1. Ejecutar migraciones iniciales

```bash
cd backend
node run-migrations.js
```

Esto creará:
- ✅ Base de datos `zonochat_master`
- ✅ Tablas: `tenants`, `master_users`, `tenant_activity_logs`
- ✅ Tenant demo: `zonochat_demo`
- ✅ Usuario admin: `admin@demo.com` / `admin123`

### 2. Crear un nuevo tenant

```bash
node run-migrations.js --create-tenant \
  --subdomain empresa1 \
  --name "Mi Empresa" \
  --email admin@empresa1.com \
  --password mipassword123
```

### 3. Listar todos los tenants

```bash
node run-migrations.js --list
```

### 4. Ejecutar migraciones en un tenant específico

```bash
node run-migrations.js --tenant empresa1
```

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
backend/
├── migrations/
│   ├── 001_create_master_database.sql    # Crea BD master y tablas
│   └── 002_add_channel_configs.sql       # Agrega tabla de configs de canales
├── run-migrations.js                      # Script para ejecutar migraciones
└── schema.sql                             # Schema principal (ya existe)
```

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### Base de Datos Master: `zonochat_master`

Contiene información de todos los tenants:

**Tabla: `tenants`**
- Información de cada empresa/cliente
- Subdomain único
- Nombre de su BD
- Plan y límites
- Estado (active, trial, suspended)

**Tabla: `master_users`**
- Usuarios para login inicial
- Vinculados a un tenant
- Roles: super_admin, tenant_admin

**Tabla: `tenant_activity_logs`**
- Logs de actividad por tenant
- Auditoría de acciones

### Bases de Datos de Tenants: `zonochat_XXXX`

Cada tenant tiene su propia BD con:
- Todas las tablas del `schema.sql` original
- Tabla adicional: `channel_configs`

**Tabla: `channel_configs`**
- Configuraciones de canales (Messenger, WhatsApp, etc.)
- Tokens y credenciales
- Estado activo/inactivo

---

## 🔐 CONFIGURACIÓN DE CANALES

### Estructura JSON por canal:

#### Messenger
```json
{
  "page_access_token": "EAAxxxxxxxxxxxxx",
  "verify_token": "mi_token_secreto_123",
  "page_id": "123456789012345",
  "app_id": "987654321098765",
  "app_secret": "abcdef1234567890"
}
```

#### WhatsApp (Meta Business)
```json
{
  "phone_number_id": "123456789012345",
  "business_account_id": "987654321098765",
  "access_token": "EAAxxxxxxxxxxxxx",
  "verify_token": "mi_token_secreto_123"
}
```

#### Instagram
```json
{
  "instagram_account_id": "123456789012345",
  "access_token": "EAAxxxxxxxxxxxxx",
  "verify_token": "mi_token_secreto_123"
}
```

---

## 🧪 TESTING

### 1. Verificar que la BD master existe

```bash
mysql -u root -p -e "SHOW DATABASES LIKE 'zonochat_%';"
```

### 2. Verificar tenants creados

```bash
mysql -u root -p zonochat_master -e "SELECT * FROM tenants;"
```

### 3. Verificar tabla channel_configs en un tenant

```bash
mysql -u root -p zonochat_demo -e "DESCRIBE channel_configs;"
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Backup antes de migrar**
   ```bash
   mysqldump -u root -p --all-databases > backup_$(date +%Y%m%d).sql
   ```

2. **Variables de entorno requeridas**
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`

3. **Seguridad**
   - Cambiar contraseñas por defecto
   - Usar contraseñas fuertes en producción
   - No commitear credenciales al repositorio

4. **Rollback**
   - Guardar backups antes de cada migración
   - Tener plan de rollback documentado

---

## 🔄 PRÓXIMOS PASOS

Después de ejecutar las migraciones:

1. ✅ Implementar middleware de tenant
2. ✅ Crear servicio de configuración de canales
3. ✅ Actualizar controladores para usar BD
4. ✅ Crear panel de configuración en frontend
5. ✅ Probar en local
6. ✅ Desplegar en producción

---

## 📞 SOPORTE

Si encuentras algún error:
1. Verifica las variables de entorno
2. Revisa los logs de MySQL
3. Asegúrate de tener permisos CREATE DATABASE
4. Verifica que bcrypt esté instalado: `npm install bcrypt`
