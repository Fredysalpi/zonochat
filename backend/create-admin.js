require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createAdmin() {
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║   CREAR USUARIO ADMIN - ZONOCHAT       ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');

    try {
        // Conectar a la base de datos
        console.log('📡 Conectando a MySQL...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'zonochat',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Conexión exitosa\n');

        // Datos del admin
        const adminData = {
            email: 'admin@zonochat.com',
            password: 'admin123',
            first_name: 'Admin',
            last_name: 'ZonoChat',
            role: 'admin'
        };

        // Verificar si ya existe
        const [existing] = await connection.query(
            'SELECT id FROM users WHERE email = ?',
            [adminData.email]
        );

        if (existing.length > 0) {
            console.log('⚠️  El usuario admin ya existe');
            console.log('📧 Email:', adminData.email);
            console.log('');
            console.log('¿Deseas actualizar la contraseña? (Ctrl+C para cancelar)');
            console.log('Actualizando en 3 segundos...');

            await new Promise(resolve => setTimeout(resolve, 3000));

            // Actualizar contraseña
            const hashedPassword = await bcrypt.hash(adminData.password, 10);
            await connection.query(
                'UPDATE users SET password = ? WHERE email = ?',
                [hashedPassword, adminData.email]
            );

            console.log('✅ Contraseña actualizada');
        } else {
            // Crear nuevo usuario
            console.log('👤 Creando usuario admin...');
            const hashedPassword = await bcrypt.hash(adminData.password, 10);

            await connection.query(
                `INSERT INTO users (email, password, first_name, last_name, role, status) 
                 VALUES (?, ?, ?, ?, ?, 'online')`,
                [
                    adminData.email,
                    hashedPassword,
                    adminData.first_name,
                    adminData.last_name,
                    adminData.role
                ]
            );

            console.log('✅ Usuario creado exitosamente');
        }

        console.log('');
        console.log('╔════════════════════════════════════════╗');
        console.log('║          CREDENCIALES DE ACCESO        ║');
        console.log('╠════════════════════════════════════════╣');
        console.log('║  Email:    admin@zonochat.com          ║');
        console.log('║  Password: admin123                    ║');
        console.log('╚════════════════════════════════════════╝');
        console.log('');
        console.log('🚀 Ahora puedes iniciar sesión en: http://localhost:5173');
        console.log('');

        await connection.end();
        process.exit(0);

    } catch (error) {
        console.error('');
        console.error('❌ Error:', error.message);
        console.error('');

        if (error.code === 'ECONNREFUSED') {
            console.error('💡 Solución: Verifica que MySQL esté corriendo');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('💡 Solución: Crea la base de datos primero');
            console.error('   Ejecuta: mysql -u root -p < database/schema.sql');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Solución: Verifica las credenciales en .env');
        }

        console.error('');
        process.exit(1);
    }
}

// Ejecutar
createAdmin();
