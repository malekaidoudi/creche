/**
 * Script de test SMTP Hostinger
 */
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSMTP() {
    console.log('🔧 Configuration SMTP:');
    console.log('  Host:', process.env.SMTP_HOST);
    console.log('  Port:', process.env.SMTP_PORT);
    console.log('  Secure:', process.env.SMTP_SECURE);
    console.log('  User:', process.env.SMTP_USER);
    console.log('  Pass:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-3) : 'NON DÉFINI');

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ Configuration SMTP incomplète!');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        debug: true,
        logger: true
    });

    console.log('\n📧 Test de connexion SMTP...');

    try {
        // Vérifier la connexion
        await transporter.verify();
        console.log('✅ Connexion SMTP réussie!');

        // Envoyer un email de test
        const testEmail = process.argv[2] || 'aidoudimalek@yahoo.com';
        console.log(`\n📤 Envoi d'un email de test à ${testEmail}...`);

        const result = await transporter.sendMail({
            from: `Crèche Mima Elghalia <${process.env.SMTP_USER}>`,
            to: testEmail,
            subject: '🧪 Test SMTP - Crèche Mima Elghalia',
            html: `
        <h1>Test SMTP réussi!</h1>
        <p>Cet email confirme que la configuration SMTP fonctionne correctement.</p>
        <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
      `
        });

        console.log('✅ Email envoyé avec succès!');
        console.log('  Message ID:', result.messageId);

    } catch (error) {
        console.error('❌ Erreur SMTP:', error.message);
        console.error('  Code:', error.code);
        console.error('  Détails:', error);
    }
}

testSMTP();
