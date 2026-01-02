require('dotenv').config();
const db = require('./src/config/database');

async function addChannelIdColumn() {
    console.log('\n🔧 Agregando columna channel_id a channel_configs...\n');

    try {
        // Verificar si la columna ya existe
        const [columns] = await db.query(
            "SHOW COLUMNS FROM channel_configs LIKE 'channel_id'"
        );

        if (columns.length > 0) {
            console.log('✅ La columna channel_id ya existe en channel_configs\n');
        } else {
            // Agregar la columna
            await db.query(
                'ALTER TABLE channel_configs ADD COLUMN channel_id INT NULL AFTER config'
            );
            console.log('✅ Columna channel_id agregada exitosamente\n');
        }

        // Mostrar estructura actual
        const [structure] = await db.query('DESCRIBE channel_configs');
        console.log('📊 Estructura actual de channel_configs:\n');
        structure.forEach(col => {
            console.log(`   ${col.Field.padEnd(20)} ${col.Type.padEnd(20)} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        console.log('\n✅ Migración completada\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

addChannelIdColumn();
