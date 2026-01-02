# 🏢 GUÍA DE MULTI-TENANCY PARA ZONOCHAT

## 📌 ÍNDICE
1. [Arquitectura Multi-Tenancy](#arquitectura)
2. [Cambios en Base de Datos](#base-de-datos)
3. [Implementación Backend](#backend)
4. [Panel de Configuración](#panel)
5. [Deployment en Hosting](#deployment)
6. [Variables de Entorno en Producción](#env-produccion)

---

## 🏗️ ARQUITECTURA MULTI-TENANCY

### **Modelo Elegido: Database-per-Tenant (Recomendado para SaaS)**

Cada empresa (tenant) tendrá:
- ✅ Su propia base de datos
- ✅ Sus propios tokens de API (Messenger, WhatsApp, Instagram)
- ✅ Sus propios usuarios y agentes
- ✅ Aislamiento completo de datos

### **Alternativa: Shared Database con Tenant ID**
- Todas las empresas comparten la misma BD
- Cada tabla tiene un campo `tenant_id`
- Más económico pero menos seguro

---

## 💾 CAMBIOS EN BASE DE DATOS

### **1. Crear tabla de Tenants (Empresas)**

```sql
CREATE TABLE tenants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    database_name VARCHAR(100) UNIQUE NOT NULL,
    status ENUM('active', 'suspended', 'trial') DEFAULT 'trial',
    plan ENUM('free', 'basic', 'pro', 'enterprise') DEFAULT 'free',
    max_agents INT DEFAULT 5,
    max_tickets_per_month INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    settings JSON,
    UNIQUE KEY unique_subdomain (subdomain)
);
```

### **2. Crear tabla de Configuración de Canales (por Tenant)**

```sql
-- Esta tabla va en CADA base de datos de tenant
CREATE TABLE channel_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    channel_type ENUM('messenger', 'whatsapp', 'instagram', 'telegram') NOT NULL,
    is_active BOOLEAN DEFAULT true,
    config JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_channel (channel_type)
);

-- Ejemplo de config JSON para Messenger:
-- {
--   "page_access_token": "EAAxxxxx",
--   "verify_token": "mi_token_secreto",
--   "page_id": "123456789",
--   "app_id": "987654321",
--   "app_secret": "abcdef123456"
-- }
```

### **3. Tabla de Usuarios Master (para login inicial)**

```sql
-- Esta tabla está en la BD principal (master)
CREATE TABLE master_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tenant_id INT NOT NULL,
    role ENUM('super_admin', 'tenant_admin') DEFAULT 'tenant_admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

---

## 🔧 IMPLEMENTACIÓN BACKEND

### **1. Crear Middleware de Tenant**

Crear archivo: `backend/src/middleware/tenant.js`

```javascript
const db = require('../config/database');

// Middleware para identificar el tenant por subdomain
const identifyTenant = async (req, res, next) => {
    try {
        // Obtener subdomain del header o del hostname
        const host = req.get('host'); // ejemplo: empresa1.zonochat.com
        const subdomain = host.split('.')[0];

        // Si es localhost, usar tenant por defecto o del header
        const tenantSubdomain = process.env.NODE_ENV === 'development' 
            ? req.headers['x-tenant'] || 'demo'
            : subdomain;

        // Buscar tenant en la BD master
        const [tenants] = await db.query(
            'SELECT * FROM tenants WHERE subdomain = ? AND status = ?',
            [tenantSubdomain, 'active']
        );

        if (tenants.length === 0) {
            return res.status(404).json({ error: 'Tenant no encontrado o inactivo' });
        }

        const tenant = tenants[0];

        // Conectar a la base de datos del tenant
        const tenantDb = require('mysql2/promise').createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: tenant.database_name,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Adjuntar tenant y su BD a la request
        req.tenant = tenant;
        req.tenantDb = tenantDb;

        next();
    } catch (error) {
        console.error('Error en middleware de tenant:', error);
        res.status(500).json({ error: 'Error al identificar tenant' });
    }
};

module.exports = { identifyTenant };
```

### **2. Actualizar server.js para usar el middleware**

```javascript
const { identifyTenant } = require('./middleware/tenant');

// Aplicar middleware de tenant a todas las rutas API (excepto auth)
app.use('/api', identifyTenant);
```

### **3. Crear Servicio de Configuración de Canales**

Crear archivo: `backend/src/services/channelConfigService.js`

```javascript
class ChannelConfigService {
    /**
     * Obtener configuración de un canal
     */
    static async getChannelConfig(tenantDb, channelType) {
        try {
            const [configs] = await tenantDb.query(
                'SELECT * FROM channel_configs WHERE channel_type = ? AND is_active = true',
                [channelType]
            );

            if (configs.length === 0) {
                throw new Error(`Canal ${channelType} no configurado`);
            }

            return JSON.parse(configs[0].config);
        } catch (error) {
            console.error(`Error obteniendo config de ${channelType}:`, error);
            throw error;
        }
    }

    /**
     * Guardar/Actualizar configuración de un canal
     */
    static async saveChannelConfig(tenantDb, channelType, config) {
        try {
            const configJson = JSON.stringify(config);

            await tenantDb.query(
                `INSERT INTO channel_configs (channel_type, config, is_active) 
                 VALUES (?, ?, true)
                 ON DUPLICATE KEY UPDATE config = ?, updated_at = NOW()`,
                [channelType, configJson, configJson]
            );

            return { success: true };
        } catch (error) {
            console.error(`Error guardando config de ${channelType}:`, error);
            throw error;
        }
    }

    /**
     * Activar/Desactivar un canal
     */
    static async toggleChannel(tenantDb, channelType, isActive) {
        try {
            await tenantDb.query(
                'UPDATE channel_configs SET is_active = ? WHERE channel_type = ?',
                [isActive, channelType]
            );

            return { success: true };
        } catch (error) {
            console.error(`Error toggling ${channelType}:`, error);
            throw error;
        }
    }
}

module.exports = ChannelConfigService;
```

### **4. Actualizar messengerController para usar BD**

```javascript
// Reemplazar getMessengerConfig()
async function getMessengerConfig(tenantDb) {
    const ChannelConfigService = require('../../services/channelConfigService');
    
    try {
        const config = await ChannelConfigService.getChannelConfig(tenantDb, 'messenger');
        return {
            pageAccessToken: config.page_access_token,
            verifyToken: config.verify_token,
            pageId: config.page_id,
            source: 'database'
        };
    } catch (error) {
        // Fallback al .env en desarrollo
        if (process.env.NODE_ENV === 'development') {
            return {
                pageAccessToken: process.env.MESSENGER_PAGE_ACCESS_TOKEN,
                verifyToken: process.env.MESSENGER_VERIFY_TOKEN,
                source: 'env'
            };
        }
        throw error;
    }
}
```

---

## 🎛️ PANEL DE CONFIGURACIÓN

### **1. Crear Endpoint para Configuración de Canales**

Crear archivo: `backend/src/routes/channelConfig.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const ChannelConfigService = require('../services/channelConfigService');

// Obtener configuración de un canal
router.get('/:channelType', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { channelType } = req.params;
        const config = await ChannelConfigService.getChannelConfig(
            req.tenantDb, 
            channelType
        );
        
        res.json({ config });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Guardar configuración de un canal
router.post('/:channelType', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { channelType } = req.params;
        const config = req.body;

        await ChannelConfigService.saveChannelConfig(
            req.tenantDb,
            channelType,
            config
        );

        res.json({ success: true, message: 'Configuración guardada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Activar/Desactivar canal
router.patch('/:channelType/toggle', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { channelType } = req.params;
        const { isActive } = req.body;

        await ChannelConfigService.toggleChannel(
            req.tenantDb,
            channelType,
            isActive
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

### **2. Componente Frontend para Configuración**

Ya existe `SettingsPanel.jsx`, solo necesitas agregar el formulario para Messenger:

```javascript
// En SettingsPanel.jsx, agregar formulario de configuración de Messenger
const MessengerConfigForm = () => {
    const [config, setConfig] = useState({
        page_access_token: '',
        verify_token: '',
        page_id: '',
        app_id: '',
        app_secret: ''
    });

    const handleSave = async () => {
        try {
            await api.post('/channel-config/messenger', config);
            alert('Configuración guardada correctamente');
        } catch (error) {
            alert('Error al guardar configuración');
        }
    };

    return (
        <div className="messenger-config">
            <h3>Configuración de Messenger</h3>
            <input
                type="text"
                placeholder="Page Access Token"
                value={config.page_access_token}
                onChange={(e) => setConfig({...config, page_access_token: e.target.value})}
            />
            <input
                type="text"
                placeholder="Verify Token"
                value={config.verify_token}
                onChange={(e) => setConfig({...config, verify_token: e.target.value})}
            />
            <input
                type="text"
                placeholder="Page ID"
                value={config.page_id}
                onChange={(e) => setConfig({...config, page_id: e.target.value})}
            />
            <button onClick={handleSave}>Guardar Configuración</button>
        </div>
    );
};
```

---

## 🚀 DEPLOYMENT EN HOSTING

### **Opción 1: VPS (Recomendado para Multi-Tenancy)**

**Proveedores:**
- DigitalOcean (Droplet $6/mes)
- AWS Lightsail ($5/mes)
- Linode ($5/mes)
- Vultr ($6/mes)

**Stack:**
- Ubuntu 22.04
- Node.js 18+
- MySQL 8.0
- Nginx (reverse proxy)
- PM2 (process manager)
- Let's Encrypt (SSL gratis)

### **Opción 2: Platform as a Service (PaaS)**

**Proveedores:**
- Railway.app (Fácil, $5/mes)
- Render.com (Gratis para empezar)
- Heroku ($7/mes)

---

## 🔐 VARIABLES DE ENTORNO EN PRODUCCIÓN

### **En el VPS, crear archivo `.env.production`:**

```bash
# Base de datos MASTER (para tenants)
DB_HOST=localhost
DB_USER=zonochat_master
DB_PASSWORD=tu_password_seguro
DB_NAME=zonochat_master

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro_aqui

# URLs
BACKEND_URL=https://api.zonochat.com
FRONTEND_URL=https://app.zonochat.com

# Node
NODE_ENV=production
PORT=3000

# NO incluir tokens de Messenger/WhatsApp aquí
# Esos se configuran desde el panel por cada tenant
```

---

## 📝 SCRIPT DE MIGRACIÓN

Crear archivo: `backend/migrations/create-tenant.js`

```javascript
const mysql = require('mysql2/promise');

async function createTenant(subdomain, companyName, adminEmail, adminPassword) {
    const masterDb = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        // 1. Crear base de datos del tenant
        const dbName = `zonochat_${subdomain}`;
        await masterDb.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);

        // 2. Insertar tenant en tabla master
        const [result] = await masterDb.query(
            `INSERT INTO zonochat_master.tenants (name, subdomain, database_name, status) 
             VALUES (?, ?, ?, 'active')`,
            [companyName, subdomain, dbName]
        );

        const tenantId = result.insertId;

        // 3. Crear tablas en la BD del tenant
        await masterDb.query(`USE ${dbName}`);
        
        // Ejecutar schema.sql en la nueva BD
        const schema = require('fs').readFileSync('./schema.sql', 'utf8');
        await masterDb.query(schema);

        // 4. Crear usuario admin del tenant
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        await masterDb.query(
            `INSERT INTO ${dbName}.users (email, password, first_name, last_name, role) 
             VALUES (?, ?, ?, ?, 'admin')`,
            [adminEmail, hashedPassword, 'Admin', companyName]
        );

        console.log(`✅ Tenant creado: ${subdomain}`);
        console.log(`   BD: ${dbName}`);
        console.log(`   Admin: ${adminEmail}`);

        return { success: true, tenantId, dbName };
    } catch (error) {
        console.error('Error creando tenant:', error);
        throw error;
    } finally {
        await masterDb.end();
    }
}

module.exports = { createTenant };
```

---

## ✅ CHECKLIST DE DEPLOYMENT

- [ ] Crear servidor VPS
- [ ] Instalar Node.js, MySQL, Nginx
- [ ] Configurar dominio y subdominios (*.zonochat.com)
- [ ] Instalar certificado SSL
- [ ] Crear BD master
- [ ] Ejecutar migraciones
- [ ] Configurar PM2 para auto-restart
- [ ] Configurar Nginx como reverse proxy
- [ ] Crear primer tenant
- [ ] Probar login y configuración de canales
- [ ] Configurar backups automáticos

---

## 📞 PRÓXIMOS PASOS

¿Quieres que implemente alguna de estas partes específicamente?

1. **Crear las migraciones de BD completas**
2. **Implementar el middleware de tenant**
3. **Crear el panel de configuración de canales**
4. **Guía detallada de deployment en DigitalOcean/Railway**
5. **Script de creación automática de tenants**

¡Dime qué necesitas primero!
