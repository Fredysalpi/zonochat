const mysql = require('mysql2/promise');

async function checkUsers() {
    let connection;

    try {
        // Intentar diferentes configuraciones de conexión
        const configs = [
            { host: 'localhost', user: 'root', password: '', database: 'zonochat' },
            { host: 'localhost', user: 'root', password: 'root', database: 'zonochat' },
            { host: 'localhost', user: 'root', password: 'password', database: 'zonochat' },
            { host: 'localhost', user: 'root', password: 'mysql', database: 'zonochat' },
        ];

        console.log('🔍 Intentando conectar a MySQL...\n');

        for (const config of configs) {
            try {
                connection = await mysql.createConnection(config);
                console.log(`✅ Conexión exitosa con password: "${config.password || '(vacía)'}"\n`);
                break;
            } catch (err) {
                console.log(`❌ Falló con password: "${config.password || '(vacía)'}"`);
            }
        }

        if (!connection) {
            console.log('\n❌ No se pudo conectar a MySQL con ninguna configuración.');
            console.log('Por favor, verifica:');
            console.log('1. MySQL está corriendo');
            console.log('2. La base de datos "zonochat" existe');
            console.log('3. La contraseña de root es correcta\n');
            return;
        }

        // Verificar usuarios existentes
        console.log('📋 Usuarios existentes en la base de datos:\n');
        const [users] = await connection.query('SELECT id, email, first_name, last_name, role, created_at FROM users');

        if (users.length === 0) {
            console.log('⚠️  No hay usuarios en la base de datos\n');
        } else {
            console.table(users);
        }

        // Verificar estructura de la tabla
        console.log('\n🔧 Estructura de la tabla users:\n');
        const [columns] = await connection.query('DESCRIBE users');
        console.table(columns);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkUsers();
