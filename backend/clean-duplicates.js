require('dotenv').config();
const db = require('./src/config/database');

async function cleanDuplicates() {
    console.log('\n🧹 LIMPIANDO CONTACTOS Y TICKETS DUPLICADOS...\n');

    try {
        // Eliminar el contacto "Usuario Messenger" y su ticket
        console.log('1️⃣ Eliminando contacto "Usuario Messenger"...');

        const [contact] = await db.query(
            "SELECT id FROM contacts WHERE name = 'Usuario Messenger'"
        );

        if (contact.length > 0) {
            const contactId = contact[0].id;

            // Eliminar mensajes del ticket
            await db.query(
                'DELETE m FROM messages m JOIN tickets t ON m.ticket_id = t.id WHERE t.contact_id = ?',
                [contactId]
            );
            console.log('   ✅ Mensajes eliminados');

            // Eliminar tickets
            await db.query('DELETE FROM tickets WHERE contact_id = ?', [contactId]);
            console.log('   ✅ Tickets eliminados');

            // Eliminar contacto
            await db.query('DELETE FROM contacts WHERE id = ?', [contactId]);
            console.log('   ✅ Contacto eliminado\n');
        } else {
            console.log('   ℹ️  No se encontró el contacto "Usuario Messenger"\n');
        }

        // Mostrar estado final
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 ESTADO FINAL:\n');

        const [contacts] = await db.query(`
            SELECT c.*, ch.name as channel_name
            FROM contacts c
            LEFT JOIN channels ch ON c.channel_id = ch.id
            WHERE c.channel = 'messenger'
        `);

        console.log(`Total de contactos de Messenger: ${contacts.length}\n`);
        contacts.forEach((c, i) => {
            console.log(`${i + 1}. ${c.name} (External ID: ${c.external_id})`);
        });

        const [tickets] = await db.query(`
            SELECT COUNT(*) as total
            FROM tickets t
            JOIN contacts c ON t.contact_id = c.id
            WHERE c.channel = 'messenger' AND t.assigned_to IS NULL AND t.status = 'open'
        `);

        console.log(`\n📋 Tickets en holding: ${tickets[0].total}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('✅ Limpieza completada\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

cleanDuplicates();
