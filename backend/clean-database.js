// Script para limpiar todos los mensajes, tickets y contactos de la base de datos
// Mantiene usuarios y administradores intactos
require('dotenv').config();
const mysql = require('mysql2/promise');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function cleanDatabase() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'zonochat'
        });

        console.log('✅ Conectado a la base de datos\n');

        // Mostrar estadísticas actuales
        const [stats] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM messages) as total_messages,
                (SELECT COUNT(*) FROM tickets) as total_tickets,
                (SELECT COUNT(*) FROM contacts) as total_contacts,
                (SELECT COUNT(*) FROM users) as total_users
        `);

        console.log('📊 ESTADÍSTICAS ACTUALES:');
        console.log('════════════════════════════════════════');
        console.log(`   Mensajes:  ${stats[0].total_messages}`);
        console.log(`   Tickets:   ${stats[0].total_tickets}`);
        console.log(`   Contactos: ${stats[0].total_contacts}`);
        console.log(`   Usuarios:  ${stats[0].total_users}`);
        console.log('════════════════════════════════════════\n');

        // Confirmar acción
        const confirm = await question('⚠️  ¿Estás seguro de que quieres ELIMINAR todos los mensajes, tickets y contactos? (escribe "SI" para confirmar): ');

        if (confirm.toUpperCase() !== 'SI') {
            console.log('\n❌ Operación cancelada');
            rl.close();
            return;
        }

        console.log('\n🗑️  Eliminando datos...\n');

        // Deshabilitar verificación de claves foráneas temporalmente
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        // Eliminar mensajes
        const [messagesResult] = await connection.execute('DELETE FROM messages');
        console.log(`✅ ${messagesResult.affectedRows} mensajes eliminados`);

        // Eliminar asignaciones de tickets
        const [assignmentsResult] = await connection.execute('DELETE FROM ticket_assignments');
        console.log(`✅ ${assignmentsResult.affectedRows} asignaciones de tickets eliminadas`);

        // Eliminar tickets
        const [ticketsResult] = await connection.execute('DELETE FROM tickets');
        console.log(`✅ ${ticketsResult.affectedRows} tickets eliminados`);

        // Eliminar contactos
        const [contactsResult] = await connection.execute('DELETE FROM contacts');
        console.log(`✅ ${contactsResult.affectedRows} contactos eliminados`);

        // Reiniciar auto_increment
        await connection.execute('ALTER TABLE messages AUTO_INCREMENT = 1');
        await connection.execute('ALTER TABLE tickets AUTO_INCREMENT = 1');
        await connection.execute('ALTER TABLE contacts AUTO_INCREMENT = 1');
        console.log('\n✅ IDs reiniciados a 1');

        // Rehabilitar verificación de claves foráneas
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        // Mostrar estadísticas finales
        const [finalStats] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM messages) as total_messages,
                (SELECT COUNT(*) FROM tickets) as total_tickets,
                (SELECT COUNT(*) FROM contacts) as total_contacts,
                (SELECT COUNT(*) FROM users) as total_users
        `);

        console.log('\n📊 ESTADÍSTICAS FINALES:');
        console.log('════════════════════════════════════════');
        console.log(`   Mensajes:  ${finalStats[0].total_messages}`);
        console.log(`   Tickets:   ${finalStats[0].total_tickets}`);
        console.log(`   Contactos: ${finalStats[0].total_contacts}`);
        console.log(`   Usuarios:  ${finalStats[0].total_users} (sin cambios)`);
        console.log('════════════════════════════════════════\n');

        console.log('🎉 Base de datos limpiada exitosamente!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✅ Conexión cerrada');
        }
        rl.close();
    }
}

cleanDatabase();
