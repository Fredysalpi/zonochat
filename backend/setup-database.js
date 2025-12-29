require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║   CONFIGURAR BASE DE DATOS - ZONOCHAT  ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');

    try {
        // Conectar a MySQL (sin especificar base de datos)
        console.log('📡 Conectando a MySQL...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });

        console.log('✅ Conexión exitosa\n');

        // Leer el archivo schema.sql
        console.log('📄 Leyendo schema.sql...');
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Ejecutar el schema
        console.log('🔨 Creando base de datos y tablas...');
        console.log('   (Esto puede tomar unos segundos)\n');

        await connection.query(schema);

        console.log('✅ Base de datos creada exitosamente\n');

        // Verificar tablas creadas
        await connection.query('USE zonochat');
        const [tables] = await connection.query('SHOW TABLES');

        console.log('📊 Tablas creadas:');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`   ✓ ${tableName}`);
        });

        console.log('');
        console.log('╔════════════════════════════════════════╗');
        console.log('║     BASE DE DATOS CONFIGURADA ✅       ║');
        console.log('╚════════════════════════════════════════╝');
        console.log('');
        console.log('📝 Próximo paso:');
        console.log('   Ejecuta: node create-admin.js');
        console.log('');

        await connection.end();
        process.exit(0);

    } catch (error) {
        console.error('');
        console.error('❌ Error:', error.message);
        console.error('');

        if (error.code === 'ECONNREFUSED') {
            console.error('💡 Solución: Verifica que MySQL esté corriendo');
            console.error('   - Si usas XAMPP: Inicia Apache y MySQL');
            console.error('   - Si usas WAMP: Inicia los servicios');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Solución: Verifica las credenciales en .env');
            console.error('   - DB_USER (default: root)');
            console.error('   - DB_PASSWORD');
        } else if (error.code === 'ENOENT') {
            console.error('💡 Solución: No se encontró el archivo schema.sql');
            console.error('   Ruta esperada:', path.join(__dirname, '..', 'database', 'schema.sql'));
        }

        console.error('');
        console.error('Detalles técnicos:');
        console.error(error);
        console.error('');
        process.exit(1);
    }
}

// Ejecutar
setupDatabase();
