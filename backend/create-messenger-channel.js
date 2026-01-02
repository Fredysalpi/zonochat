// Script para crear un canal de Messenger en la base de datos
require('dotenv').config();
const mysql = require('mysql2/promise');

async function createMessengerChannel() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'zonochat'
        });

        console.log('✅ Conectado a la base de datos\n');

        // Verificar si ya existe un canal de Messenger
        const [existing] = await connection.execute(
            "SELECT * FROM channels WHERE type = 'messenger' LIMIT 1"
        );

        if (existing.length > 0) {
            console.log('✅ Ya existe un canal de Messenger:');
            console.log('   ID:', existing[0].id);
            console.log('   Nombre:', existing[0].name);
            console.log('   Identificador:', existing[0].identifier);
            return;
        }

        // Crear el canal de Messenger
        const [result] = await connection.execute(
            `INSERT INTO channels (name, type, identifier, access_token, webhook_verify_token, is_active)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                'Messenger - Morsalcorp',
                'messenger',
                '911297038727177', // Page ID de tu página
                process.env.MESSENGER_PAGE_ACCESS_TOKEN,
                process.env.MESSENGER_VERIFY_TOKEN,
                true
            ]
        );

        console.log('✅ Canal de Messenger creado exitosamente!');
        console.log('   ID del canal:', result.insertId);
        console.log('   Nombre: Messenger - Morsalcorp');
        console.log('   Page ID: 911297038727177\n');

        console.log('🎉 Ahora puedes enviar mensajes desde Messenger y deberían aparecer en ZonoChat');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✅ Conexión cerrada');
        }
    }
}

createMessengerChannel();
