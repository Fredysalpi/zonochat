const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createUsers() {
    // Configuración de conexión a MySQL
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'zonochat'
    });

    try {
        console.log('🔐 Generando contraseñas hasheadas...\n');

        // Generar hashes para las contraseñas
        const adminHash = await bcrypt.hash('admin123', 10);
        const supervisorHash = await bcrypt.hash('supervisor123', 10);
        const agente1Hash = await bcrypt.hash('agente123', 10);

        console.log('✅ Contraseñas generadas:\n');
        console.log('Admin: admin123');
        console.log('Supervisor: supervisor123');
        console.log('Agente1: agente123\n');

        // Eliminar usuarios existentes
        await connection.query('DELETE FROM users WHERE email IN (?, ?, ?)', [
            'admin@zonochat.com',
            'supervisor@zonochat.com',
            'agente1@zonochat.com'
        ]);

        console.log('🗑️  Usuarios anteriores eliminados\n');

        // Insertar nuevos usuarios
        const users = [
            {
                email: 'admin@zonochat.com',
                password: adminHash,
                first_name: 'Admin',
                last_name: 'ZonoChat',
                role: 'admin'
            },
            {
                email: 'supervisor@zonochat.com',
                password: supervisorHash,
                first_name: 'Supervisor',
                last_name: 'Demo',
                role: 'supervisor'
            },
            {
                email: 'agente1@zonochat.com',
                password: agente1Hash,
                first_name: 'Agente',
                last_name: 'Uno',
                role: 'agent'
            }
        ];

        for (const user of users) {
            await connection.query(
                'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
                [user.email, user.password, user.first_name, user.last_name, user.role]
            );
            console.log(`✅ Usuario creado: ${user.email} (${user.role})`);
        }

        console.log('\n🎉 ¡Usuarios creados exitosamente!\n');
        console.log('📋 Credenciales de acceso:\n');
        console.log('┌─────────────────────────────────────────────┐');
        console.log('│ ADMINISTRADOR                               │');
        console.log('│ Email: admin@zonochat.com                   │');
        console.log('│ Password: admin123                          │');
        console.log('├─────────────────────────────────────────────┤');
        console.log('│ SUPERVISOR                                  │');
        console.log('│ Email: supervisor@zonochat.com              │');
        console.log('│ Password: supervisor123                     │');
        console.log('├─────────────────────────────────────────────┤');
        console.log('│ AGENTE 1                                    │');
        console.log('│ Email: agente1@zonochat.com                 │');
        console.log('│ Password: agente123                         │');
        console.log('└─────────────────────────────────────────────┘\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

createUsers();
