/**
 * MIGRACIÓN: Multi-Tenancy Schema (Versión Mejorada)
 * Aplica los cambios necesarios para convertir ZonoChat en un sistema multi-tenant
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function applyMigration() {
    let connection;

    try {
        console.log('🚀 Iniciando migración Multi-Tenancy...\n');

        // Conectar a la base de datos
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'zonochat'
        });

        console.log('✅ Conectado a la base de datos\n');

        // 1. Crear tabla tenants
        console.log('📋 Creando tabla tenants...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS tenants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                subdomain VARCHAR(100) UNIQUE NOT NULL,
                status ENUM('active', 'suspended', 'trial', 'inactive') DEFAULT 'trial',
                plan ENUM('free', 'basic', 'pro', 'enterprise') DEFAULT 'free',
                max_agents INT DEFAULT 5,
                max_tickets_per_month INT DEFAULT 100,
                logo VARCHAR(500) NULL,
                settings JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NULL,
                INDEX idx_subdomain (subdomain),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla tenants creada\n');

        // 2. Modificar tabla users
        console.log('📋 Modificando tabla users...');

        // Agregar columna tenant_id
        try {
            await connection.query('ALTER TABLE users ADD COLUMN tenant_id INT NULL AFTER id');
            console.log('✅ Columna tenant_id agregada');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Columna tenant_id ya existe');
            } else {
                throw error;
            }
        }

        // Agregar columna assigned_channels
        try {
            await connection.query('ALTER TABLE users ADD COLUMN assigned_channels JSON NULL');
            console.log('✅ Columna assigned_channels agregada');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Columna assigned_channels ya existe');
            } else {
                throw error;
            }
        }

        // Agregar columna current_tickets_count
        try {
            await connection.query('ALTER TABLE users ADD COLUMN current_tickets_count INT DEFAULT 0');
            console.log('✅ Columna current_tickets_count agregada');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Columna current_tickets_count ya existe');
            } else {
                throw error;
            }
        }

        // Agregar índice
        try {
            await connection.query('ALTER TABLE users ADD INDEX idx_tenant_id (tenant_id)');
            console.log('✅ Índice idx_tenant_id agregado');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Índice idx_tenant_id ya existe');
            } else {
                throw error;
            }
        }

        console.log('');

        // 3. Modificar tabla channels
        console.log('📋 Modificando tabla channels...');

        try {
            await connection.query('ALTER TABLE channels ADD COLUMN tenant_id INT NULL AFTER id');
            console.log('✅ Columna tenant_id agregada a channels');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Columna tenant_id ya existe en channels');
            } else {
                throw error;
            }
        }

        try {
            await connection.query('ALTER TABLE channels ADD INDEX idx_tenant_id (tenant_id)');
            console.log('✅ Índice idx_tenant_id agregado a channels');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Índice idx_tenant_id ya existe en channels');
            } else {
                throw error;
            }
        }

        console.log('');

        // 4. Modificar tabla tickets
        console.log('📋 Modificando tabla tickets...');

        try {
            await connection.query('ALTER TABLE tickets ADD COLUMN queue_position INT NULL');
            console.log('✅ Columna queue_position agregada');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Columna queue_position ya existe');
            } else {
                throw error;
            }
        }

        try {
            await connection.query('ALTER TABLE tickets ADD COLUMN waiting_since TIMESTAMP NULL');
            console.log('✅ Columna waiting_since agregada');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Columna waiting_since ya existe');
            } else {
                throw error;
            }
        }

        console.log('');

        // 5. Crear tabla channel_configs
        console.log('📋 Creando tabla channel_configs...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS channel_configs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                channel_type ENUM('messenger', 'whatsapp', 'instagram', 'telegram', 'webchat') NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                config JSON NOT NULL,
                webhook_url VARCHAR(500) NULL,
                last_sync_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_tenant_channel (tenant_id, channel_type),
                INDEX idx_tenant_id (tenant_id),
                INDEX idx_channel_type (channel_type),
                INDEX idx_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla channel_configs creada\n');

        // 6. Crear tabla ticket_queue
        console.log('📋 Creando tabla ticket_queue...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ticket_queue (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                ticket_id INT NOT NULL,
                channel_type ENUM('messenger', 'whatsapp', 'instagram', 'telegram', 'webchat') NOT NULL,
                priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
                entered_queue_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                attempts INT DEFAULT 0,
                last_attempt_at TIMESTAMP NULL,
                metadata JSON,
                INDEX idx_tenant_id (tenant_id),
                INDEX idx_ticket_id (ticket_id),
                INDEX idx_channel_type (channel_type),
                INDEX idx_priority (priority),
                INDEX idx_entered_queue_at (entered_queue_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla ticket_queue creada\n');

        // 7. Crear tabla agent_availability
        console.log('📋 Creando tabla agent_availability...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS agent_availability (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                tenant_id INT NOT NULL,
                is_available BOOLEAN DEFAULT TRUE,
                current_load INT DEFAULT 0,
                max_load INT DEFAULT 5,
                last_assignment_at TIMESTAMP NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_tenant (user_id, tenant_id),
                INDEX idx_tenant_id (tenant_id),
                INDEX idx_user_id (user_id),
                INDEX idx_is_available (is_available),
                INDEX idx_current_load (current_load)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla agent_availability creada\n');

        // 8. Crear tenant de ejemplo
        console.log('🏢 Creando tenant de ejemplo...');

        const [existingTenants] = await connection.query(
            'SELECT id FROM tenants WHERE subdomain = ?',
            ['demo']
        );

        if (existingTenants.length === 0) {
            const [tenantResult] = await connection.query(
                `INSERT INTO tenants (name, subdomain, status, plan, max_agents, max_tickets_per_month)
                 VALUES ('Empresa Demo', 'demo', 'active', 'pro', 10, 1000)`
            );

            const tenantId = tenantResult.insertId;
            console.log(`✅ Tenant 'demo' creado con ID: ${tenantId}`);

            // Actualizar usuarios existentes
            const [updateResult] = await connection.query(
                'UPDATE users SET tenant_id = ? WHERE tenant_id IS NULL',
                [tenantId]
            );
            console.log(`✅ ${updateResult.affectedRows} usuarios asociados al tenant demo`);

            // Actualizar canales existentes
            const [channelResult] = await connection.query(
                'UPDATE channels SET tenant_id = ? WHERE tenant_id IS NULL',
                [tenantId]
            );
            console.log(`✅ ${channelResult.affectedRows} canales asociados al tenant demo`);

            // Crear configuraciones de canales
            const channelTypes = ['messenger', 'whatsapp', 'instagram'];
            for (const channelType of channelTypes) {
                await connection.query(
                    `INSERT INTO channel_configs (tenant_id, channel_type, is_active, config)
                     VALUES (?, ?, FALSE, '{}')
                     ON DUPLICATE KEY UPDATE tenant_id = tenant_id`,
                    [tenantId, channelType]
                );
            }
            console.log('✅ Configuraciones de canales creadas');

            // Inicializar disponibilidad de agentes
            await connection.query(`
                INSERT INTO agent_availability (user_id, tenant_id, is_available, current_load, max_load)
                SELECT id, tenant_id, TRUE, 0, max_concurrent_tickets
                FROM users
                WHERE role IN ('agent', 'supervisor') AND is_active = TRUE AND tenant_id = ?
                ON DUPLICATE KEY UPDATE updated_at = NOW()
            `, [tenantId]);
            console.log('✅ Disponibilidad de agentes inicializada');
        } else {
            console.log('⚠️  Tenant demo ya existe, saltando creación');
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 ¡Migración Multi-Tenancy completada exitosamente!');
        console.log('='.repeat(60) + '\n');

        console.log('📝 Próximos pasos:');
        console.log('   1. Reiniciar el servidor backend');
        console.log('   2. Acceder al panel de administración');
        console.log('   3. Configurar los canales desde la interfaz web');
        console.log('   4. Crear agentes y asignarles canales\n');

    } catch (error) {
        console.error('\n❌ Error durante la migración:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada\n');
        }
    }
}

// Ejecutar migración
applyMigration();
