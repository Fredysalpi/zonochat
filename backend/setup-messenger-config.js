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

async function createMessengerConfig() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   CONFIGURAR MESSENGER DESDE LÍNEA DE COMANDOS            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
        console.log('📝 Ingresa los siguientes datos:\n');

        const name = await question('Nombre de la configuración (ej: "Facebook Page Principal"): ');
        const pageAccessToken = await question('Page Access Token: ');
        const verifyToken = await question('Verify Token: ');

        console.log('\n🔍 Verificando datos...\n');

        if (!name || !pageAccessToken || !verifyToken) {
            console.log('❌ Todos los campos son requeridos');
            process.exit(1);
        }

        // Verificar si ya existe una configuración
        const [existing] = await db.query(
            'SELECT * FROM channel_configs WHERE channel_type = ?',
            ['messenger']
        );

        if (existing.length > 0) {
            console.log('⚠️  Ya existe una configuración de Messenger:');
            existing.forEach((config, i) => {
                console.log(`   ${i + 1}. ${config.name} (${config.is_active ? 'ACTIVO' : 'INACTIVO'})`);
            });
            console.log('');
            const overwrite = await question('¿Desactivar las existentes y crear una nueva? (s/n): ');

            if (overwrite.toLowerCase() === 's') {
                await db.query(
                    'UPDATE channel_configs SET is_active = false WHERE channel_type = ?',
                    ['messenger']
                );
                console.log('✅ Configuraciones anteriores desactivadas\n');
            } else {
                console.log('❌ Operación cancelada');
                process.exit(0);
            }
        }

        // Crear configuración
        const config = {
            page_access_token: pageAccessToken,
            verify_token: verifyToken
        };

        const [result] = await db.query(
            `INSERT INTO channel_configs (channel_type, name, config, is_active, created_by)
             VALUES (?, ?, ?, ?, ?)`,
            ['messenger', name, JSON.stringify(config), true, 1] // created_by = 1 (admin)
        );

        console.log('\n✅ CONFIGURACIÓN CREADA EXITOSAMENTE!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`ID: ${result.insertId}`);
        console.log(`Nombre: ${name}`);
        console.log(`Estado: 🟢 ACTIVO`);
        console.log(`Page Access Token: ***${pageAccessToken.slice(-4)}`);
        console.log(`Verify Token: ***${verifyToken.slice(-4)}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('🎯 PRÓXIMOS PASOS:\n');
        console.log('1. El servidor ya está usando esta configuración');
        console.log('2. NO necesitas reiniciar el servidor');
        console.log('3. Prueba enviando un mensaje desde ZonoChat');
        console.log('4. Deberías ver en los logs: "✅ Usando configuración de Messenger desde el panel de ZonoChat"\n');

        console.log('📚 Para verificar: node check-token-config.js\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        rl.close();
        process.exit(0);
    }
}

createMessengerConfig();
