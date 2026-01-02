// Script para ejecutar la migración 007
// Ejecutar con: node run-migration-007.js

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    let connection;

    try {
        // Crear conexión
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'zonochat',
            multipleStatements: true
        });

        console.log('✅ Conectado a la base de datos');
        console.log('📝 Ejecutando migración 007...\n');

        // Leer el archivo SQL
        const sqlFile = path.join(__dirname, '..', 'database', 'migrations', '007_add_channel_column.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Ejecutar la migración
        await connection.query(sql);

        console.log('✅ Migración 007 ejecutada exitosamente\n');

        // Verificar las columnas agregadas
        console.log('📋 Verificando estructura de contacts:');
        const [contactsColumns] = await connection.query('DESCRIBE contacts');
        const channelColumn = contactsColumns.find(col => col.Field === 'channel');
        if (channelColumn) {
            console.log('✅ Columna "channel" agregada a contacts');
            console.log('   Tipo:', channelColumn.Type);
        }

        console.log('\n📋 Verificando estructura de tickets:');
        const [ticketsColumns] = await connection.query('DESCRIBE tickets');
        const ticketChannelColumn = ticketsColumns.find(col => col.Field === 'channel');
        if (ticketChannelColumn) {
            console.log('✅ Columna "channel" agregada a tickets');
            console.log('   Tipo:', ticketChannelColumn.Type);
        }

        console.log('\n🎉 ¡Migración completada! Ahora puedes probar el webhook de Messenger nuevamente.');

    } catch (error) {
        console.error('❌ Error ejecutando migración:', error.message);
        if (error.sql) {
            console.error('SQL:', error.sql);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✅ Conexión cerrada');
        }
    }
}

runMigration();
