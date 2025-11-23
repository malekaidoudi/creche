/**
 * Script pour vérifier les logs d'emails dans la base de données
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkEmailLogs() {
    const client = await pool.connect();

    try {
        console.log('📧 Vérification des logs d\'emails...\n');

        // Vérifier si la table existe
        const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'email_logs'
      );
    `);

        if (!tableCheck.rows[0].exists) {
            console.log('⚠️  La table email_logs n\'existe pas encore.');
            console.log('   Créez-la avec le script d\'initialisation de la base de données.');
            return;
        }

        // Compter tous les emails
        const countResult = await client.query('SELECT COUNT(*) as total FROM email_logs');
        console.log(`📊 Total d'emails enregistrés: ${countResult.rows[0].total}\n`);

        if (countResult.rows[0].total === '0') {
            console.log('ℹ️  Aucun email enregistré dans les logs.');
            return;
        }

        // Compter par statut
        const statusResult = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM email_logs 
      GROUP BY status
      ORDER BY count DESC
    `);

        console.log('📈 Emails par statut:');
        statusResult.rows.forEach(row => {
            const icon = row.status === 'sent' ? '✅' : row.status === 'failed' ? '❌' : '⏳';
            console.log(`   ${icon} ${row.status}: ${row.count}`);
        });
        console.log('');

        // Compter par type
        const typeResult = await client.query(`
      SELECT email_type, COUNT(*) as count 
      FROM email_logs 
      GROUP BY email_type
      ORDER BY count DESC
    `);

        console.log('📋 Emails par type:');
        typeResult.rows.forEach(row => {
            console.log(`   • ${row.email_type}: ${row.count}`);
        });
        console.log('');

        // Afficher les 5 derniers emails
        const recentResult = await client.query(`
      SELECT 
        id,
        email_type,
        recipient_email,
        subject,
        status,
        resend_id,
        error_message,
        created_at
      FROM email_logs
      ORDER BY created_at DESC
      LIMIT 5
    `);

        if (recentResult.rows.length > 0) {
            console.log('📬 5 derniers emails:\n');
            recentResult.rows.forEach((email, index) => {
                const statusIcon = email.status === 'sent' ? '✅' : email.status === 'failed' ? '❌' : '⏳';
                console.log(`${index + 1}. ${statusIcon} ${email.email_type}`);
                console.log(`   À: ${email.recipient_email}`);
                console.log(`   Sujet: ${email.subject}`);
                console.log(`   Statut: ${email.status}`);
                if (email.resend_id) {
                    console.log(`   Resend ID: ${email.resend_id}`);
                }
                if (email.error_message) {
                    console.log(`   Erreur: ${email.error_message}`);
                }
                console.log(`   Date: ${new Date(email.created_at).toLocaleString('fr-FR')}`);
                console.log('');
            });
        }

        // Afficher les emails en échec
        const failedResult = await client.query(`
      SELECT 
        email_type,
        recipient_email,
        error_message,
        created_at
      FROM email_logs
      WHERE status = 'failed'
      ORDER BY created_at DESC
      LIMIT 3
    `);

        if (failedResult.rows.length > 0) {
            console.log('❌ Emails en échec récents:\n');
            failedResult.rows.forEach((email, index) => {
                console.log(`${index + 1}. ${email.email_type} → ${email.recipient_email}`);
                console.log(`   Erreur: ${email.error_message}`);
                console.log(`   Date: ${new Date(email.created_at).toLocaleString('fr-FR')}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkEmailLogs();
