const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const fs = require('fs');

async function resetUsers() {
    let connection;
    const logFile = 'reset_users_log.txt';
    let log = '';

    function addLog(message) {
        console.log(message);
        log += message + '\n';
    }

    try {
        // Intentar conectar con password vacía
        addLog('🔍 Conectando a MySQL...');
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'zonochat'
        });
        addLog('✅ Conexión exitosa\n');

        // Verificar usuarios actuales
        addLog('📋 Verificando usuarios actuales...');
        const [currentUsers] = await connection.query('SELECT email, first_name, last_name, role FROM users');
        addLog(`Usuarios encontrados: ${currentUsers.length}\n`);

        currentUsers.forEach(user => {
            addLog(`  - ${user.email} (${user.role})`);
        });

        // Eliminar todos los usuarios
        addLog('\n🗑️  Eliminando usuarios existentes...');
        await connection.query('DELETE FROM users');
        addLog('✅ Usuarios eliminados\n');

        // Generar nuevas contraseñas hasheadas
        addLog('🔐 Generando contraseñas hasheadas...');
        const adminHash = await bcrypt.hash('admin123', 10);
        const supervisorHash = await bcrypt.hash('supervisor123', 10);
        const agente1Hash = await bcrypt.hash('agente123', 10);
        addLog('✅ Contraseñas generadas\n');

        // Insertar nuevos usuarios
        addLog('👥 Creando nuevos usuarios...');

        await connection.query(
            'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
            ['admin@zonochat.com', adminHash, 'Admin', 'ZonoChat', 'admin']
        );
        addLog('  ✅ Admin creado');

        await connection.query(
            'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
            ['supervisor@zonochat.com', supervisorHash, 'Supervisor', 'Demo', 'supervisor']
        );
        addLog('  ✅ Supervisor creado');

        await connection.query(
            'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
            ['agente1@zonochat.com', agente1Hash, 'Agente', 'Uno', 'agent']
        );
        addLog('  ✅ Agente 1 creado');

        // Verificar usuarios creados
        addLog('\n📋 Verificando usuarios creados...');
        const [newUsers] = await connection.query('SELECT id, email, first_name, last_name, role FROM users');
        addLog(`Total de usuarios: ${newUsers.length}\n`);

        newUsers.forEach(user => {
            addLog(`  ID: ${user.id} | ${user.email} | ${user.first_name} ${user.last_name} | ${user.role}`);
        });

        addLog('\n' + '='.repeat(60));
        addLog('🎉 ¡USUARIOS CREADOS EXITOSAMENTE!');
        addLog('='.repeat(60));
        addLog('\n📋 CREDENCIALES DE ACCESO:\n');
        addLog('┌─────────────────────────────────────────────┐');
        addLog('│ ADMINISTRADOR                               │');
        addLog('│ Email: admin@zonochat.com                   │');
        addLog('│ Password: admin123                          │');
        addLog('├─────────────────────────────────────────────┤');
        addLog('│ SUPERVISOR                                  │');
        addLog('│ Email: supervisor@zonochat.com              │');
        addLog('│ Password: supervisor123                     │');
        addLog('├─────────────────────────────────────────────┤');
        addLog('│ AGENTE 1                                    │');
        addLog('│ Email: agente1@zonochat.com                 │');
        addLog('│ Password: agente123                         │');
        addLog('└─────────────────────────────────────────────┘\n');

        // Guardar log
        fs.writeFileSync(logFile, log);
        addLog(`\n📄 Log guardado en: ${logFile}`);

    } catch (error) {
        addLog(`\n❌ ERROR: ${error.message}`);
        addLog(`\nDetalles del error:`);
        addLog(JSON.stringify(error, null, 2));
        fs.writeFileSync(logFile, log);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

resetUsers();
