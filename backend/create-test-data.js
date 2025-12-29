require('dotenv').config();
const mysql = require('mysql2/promise');

async function createTestData() {
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

        // 1. Obtener el ID del usuario admin
        const [users] = await connection.execute(
            'SELECT id FROM users WHERE email = ? LIMIT 1',
            ['admin@zonochat.com']
        );

        if (users.length === 0) {
            console.log('❌ Error: No se encontró el usuario admin@zonochat.com');
            console.log('   Ejecuta primero: node create-admin.js');
            return;
        }

        const adminId = users[0].id;
        console.log(`✅ Usuario admin encontrado (ID: ${adminId})\n`);

        // 2. Crear canales de prueba
        console.log('📱 Creando canales de prueba...');

        const channels = [
            {
                name: 'WhatsApp Business',
                type: 'whatsapp',
                identifier: '+1234567890',
                config: JSON.stringify({
                    phone_number: '+1234567890',
                    business_account_id: 'test_account'
                })
            },
            {
                name: 'Facebook Messenger',
                type: 'messenger',
                identifier: 'page_id_123',
                config: JSON.stringify({
                    page_id: 'test_page_id'
                })
            },
            {
                name: 'Instagram Direct',
                type: 'instagram',
                identifier: 'ig_account_123',
                config: JSON.stringify({
                    account_id: 'test_instagram_account'
                })
            }
        ];

        const channelIds = [];
        for (const channel of channels) {
            const [result] = await connection.execute(
                'INSERT INTO channels (name, type, identifier, config, is_active) VALUES (?, ?, ?, ?, ?)',
                [channel.name, channel.type, channel.identifier, channel.config, true]
            );
            channelIds.push({ id: result.insertId, type: channel.type });
            console.log(`  ✓ Canal creado: ${channel.name} (ID: ${result.insertId})`);
        }

        console.log('');

        // 3. Crear contactos de prueba
        console.log('👥 Creando contactos de prueba...');

        const contacts = [
            {
                channel_id: channelIds[0].id,
                external_id: 'wa_maria_123',
                name: 'María García',
                phone: '+52 55 1234 5678',
                email: 'maria.garcia@email.com'
            },
            {
                channel_id: channelIds[1].id,
                external_id: 'fb_carlos_456',
                name: 'Carlos Rodríguez',
                phone: '+52 33 9876 5432',
                email: 'carlos.rodriguez@email.com'
            },
            {
                channel_id: channelIds[2].id,
                external_id: 'ig_ana_789',
                name: 'Ana Martínez',
                phone: '+52 81 5555 1234',
                email: 'ana.martinez@email.com'
            },
            {
                channel_id: channelIds[0].id,
                external_id: 'wa_luis_321',
                name: 'Luis Hernández',
                phone: '+52 55 7777 8888',
                email: 'luis.hernandez@email.com'
            },
            {
                channel_id: channelIds[1].id,
                external_id: 'fb_patricia_654',
                name: 'Patricia López',
                phone: '+52 33 4444 3333',
                email: 'patricia.lopez@email.com'
            }
        ];

        const contactIds = [];
        for (const contact of contacts) {
            const [result] = await connection.execute(
                `INSERT INTO contacts (channel_id, external_id, name, phone, email) 
                 VALUES (?, ?, ?, ?, ?)`,
                [contact.channel_id, contact.external_id, contact.name, contact.phone, contact.email]
            );
            contactIds.push({ id: result.insertId, name: contact.name, channel_id: contact.channel_id });
            console.log(`  ✓ Contacto creado: ${contact.name} (ID: ${result.insertId})`);
        }

        console.log('');

        // 4. Crear tickets de prueba
        console.log('🎫 Creando tickets de prueba...');

        const tickets = [
            {
                contact_id: contactIds[0].id,
                channel_id: contactIds[0].channel_id,
                subject: 'Consulta sobre productos',
                status: 'open',
                priority: 'high',
                assigned_to: adminId
            },
            {
                contact_id: contactIds[1].id,
                channel_id: contactIds[1].channel_id,
                subject: 'Problema con mi pedido',
                status: 'pending',
                priority: 'urgent',
                assigned_to: adminId
            },
            {
                contact_id: contactIds[2].id,
                channel_id: contactIds[2].channel_id,
                subject: 'Información de envío',
                status: 'open',
                priority: 'medium',
                assigned_to: adminId
            },
            {
                contact_id: contactIds[3].id,
                channel_id: contactIds[3].channel_id,
                subject: 'Solicitud de cotización',
                status: 'resolved',
                priority: 'low',
                assigned_to: adminId
            },
            {
                contact_id: contactIds[4].id,
                channel_id: contactIds[4].channel_id,
                subject: 'Cambio de producto',
                status: 'open',
                priority: 'medium',
                assigned_to: adminId
            }
        ];

        const ticketIds = [];
        for (let i = 0; i < tickets.length; i++) {
            const ticket = tickets[i];
            const [result] = await connection.execute(
                `INSERT INTO tickets (
                    contact_id, channel_id, subject, status, priority, assigned_to
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    ticket.contact_id, ticket.channel_id, ticket.subject,
                    ticket.status, ticket.priority, ticket.assigned_to
                ]
            );
            ticketIds.push({ id: result.insertId, contact: contactIds[i].name });
            console.log(`  ✓ Ticket creado: ${contactIds[i].name} - ${ticket.subject} (ID: ${result.insertId})`);
        }

        console.log('');

        // 5. Crear mensajes de prueba
        console.log('💬 Creando mensajes de prueba...');

        const messages = [
            // Conversación 1: María García
            {
                ticket_id: ticketIds[0].id,
                sender_type: 'contact',
                content: '¡Hola! Me gustaría saber más información sobre sus productos.',
                created_at: new Date(Date.now() - 3600000) // Hace 1 hora
            },
            {
                ticket_id: ticketIds[0].id,
                sender_type: 'agent',
                sender_id: adminId,
                content: '¡Hola María! Claro, con gusto te ayudo. ¿Qué producto te interesa?',
                created_at: new Date(Date.now() - 3500000)
            },
            {
                ticket_id: ticketIds[0].id,
                sender_type: 'contact',
                content: 'Estoy buscando información sobre sus servicios de consultoría.',
                created_at: new Date(Date.now() - 3400000)
            },

            // Conversación 2: Carlos Rodríguez
            {
                ticket_id: ticketIds[1].id,
                sender_type: 'contact',
                content: 'Hola, tengo un problema con mi pedido #12345',
                created_at: new Date(Date.now() - 7200000) // Hace 2 horas
            },
            {
                ticket_id: ticketIds[1].id,
                sender_type: 'agent',
                sender_id: adminId,
                content: 'Hola Carlos, lamento escuchar eso. ¿Podrías darme más detalles?',
                created_at: new Date(Date.now() - 7100000)
            },
            {
                ticket_id: ticketIds[1].id,
                sender_type: 'contact',
                content: 'El producto llegó dañado y necesito un reemplazo urgente.',
                created_at: new Date(Date.now() - 7000000)
            },
            {
                ticket_id: ticketIds[1].id,
                sender_type: 'agent',
                sender_id: adminId,
                content: 'Entiendo la urgencia. Voy a procesar tu reemplazo de inmediato.',
                created_at: new Date(Date.now() - 6900000)
            },

            // Conversación 3: Ana Martínez
            {
                ticket_id: ticketIds[2].id,
                sender_type: 'contact',
                content: '¿Cuándo llegará mi pedido?',
                created_at: new Date(Date.now() - 1800000) // Hace 30 minutos
            },
            {
                ticket_id: ticketIds[2].id,
                sender_type: 'agent',
                sender_id: adminId,
                content: 'Hola Ana, déjame verificar el estado de tu envío.',
                created_at: new Date(Date.now() - 1700000)
            },

            // Conversación 4: Luis Hernández (Resuelta)
            {
                ticket_id: ticketIds[3].id,
                sender_type: 'contact',
                content: 'Necesito una cotización para 100 unidades.',
                created_at: new Date(Date.now() - 86400000) // Hace 1 día
            },
            {
                ticket_id: ticketIds[3].id,
                sender_type: 'agent',
                sender_id: adminId,
                content: 'Claro, te envío la cotización por correo.',
                created_at: new Date(Date.now() - 86300000)
            },
            {
                ticket_id: ticketIds[3].id,
                sender_type: 'contact',
                content: '¡Perfecto! Muchas gracias.',
                created_at: new Date(Date.now() - 86200000)
            },

            // Conversación 5: Patricia López
            {
                ticket_id: ticketIds[4].id,
                sender_type: 'contact',
                content: 'Hola, quisiera cambiar un producto que compré.',
                created_at: new Date(Date.now() - 900000) // Hace 15 minutos
            }
        ];

        let messageCount = 0;
        for (const message of messages) {
            await connection.execute(
                `INSERT INTO messages (
                    ticket_id, sender_type, sender_id, content, created_at
                ) VALUES (?, ?, ?, ?, ?)`,
                [
                    message.ticket_id,
                    message.sender_type,
                    message.sender_id || null,
                    message.content,
                    message.created_at
                ]
            );
            messageCount++;
        }

        console.log(`  ✓ ${messageCount} mensajes creados\n`);

        // 6. Resumen
        console.log('═══════════════════════════════════════════');
        console.log('✅ DATOS DE PRUEBA CREADOS EXITOSAMENTE');
        console.log('═══════════════════════════════════════════');
        console.log(`📱 Canales creados: ${channelIds.length}`);
        console.log(`👥 Contactos creados: ${contactIds.length}`);
        console.log(`🎫 Tickets creados: ${ticketIds.length}`);
        console.log(`💬 Mensajes creados: ${messageCount}`);
        console.log('═══════════════════════════════════════════\n');

        console.log('🎉 ¡Listo! Ahora puedes:');
        console.log('   1. Abrir http://localhost:5173');
        console.log('   2. Iniciar sesión con admin@zonochat.com / admin123');
        console.log('   3. Ver las conversaciones de prueba en el dashboard\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

createTestData();
