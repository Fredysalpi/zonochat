/**
 * Script para asignar tenant_id a usuarios existentes
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixUserTenants() {
    let connection;

    try {
        console.log('🔧 Conectando a la base de datos...\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'zonochat'
        });

        console.log('✅ Conectado a la base de datos\n');

        // Verificar si existe el tenant demo
        const [tenants] = await connection.query('SELECT id, name FROM tenants WHERE id = 1');

        if (tenants.length === 0) {
            console.log('❌ No se encontró el tenant demo (ID=1)');
            console.log('Por favor, ejecuta primero: node migrations/apply-multi-tenancy.js\n');
            return;
        }

        console.log(`📋 Tenant encontrado: ${tenants[0].name} (ID: ${tenants[0].id})\n`);

        // Ver usuarios sin tenant_id
        const [usersWithoutTenant] = await connection.query(
            'SELECT id, email, role FROM users WHERE tenant_id IS NULL'
        );

        if (usersWithoutTenant.length === 0) {
            console.log('✅ Todos los usuarios ya tienen tenant_id asignado\n');

            // Mostrar usuarios
            const [allUsers] = await connection.query(
                'SELECT id, email, role, tenant_id FROM users'
            );

            console.log('👥 Usuarios en el sistema:');
            console.table(allUsers);
            return;
        }

        console.log(`📝 Usuarios sin tenant_id: ${usersWithoutTenant.length}`);
        console.table(usersWithoutTenant);

        // Asignar tenant_id = 1 a todos los usuarios sin tenant
        const [result] = await connection.query(
            'UPDATE users SET tenant_id = 1 WHERE tenant_id IS NULL'
        );

        console.log(`\n✅ ${result.affectedRows} usuarios actualizados con tenant_id = 1\n`);

        // Mostrar resultado final
        const [allUsers] = await connection.query(
            'SELECT id, email, role, tenant_id FROM users'
        );

        console.log('👥 Usuarios actualizados:');
        console.table(allUsers);

        console.log('\n🎉 ¡Proceso completado exitosamente!');
        console.log('\n📝 Próximos pasos:');
        console.log('   1. Reinicia sesión en la aplicación');
        console.log('   2. Ahora podrás acceder a las rutas de administración\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada\n');
        }
    }
}

// Ejecutar
fixUserTenants();
