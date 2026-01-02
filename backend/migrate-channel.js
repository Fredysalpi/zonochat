require('dotenv').config();
const db = require('./src/config/database');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function migrateChannel() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   MIGRAR CANAL DE channels A channel_configs              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
        // Obtener canal de la tabla antigua
        const [channels] = await db.query('SELECT * FROM channels WHERE id = ?', [10]);

        if (channels.length === 0) {
            console.log('❌ No se encontró el canal');
            process.exit(1);
        }

        const channel = channels[0];
        console.log('📋 Canal encontrado:');
        console.log(`   ID: ${channel.id}`);
        console.log(`   Nombre: ${channel.name}`);
        console.log(`   Tipo: ${channel.type}`);
        console.log(`   Activo: ${channel.is_active ? 'SÍ' : 'NO'}\n`);

        console.log('⚠️  Este canal NO tiene tokens guardados en la BD.');
        console.log('Necesitas ingresar los tokens para crear la configuración.\n');

        const pageAccessToken = await question('Page Access Token: ');
        const verifyToken = await question('Verify Token: ');

        if (!pageAccessToken || !verifyToken) {
            console.log('\n❌ Ambos tokens son requeridos');
            process.exit(1);
        }

        // Crear configuración en channel_configs
        const config = {
            page_access_token: pageAccessToken,
            verify_token: verifyToken
        };

        const [result] = await db.query(
            `INSERT INTO channel_configs (channel_type, name, config, is_active, created_by)
             VALUES (?, ?, ?, ?, ?)`,
            ['messenger', channel.name, JSON.stringify(config), channel.is_active, 1]
        );

        console.log('\n✅ MIGRACIÓN EXITOSA!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Nueva configuración creada con ID: ${result.insertId}`);
        console.log(`Nombre: ${channel.name}`);
        console.log(`Estado: ${channel.is_active ? '🟢 ACTIVO' : '🔴 INACTIVO'}`);
        console.log(`Page Access Token: ***${pageAccessToken.slice(-4)}`);
        console.log(`Verify Token: ***${verifyToken.slice(-4)}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const deleteOld = await question('¿Deseas eliminar el canal antiguo de la tabla channels? (s/n): ');

        if (deleteOld.toLowerCase() === 's') {
            await db.query('DELETE FROM channels WHERE id = ?', [channel.id]);
            console.log('✅ Canal antiguo eliminado\n');
        }

        console.log('🎯 PRÓXIMOS PASOS:\n');
        console.log('1. El sistema ahora usará la configuración del panel');
        console.log('2. Prueba enviando un mensaje');
        console.log('3. Verifica los logs: "✅ Usando configuración de Messenger desde el panel de ZonoChat"\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        rl.close();
        process.exit(0);
    }
}

migrateChannel();
