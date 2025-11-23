/**
 * Script de test pour vérifier la configuration Resend
 */

require('dotenv').config();
const { Resend } = require('resend');

async function testResend() {
    console.log('🧪 Test de configuration Resend\n');

    // Vérifier les variables d'environnement
    console.log('📋 Variables d\'environnement:');
    console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Définie' : '❌ Manquante'}`);
    console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM || '❌ Manquante'}`);
    console.log(`   CONTACT_EMAIL: ${process.env.CONTACT_EMAIL || '❌ Manquante'}`);
    console.log('');

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY non configurée dans .env');
        process.exit(1);
    }

    // Initialiser Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        console.log('📧 Envoi d\'un email de test...\n');

        const emailData = {
            from: process.env.EMAIL_FROM || 'Crèche Mima Elghalia <noreply@mima-elghalia.com>',
            to: process.env.CONTACT_EMAIL || 'crechemimaelghalia@gmail.com',
            subject: '🧪 Test Resend - Approbation Inscription',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .info-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Test Resend</h1>
              <p>Email de test pour l'approbation d'inscription</p>
            </div>
            <div class="content">
              <h2>Bonjour Ahmed,</h2>
              
              <p>Nous avons le plaisir de vous informer que le dossier d'inscription de <strong>Youssef</strong> a été approuvé !</p>
              
              <div class="info-box">
                <strong>📅 Rendez-vous prévu :</strong><br>
                Lundi 20 janvier 2025 à 10:00
              </div>
              
              <p>Pour finaliser votre inscription, veuillez créer votre mot de passe en cliquant sur le bouton ci-dessous :</p>
              
              <center>
                <a href="https://example.com/create-password?token=test123" class="button">
                  🔐 Créer mon mot de passe
                </a>
              </center>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Ce lien est valable pendant 48 heures.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #666; font-size: 12px;">
                Ceci est un email de test envoyé depuis le système de gestion de la crèche Mima Elghalia.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
        };

        console.log('📤 Données de l\'email:');
        console.log(`   From: ${emailData.from}`);
        console.log(`   To: ${emailData.to}`);
        console.log(`   Subject: ${emailData.subject}`);
        console.log('');

        const response = await resend.emails.send(emailData);

        console.log('✅ Email envoyé avec succès!\n');
        console.log('📊 Réponse Resend:');
        console.log(`   ID: ${response.id}`);
        console.log('');
        console.log('🔍 Vérifiez votre boîte mail:', emailData.to);
        console.log('');
        console.log('💡 Si vous ne recevez pas l\'email:');
        console.log('   1. Vérifiez le dossier spam/courrier indésirable');
        console.log('   2. Vérifiez que le domaine est vérifié dans Resend');
        console.log('   3. Consultez les logs Resend: https://resend.com/emails');

    } catch (error) {
        console.error('\n❌ ERREUR lors de l\'envoi:\n');
        console.error('Message:', error.message);

        if (error.message.includes('API key')) {
            console.error('\n💡 Solution: Vérifiez que votre RESEND_API_KEY est correcte');
        } else if (error.message.includes('domain')) {
            console.error('\n💡 Solution: Vérifiez que votre domaine est vérifié dans Resend');
            console.error('   Allez sur: https://resend.com/domains');
        } else if (error.message.includes('from')) {
            console.error('\n💡 Solution: Vérifiez le format de EMAIL_FROM dans .env');
            console.error('   Format attendu: "Nom <email@domaine.com>"');
        }

        console.error('\n📋 Détails complets de l\'erreur:');
        console.error(error);

        process.exit(1);
    }
}

// Lancer le test
testResend();
