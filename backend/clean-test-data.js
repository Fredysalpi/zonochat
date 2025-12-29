require('dotenv').config();
const mysql = require('mysql2/promise');

async function cleanTestData() {
    let connection;

    try {
        console.log('🔄 Conectando a la base de datos...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'zonochat'
        });

        console.log('✅ Conectado a MySQL\n');
        console.log('🗑️  Limpiando datos de prueba...\n');

        // Eliminar en orden debido a las foreign keys
        await connection.execute('DELETE FROM messages');
        console.log('  ✓ Mensajes eliminados');

        await connection.execute('DELETE FROM notes');
        console.log('  ✓ Notas eliminadas');

        await connection.execute('DELETE FROM ticket_assignments');
        console.log('  ✓ Asignaciones eliminadas');

        await connection.execute('DELETE FROM tickets');
        console.log('  ✓ Tickets eliminados');

        await connection.execute('DELETE FROM contacts');
        console.log('  ✓ Contactos eliminados');

        await connection.execute('DELETE FROM channels');
        console.log('  ✓ Canales eliminados');

        console.log('\n✅ Datos de prueba eliminados exitosamente\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

cleanTestData();
