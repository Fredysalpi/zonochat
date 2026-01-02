/**
 * Script para ejecutar migraciones de base de datos
 * 
 * Uso:
 *   node run-migrations.js                    # Ejecuta todas las migraciones
 *   node run-migrations.js --tenant demo      # Ejecuta migraciones solo en tenant específico
 *   node run-migrations.js --create-tenant    # Crea un nuevo tenant
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

// Configuración de la conexión
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
};

/**
 * Ejecutar un archivo SQL
 */
async function executeSqlFile(connection, filePath) {
    try {
        console.log(`📄 Ejecutando: ${path.basename(filePath)}`);
        const sql = await fs.readFile(filePath, 'utf8');
        await connection.query(sql);
        console.log(`✅ Completado: ${path.basename(filePath)}`);
        return true;
    } catch (error) {
        console.error(`❌ Error en ${path.basename(filePath)}:`, error.message);
        return false;
    }
}

/**
 * Ejecutar migraciones master
 */
async function runMasterMigrations() {
    const connection = await mysql.createConnection(dbConfig);

    try {
        console.log('\n🔧 Ejecutando migraciones MASTER...\n');

        // Ejecutar migración 001
        await executeSqlFile(
            connection,
            path.join(__dirname, 'migrations', '001_create_master_database.sql')
        );

        console.log('\n✅ Migraciones master completadas\n');
    } catch (error) {
        console.error('❌ Error en migraciones master:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

/**
 * Ejecutar migraciones en un tenant específico
 */
async function runTenantMigrations(tenantDbName) {
    const connection = await mysql.createConnection({
        ...dbConfig,
        database: tenantDbName
    });

    try {
        console.log(`\n🔧 Ejecutando migraciones en ${tenantDbName}...\n`);

        // Ejecutar migración 002
        await executeSqlFile(
            connection,
            path.join(__dirname, 'migrations', '002_add_channel_configs.sql')
        );

        console.log(`\n✅ Migraciones completadas en ${tenantDbName}\n`);
    } catch (error) {
        console.error(`❌ Error en migraciones de ${tenantDbName}:`, error);
        throw error;
    } finally {
        await connection.end();
    }
}

/**
 * Crear un nuevo tenant
 */
async function createTenant(subdomain, companyName, adminEmail, adminPassword) {
    const connection = await mysql.createConnection(dbConfig);

    try {
        console.log(`\n🏢 Creando tenant: ${companyName} (${subdomain})\n`);

        const dbName = `zonochat_${subdomain}`;

        // 1. Crear base de datos
        console.log(`📦 Creando base de datos: ${dbName}`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);

        // 2. Copiar schema de la BD actual
        console.log(`📋 Copiando schema...`);
        await connection.query(`USE ${dbName}`);

        // Leer y ejecutar el schema.sql principal
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');
        await connection.query(schema);

        // 3. Ejecutar migraciones específicas del tenant
        await runTenantMigrations(dbName);

        // 4. Insertar tenant en la tabla master
        await connection.query(`USE zonochat_master`);
        const [result] = await connection.query(
            `INSERT INTO tenants (name, subdomain, database_name, status, plan) 
             VALUES (?, ?, ?, 'active', 'free')`,
            [companyName, subdomain, dbName]
        );

        const tenantId = result.insertId;
        console.log(`✅ Tenant creado con ID: ${tenantId}`);

        // 5. Crear usuario admin
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await connection.query(
            `INSERT INTO master_users (tenant_id, email, password_hash, role) 
             VALUES (?, ?, ?, 'tenant_admin')`,
            [tenantId, adminEmail, hashedPassword]
        );

        // También crear el usuario en la BD del tenant
        await connection.query(`USE ${dbName}`);
        await connection.query(
            `INSERT INTO users (email, password, first_name, last_name, role, is_active) 
             VALUES (?, ?, ?, ?, 'admin', true)`,
            [adminEmail, hashedPassword, 'Admin', companyName]
        );

        console.log(`✅ Usuario admin creado: ${adminEmail}`);

        console.log(`\n🎉 Tenant creado exitosamente!\n`);
        console.log(`   Subdominio: ${subdomain}.zonochat.com`);
        console.log(`   Base de datos: ${dbName}`);
        console.log(`   Email admin: ${adminEmail}`);
        console.log(`   Contraseña: ${adminPassword}\n`);

        return { tenantId, dbName };
    } catch (error) {
        console.error('❌ Error creando tenant:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

/**
 * Listar todos los tenants
 */
async function listTenants() {
    const connection = await mysql.createConnection({
        ...dbConfig,
        database: 'zonochat_master'
    });

    try {
        const [tenants] = await connection.query(
            'SELECT id, name, subdomain, database_name, status, plan, created_at FROM tenants ORDER BY created_at DESC'
        );

        console.log('\n📋 Tenants registrados:\n');
        console.table(tenants);
    } catch (error) {
        console.error('❌ Error listando tenants:', error);
    } finally {
        await connection.end();
    }
}

/**
 * Main
 */
async function main() {
    const args = process.argv.slice(2);

    try {
        if (args.includes('--create-tenant')) {
            // Crear nuevo tenant
            const subdomain = args[args.indexOf('--subdomain') + 1] || 'empresa1';
            const name = args[args.indexOf('--name') + 1] || 'Empresa 1';
            const email = args[args.indexOf('--email') + 1] || `admin@${subdomain}.com`;
            const password = args[args.indexOf('--password') + 1] || 'admin123';

            await createTenant(subdomain, name, email, password);
        } else if (args.includes('--list')) {
            // Listar tenants
            await listTenants();
        } else if (args.includes('--tenant')) {
            // Migrar solo un tenant específico
            const tenantSubdomain = args[args.indexOf('--tenant') + 1];
            const dbName = `zonochat_${tenantSubdomain}`;
            await runTenantMigrations(dbName);
        } else {
            // Ejecutar todas las migraciones
            await runMasterMigrations();

            // Ejecutar migraciones en tenant demo
            await runTenantMigrations('zonochat_demo');
        }

        console.log('\n✅ Proceso completado\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error fatal:', error);
        process.exit(1);
    }
}

// Ejecutar
main();
